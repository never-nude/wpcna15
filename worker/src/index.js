import contentIndex from "./content-index.js";
import { createRetriever } from "./retrieval.js";
import { FALLBACK_ANSWER, generateAnswer } from "./openai.js";

const QUESTION_MAX_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 12;
const ABUSIVE_PATTERN = /\b(?:kill yourself|kys|nigger|faggot|rape|rapist)\b/i;
const GREETING_PATTERN = /^(?:hi|hello|hey|hiya|good morning|good afternoon|good evening)(?:\s+there)?[!.?]*$/i;
const CAPABILITY_PATTERN = /^(?:help|what can you do|what do you do|who are you|how can you help|what should i ask)(?:\??)$/i;
const SHORT_GENERIC_PATTERN = /^(?:thanks|thank you|ok|okay|cool|nice|test|testing)[!.?]*$/i;
const SCHEDULE_INTENT_PATTERN = /\b(?:when|next|upcoming|today|tonight|tomorrow|date|time)\b/i;
const EVENT_SUBJECT_PATTERN = /\b(?:meeting|meetings|event|events|session|sessions|hearing|hearings|workshop|workshops|council|board|commission)\b/i;
const EVENT_FIELD_LABELS = new Set(["Status", "Date", "Time", "Location", "Address", "Source"]);
const EVENT_FIELD_STOP_LINES = new Set(["More Events", "Related events", "More Resources", "Related resources"]);
const LOOKUP_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "how",
  "i",
  "in",
  "is",
  "me",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "when",
  "where"
]);
const rateLimitStore = new Map();
const retrieveSources = createRetriever(contentIndex.items || []);

function normalizeQuestion(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeLookupText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeLookup(value = "") {
  return normalizeLookupText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !LOOKUP_STOP_WORDS.has(token));
}

function jsonResponse(body, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders
    }
  });
}

function errorResponse(message, status, corsHeaders = {}) {
  return jsonResponse({ error: message }, status, corsHeaders);
}

function parseAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildCorsHeaders(origin, env) {
  const allowedOrigins = parseAllowedOrigins(env);

  if (!origin) {
    return {};
  }

  if (allowedOrigins.includes("*")) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    };
  }

  if (allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    };
  }

  return null;
}

function isRateLimited(ipAddress) {
  const now = Date.now();

  for (const [ip, state] of rateLimitStore.entries()) {
    if (now - state.startedAt > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }

  const current = rateLimitStore.get(ipAddress);

  if (!current) {
    rateLimitStore.set(ipAddress, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

function isRejectedQuestion(question) {
  return ABUSIVE_PATTERN.test(question);
}

function isScopePrompt(question) {
  return (
    GREETING_PATTERN.test(question) ||
    CAPABILITY_PATTERN.test(question) ||
    SHORT_GENERIC_PATTERN.test(question)
  );
}

function cleanAnswer(answer) {
  return String(answer || "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function scopeAnswer() {
  return [
    "Hi. Ask about neighborhoods, WPCNA, agendas, events, community posting, the CNA Workshop Handbook, and local resources covered on this site.",
    "Try something like: What does WPCNA do? Where can I find agendas? Tell me about Fisher Hill."
  ].join("\n\n");
}

function dedupeSources(sources) {
  const seen = new Set();

  return sources.filter((source) => {
    const key = source.url || source.sourceId || source.title;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildVisibleSources(sources) {
  return dedupeSources(sources).slice(0, 4).map((source) => ({
    title: source.title,
    url: source.url,
    type: source.type,
    excerpt: source.excerpt
  }));
}

function extractEventFields(text = "") {
  const lines = String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const fields = {};
  let inAtAGlance = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line === "At a Glance") {
      inAtAGlance = true;
      continue;
    }

    if (!inAtAGlance || !EVENT_FIELD_LABELS.has(line)) {
      continue;
    }

    const values = [];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor];

      if (EVENT_FIELD_LABELS.has(candidate) || EVENT_FIELD_STOP_LINES.has(candidate)) {
        break;
      }

      values.push(candidate);
    }

    fields[line.toLowerCase()] = values.join(" ").trim();
  }

  return fields;
}

function parseEventDate(dateLabel = "", url = "") {
  const urlMatch = String(url).match(/(\d{4})-(\d{2})-(\d{2})/);

  if (urlMatch) {
    const [, year, month, day] = urlMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const parsed = Date.parse(dateLabel);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function parseEventSource(source) {
  if (source.type !== "event") {
    return null;
  }

  const fields = extractEventFields(source.text);
  const parsedDate = parseEventDate(fields.date, source.url);

  if (!fields.date && !parsedDate) {
    return null;
  }

  return {
    source,
    title: source.title,
    normalizedTitle: normalizeLookupText(source.title),
    normalizedLocation: normalizeLookupText(fields.location),
    status: normalizeLookupText(fields.status),
    date: parsedDate,
    dateLabel: fields.date || "",
    time: fields.time || "",
    location: fields.location || "",
    address: fields.address || "",
    publisher: fields.source || ""
  };
}

function isScheduleQuestion(question) {
  return SCHEDULE_INTENT_PATTERN.test(question) && EVENT_SUBJECT_PATTERN.test(question);
}

function scoreEventCandidate(candidate, question, referenceDate) {
  const normalizedQuestion = normalizeLookupText(question);
  const questionTokens = tokenizeLookup(question);
  const wantsUpcoming = /\b(?:next|upcoming|today|tonight|tomorrow|when)\b/i.test(question);
  const referenceTime = referenceDate.getTime();
  let score = Number(candidate.source.score || 0);

  if (candidate.normalizedTitle && normalizedQuestion.includes(candidate.normalizedTitle)) {
    score += 18;
  }

  questionTokens.forEach((token) => {
    if (candidate.normalizedTitle.includes(token)) {
      score += 6;
    }

    if (candidate.normalizedLocation.includes(token)) {
      score += 3;
    }
  });

  if (candidate.status === "upcoming") {
    score += 8;
  }

  if (candidate.date && candidate.date.getTime() >= referenceTime) {
    score += 6;
  }

  if (wantsUpcoming && candidate.date && candidate.date.getTime() >= referenceTime) {
    score += 14;
  }

  if (wantsUpcoming && candidate.status === "past") {
    score -= 12;
  }

  return score;
}

function buildStructuredScheduleAnswer(question, sources, referenceDate = new Date()) {
  if (!isScheduleQuestion(question)) {
    return null;
  }

  const referenceDay = new Date(referenceDate);
  referenceDay.setUTCHours(0, 0, 0, 0);

  const candidates = dedupeSources(sources)
    .map(parseEventSource)
    .filter(Boolean);

  if (!candidates.length) {
    return null;
  }

  const wantsUpcoming = /\b(?:next|upcoming|today|tonight|tomorrow|when)\b/i.test(question);
  const futureCandidates = candidates.filter((candidate) => candidate.date && candidate.date.getTime() >= referenceDay.getTime());
  const upcomingCandidates = candidates.filter((candidate) => candidate.status === "upcoming");
  const pool = wantsUpcoming
    ? (futureCandidates.length ? futureCandidates : (upcomingCandidates.length ? upcomingCandidates : candidates))
    : candidates;

  const ranked = [...pool].sort((left, right) => {
    const scoreDifference = scoreEventCandidate(right, question, referenceDay) - scoreEventCandidate(left, question, referenceDay);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    if (left.date && right.date) {
      return left.date.getTime() - right.date.getTime();
    }

    return 0;
  });

  const best = ranked[0];

  if (!best || (!best.dateLabel && !best.time)) {
    return null;
  }

  const schedule = [best.dateLabel, best.time ? `at ${best.time}` : ""]
    .filter(Boolean)
    .join(" ");
  const answerParts = [
    wantsUpcoming
      ? `The next ${best.title} in the current WPCNA sources is ${schedule}.`
      : `${best.title} is listed for ${schedule}.`
  ];

  if (best.location && best.address) {
    answerParts.push(`It is listed at ${best.location}, ${best.address}.`);
  } else if (best.location) {
    answerParts.push(`It is listed at ${best.location}.`);
  } else if (best.address) {
    answerParts.push(`It is listed at ${best.address}.`);
  }

  if (best.publisher) {
    answerParts.push(`Source: ${best.publisher}.`);
  }

  return {
    answer: answerParts.join(" "),
    sources: [best.source, ...sources.filter((source) => source.url !== best.source.url)]
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = buildCorsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders || {}
      });
    }

    if (origin && !corsHeaders) {
      return errorResponse("Origin not allowed.", 403);
    }

    if (request.method === "GET") {
      return jsonResponse(
        {
          ok: true,
          name: "Ask White Plains API",
          itemCount: contentIndex.itemCount || 0
        },
        200,
        corsHeaders || {}
      );
    }

    if (request.method !== "POST") {
      return errorResponse("Method not allowed.", 405, corsHeaders || {});
    }

    const ipAddress = request.headers.get("CF-Connecting-IP") || "unknown";

    if (isRateLimited(ipAddress)) {
      return errorResponse("Too many requests. Please try again in a few minutes.", 429, corsHeaders || {});
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body.", 400, corsHeaders || {});
    }

    const question = normalizeQuestion(body?.question);

    if (!question) {
      return errorResponse("Enter a question before submitting.", 422, corsHeaders || {});
    }

    if (question.length > QUESTION_MAX_LENGTH) {
      return errorResponse(`Questions must be ${QUESTION_MAX_LENGTH} characters or fewer.`, 422, corsHeaders || {});
    }

    if (isRejectedQuestion(question)) {
      return errorResponse("That question cannot be processed by this civic assistant.", 422, corsHeaders || {});
    }

    if (isScopePrompt(question)) {
      return jsonResponse(
        {
          answer: scopeAnswer(),
          sources: []
        },
        200,
        corsHeaders || {}
      );
    }

    const retrievedSources = retrieveSources(question, {
      limit: Number(env.MAX_SOURCES || 6),
      minScore: 8
    });

    if (!retrievedSources.length) {
      return jsonResponse(
        {
          answer: FALLBACK_ANSWER,
          sources: []
        },
        200,
        corsHeaders || {}
      );
    }

    const structuredAnswer = buildStructuredScheduleAnswer(question, retrievedSources);

    if (structuredAnswer) {
      return jsonResponse(
        {
          answer: cleanAnswer(structuredAnswer.answer) || FALLBACK_ANSWER,
          sources: buildVisibleSources(structuredAnswer.sources)
        },
        200,
        corsHeaders || {}
      );
    }

    let answer;

    try {
      answer = await generateAnswer({
        env,
        question,
        sources: retrievedSources
      });
    } catch (error) {
      console.error("Ask White Plains backend error:", error);
      return errorResponse("The assistant is not available right now.", 502, corsHeaders || {});
    }

    return jsonResponse(
      {
        answer: cleanAnswer(answer) || FALLBACK_ANSWER,
        sources: buildVisibleSources(retrievedSources)
      },
      200,
      corsHeaders || {}
    );
  }
};
