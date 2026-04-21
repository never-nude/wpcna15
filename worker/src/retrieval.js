const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "about",
  "can",
  "do",
  "for",
  "find",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "where"
]);

const DATE_INTENT_TOKENS = new Set([
  "when",
  "next",
  "upcoming",
  "today",
  "tonight",
  "tomorrow",
  "date",
  "time"
]);

const TOKEN_EXPANSIONS = {
  wpcna: ["white", "plains", "council", "neighborhood", "associations"],
  cna: ["neighborhood", "association", "workshop", "wpcna"],
  agenda: ["agendas", "minutes", "meeting"],
  agendas: ["agenda", "minutes", "meeting"],
  minutes: ["agenda", "agendas", "meeting"],
  event: ["events", "calendar", "happening"],
  events: ["event", "calendar", "happening"],
  happening: ["events", "calendar"],
  happenings: ["events", "calendar"],
  handbook: ["workshop", "materials", "association"],
  workshop: ["handbook", "materials", "association"],
  association: ["associations", "neighborhood", "workshop"],
  associations: ["association", "neighborhood", "wpcna"],
  posting: ["community", "submit", "submission"],
  submit: ["posting", "community", "submission"]
};

const TOPIC_HINTS = [
  {
    when: ["agenda", "agendas", "minutes", "meeting"],
    types: ["agendas"],
    bonus: 12
  },
  {
    when: ["event", "events", "calendar", "happening", "happenings"],
    types: ["events", "event"],
    bonus: 10
  },
  {
    when: ["neighborhood", "neighborhoods", "fisher", "gedney", "downtown"],
    types: ["neighborhoods", "neighborhood", "map"],
    bonus: 10
  },
  {
    when: ["workshop", "handbook", "association", "associations", "forming"],
    types: ["handbook", "wpcna"],
    bonus: 12
  },
  {
    when: ["posting", "submit", "submission", "community"],
    types: ["community-posting"],
    bonus: 12
  }
];

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value = "") {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function expandTokens(tokens) {
  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    (TOKEN_EXPANSIONS[token] || []).forEach((extra) => expanded.add(extra));
  });

  return [...expanded];
}

function buildTokenCounts(text) {
  return tokenize(text).reduce((counts, token) => {
    counts.set(token, (counts.get(token) || 0) + 1);
    return counts;
  }, new Map());
}

function createSearchItem(item) {
  return {
    ...item,
    normalizedTitle: normalizeText(item.title),
    normalizedType: normalizeText(item.type),
    normalizedUrl: normalizeText(item.url),
    normalizedText: normalizeText(item.text),
    titleTokens: new Set(tokenize(item.title)),
    typeTokens: new Set(tokenize(item.type)),
    tokenCounts: buildTokenCounts(item.text)
  };
}

function scoreItem(item, query, tokens) {
  let score = 0;
  const isDateIntent = tokens.some((token) => DATE_INTENT_TOKENS.has(token));

  if (item.normalizedTitle.includes(query)) {
    score += 28;
  }

  if (item.normalizedText.includes(query)) {
    score += 14;
  }

  tokens.forEach((token) => {
    if (item.titleTokens.has(token)) {
      score += 10;
    }

    if (item.typeTokens.has(token)) {
      score += 5;
    }

    if (item.normalizedUrl.includes(token)) {
      score += 4;
    }

    const frequency = item.tokenCounts.get(token) || 0;
    score += Math.min(frequency, 4) * 2;
  });

  if (tokens.length && tokens.every((token) => item.titleTokens.has(token))) {
    score += 18;
  } else if (tokens.length && tokens.every((token) => item.tokenCounts.has(token) || item.normalizedUrl.includes(token))) {
    score += 8;
  }

  TOPIC_HINTS.forEach((hint) => {
    if (hint.when.some((token) => tokens.includes(token)) && hint.types.includes(item.type)) {
      score += hint.bonus;
    }
  });

  if (isDateIntent && item.type === "event") {
    if (item.normalizedText.includes("status upcoming")) {
      score += 10;
    }

    if (item.normalizedText.includes("status past")) {
      score -= 6;
    }
  }

  return score;
}

export function createRetriever(contentIndex = []) {
  const searchItems = contentIndex.map(createSearchItem);

  return function retrieveSources(question, options = {}) {
    const normalizedQuestion = normalizeText(question);
    const tokens = expandTokens(tokenize(question));
    const minScore = Number(options.minScore || 8);
    const limit = Number(options.limit || 6);

    if (!normalizedQuestion || !tokens.length) {
      return [];
    }

    return searchItems
      .map((item) => ({
        item,
        score: scoreItem(item, normalizedQuestion, tokens)
      }))
      .filter((match) => match.score >= minScore)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ item, score }) => ({
        id: item.id,
        sourceId: item.sourceId,
        title: item.title,
        url: item.url,
        type: item.type,
        excerpt: item.excerpt,
        text: item.text,
        score
      }));
  };
}
