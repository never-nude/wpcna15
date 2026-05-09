const manualEvents = require("./events.json");

let autoEvents = [];

try {
  autoEvents = require("./events.auto.json");
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") {
    throw error;
  }
}

const TIME_ZONE = "America/New_York";
const MAX_UPCOMING_PER_MONTH = 20;
const MAX_UPCOMING_PER_SERIES_PER_MONTH = 3;
const HOME_UPCOMING_LIMIT = 6;
const HOME_UPCOMING_POOL_SIZE = 30;
const MIN_UPCOMING_SELECTION_SCORE = 10;
const HTML_ENTITY_MAP = {
  "&amp;": "&",
  "&quot;": "\"",
  "&#39;": "'",
  "&#8217;": "'",
  "&rsquo;": "'",
  "&ldquo;": "\"",
  "&rdquo;": "\"",
  "&#8220;": "\"",
  "&#8221;": "\"",
  "&reg;": "",
  "&nbsp;": " ",
  "&ndash;": "-",
  "&mdash;": "-",
  "&hellip;": "..."
};

function getTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(new Date())
    .replaceAll("/", "-");
}

function normalizeUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const normalized = new URL(url);
    normalized.pathname = normalized.pathname.replace(/\/{2,}/g, "/");
    return normalized.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function decodeHtmlEntities(value = "") {
  return Object.entries(HTML_ENTITY_MAP).reduce(
    (text, [entity, replacement]) => text.split(entity).join(replacement),
    String(value)
  );
}

function cleanVisibleText(value = "") {
  return decodeHtmlEntities(String(value).replace(/<[^>]+>/g, " "))
    .replace(/\b(am|pm)(?=[A-Z])/gi, "$1 ")
    .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")
    .replace(/([.)])([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .trim();
}

function cleanParagraphText(value = "") {
  return decodeHtmlEntities(String(value))
    .split(/\n\s*\n/)
    .map((paragraph) => cleanVisibleText(paragraph))
    .filter(Boolean)
    .join("\n\n");
}

function normalizeEventCategory(category = "") {
  const cleaned = cleanVisibleText(category);

  return cleaned === "Community" ? "Local" : cleaned;
}

function normalizeImportedTitle(title = "") {
  return cleanVisibleText(title)
    .replace(/^See details\s+/i, "")
    .replace(/"([^"]+)"/g, "$1")
    .replace(/\bA\.I\.\b/g, "AI")
    .replace(/Short-Story\/Film/g, "Short Story Film")
    .replace(/\s+White Plains Performing Arts Center$/i, "")
    .replace(/\s+-\s+/g, ": ");
}

function normalizeSourceLabel(event) {
  const organizer = cleanVisibleText(event.organizer);

  if (organizer === "City of White Plains") {
    return "City of White Plains";
  }

  if (organizer === "White Plains Public Library") {
    return "White Plains Public Library";
  }

  if (organizer === "White Plains Business Improvement District") {
    return "White Plains BID";
  }

  if (organizer === "White Plains Performing Arts Center") {
    return "White Plains Performing Arts Center";
  }

  return cleanVisibleText(event.sourceLabel) || organizer || "Original source";
}

function normalizeCtaLabel(event) {
  const label = cleanVisibleText(event.ctaLabel);
  const organizer = cleanVisibleText(event.organizer);

  if (/ticket/i.test(label) || /register/i.test(label) || /materials/i.test(label) || /map/i.test(label)) {
    return label;
  }

  if (/flyer/i.test(label)) {
    return "Open flyer";
  }

  if (/show page/i.test(label)) {
    return "Show details";
  }

  if (/open .*page/i.test(label) || /^learn more$/i.test(label) || !label) {
    if (organizer === "City of White Plains") {
      return "City details";
    }

    if (organizer === "White Plains Public Library") {
      return "Library details";
    }

    if (organizer === "White Plains Business Improvement District") {
      return "Event details";
    }

    if (organizer === "White Plains Performing Arts Center") {
      return "Show details";
    }

    return "Get details";
  }

  return label;
}

function normalizeLocationName(event) {
  const organizer = cleanVisibleText(event.organizer);
  const cleaned = cleanVisibleText(event.locationName)
    .replace(/\bAsk Staff For More Information\b/gi, "")
    .replace(/\bMamaroneck Ave(?=\.|\b)/gi, "Mamaroneck Avenue")
    .replace(/\bCourt St(?=\.|\b)/gi, "Court Street")
    .replace(/\bNorth St(?=\.|\b)/gi, "North Street")
    .replace(/\bChurch St(?=\.|\b)/gi, "Church Street")
    .replace(/\bS\. Lexington Ave(?=\.|\b)/gi, "South Lexington Avenue")
    .replace(/\bAvenue\./g, "Avenue")
    .replace(/\bStreet\./g, "Street")
    .replace(/\bAve\.(?=,|\s|$)/gi, "Avenue")
    .replace(/\bSt\.(?!\s+Patrick)(?=,|\s|$)/gi, "Street")
    .replace(/\bRd\.(?=,|\s|$)/gi, "Road")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\.\.+/g, ".")
    .replace(/\s*,\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (organizer === "White Plains Public Library" && /White Plains Public Library/i.test(cleaned)) {
    return "White Plains Public Library";
  }

  return cleaned;
}

function normalizeLocationAddress(event) {
  return cleanVisibleText(event.locationAddress)
    .replace(/\bMamaroneck Ave(?=\.|\b)/gi, "Mamaroneck Avenue")
    .replace(/\bCourt St(?=\.|\b)/gi, "Court Street")
    .replace(/\bNorth St(?=\.|\b)/gi, "North Street")
    .replace(/\bChurch St(?=\.|\b)/gi, "Church Street")
    .replace(/\bS\. Lexington Ave(?=\.|\b)/gi, "South Lexington Avenue")
    .replace(/\bAvenue\./g, "Avenue")
    .replace(/\bStreet\./g, "Street")
    .replace(/\bAve\.(?=,|\s|$)/gi, "Avenue")
    .replace(/\bSt\.(?!\s+Patrick)(?=,|\s|$)/gi, "Street")
    .replace(/\bRd\.(?=,|\s|$)/gi, "Road")
    .replace(/\.\.+/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function buildGenericCitySummary(event) {
  const title = normalizeImportedTitle(event.title);
  const location = normalizeLocationName(event);

  if (/meeting|board|commission|council|hearing|agency|corporation|review/i.test(title)) {
    if (location && location.toLowerCase() !== "white plains") {
      return `Public meeting at ${location}. Agenda and updates are available from the City.`;
    }

    return "Public city meeting in White Plains. Agenda and updates are available from the City.";
  }

  if (location && location.toLowerCase() !== "white plains") {
    return `${title} at ${location}. Details are available from the City.`;
  }

  return `${title} in White Plains. Details are available from the City.`;
}

function normalizeShortSummary(event) {
  const title = normalizeImportedTitle(event.title);
  const cleaned = cleanVisibleText(event.shortSummary)
    .replace(/^Location:\s*/i, "")
    .replace(/\bMamaroneck Ave(?=\.|\b)/gi, "Mamaroneck Avenue")
    .replace(/\bAve\.(?=,|\s|$)/gi, "Avenue")
    .replace(/\bSt\.(?!\s+Patrick)(?=,|\s|$)/gi, "Street")
    .replace(/\b(Avenue|Street|Road)\.,/gi, "$1,")
    .replace(/\bRd\.(?=,|\s|$)/gi, "Road")
    .trim();

  if (!cleaned) {
    return buildGenericCitySummary(event);
  }

  if (/soccer fest/i.test(title) && /Block Party/i.test(cleaned)) {
    return "A downtown fan festival and block party on Mamaroneck Avenue with family-friendly activities.";
  }

  if (/rock the block/i.test(title)) {
    return "Downtown summer street music and dining on Mamaroneck Avenue.";
  }

  if (/is listed on the official White Plains city calendar/i.test(cleaned)) {
    return buildGenericCitySummary(event);
  }

  return cleaned;
}

function normalizeFullDescription(event) {
  const cleaned = cleanParagraphText(event.fullDescription);
  const title = normalizeImportedTitle(event.title);
  const location = normalizeLocationName(event);

  if (/soccer fest/i.test(title) && /Block Party/i.test(cleaned)) {
    return "White Plains Soccer Fest brings a downtown fan festival and block party to Mamaroneck Avenue with family-friendly activities, food, and shuttle information from the BID.\n\nUse the BID page for schedule details, participating businesses, and weather updates.";
  }

  if (/rock the block/i.test(title)) {
    return "Rock the Block is a downtown summer street series on Mamaroneck Avenue with live music, dining, and family activity.\n\nUse the BID page for lineup details, participating businesses, and weather updates.";
  }

  if (/is listed on the official White Plains city calendar/i.test(cleaned)) {
    if (/meeting|board|commission|council|hearing|agency|corporation|review/i.test(title)) {
      if (location && location.toLowerCase() !== "white plains") {
        return `${title} is on the City of White Plains calendar for ${location}.\n\nUse the City listing for the agenda, location updates, and schedule changes.`;
      }

      return `${title} is on the City of White Plains calendar.\n\nUse the City listing for the agenda, location updates, and schedule changes.`;
    }

    if (location && location.toLowerCase() !== "white plains") {
      return `${title} is on the City of White Plains calendar for ${location}.\n\nUse the City listing for details, updates, and any schedule changes.`;
    }

    return `${title} is on the City of White Plains calendar.\n\nUse the City listing for details, updates, and any schedule changes.`;
  }

  return cleaned;
}

function normalizeEventCopy(event) {
  return {
    ...event,
    title: normalizeImportedTitle(event.title),
    shortSummary: normalizeShortSummary(event),
    fullDescription: normalizeFullDescription(event),
    category: normalizeEventCategory(event.category),
    organizer: cleanVisibleText(event.organizer),
    locationName: normalizeLocationName(event),
    locationAddress: normalizeLocationAddress(event),
    sourceLabel: normalizeSourceLabel(event),
    ctaLabel: normalizeCtaLabel(event),
    tags: (event.tags || []).map((tag) => cleanVisibleText(tag)).filter(Boolean)
  };
}

function eventKeys(event) {
  const keys = [];

  if (event.id) {
    keys.push(`id:${event.id}`);
  }

  if (event.slug) {
    keys.push(`slug:${event.slug}`);
  }

  for (const url of [event.externalUrl, event.sourceUrl]) {
    const normalizedUrl = normalizeUrl(url);
    if (normalizedUrl) {
      keys.push(`url:${normalizedUrl}`);
    }
  }

  if (event.title && event.startDate) {
    keys.push(`title:${normalizeText(event.title)}|${event.startDate}|${normalizeText(event.locationName)}`);
  }

  return [...new Set(keys)];
}

function mergeEvents(autoItems, manualItems) {
  const merged = [];
  const keyToIndex = new Map();

  function upsert(event, priority) {
    const keys = eventKeys(event);
    const matchedKey = keys.find((key) => keyToIndex.has(key));

    if (!matchedKey) {
      const index = merged.push({ ...event, __priority: priority }) - 1;
      keys.forEach((key) => keyToIndex.set(key, index));
      return;
    }

    const index = keyToIndex.get(matchedKey);
    if (priority < merged[index].__priority) {
      return;
    }

    merged[index] = { ...event, __priority: priority };
    keys.forEach((key) => keyToIndex.set(key, index));
  }

  autoItems.forEach((event) => upsert(event, 0));
  manualItems.forEach((event) => upsert(event, 1));

  return merged.map(({ __priority, ...event }) => event);
}

function deriveStatus(event, todayIso) {
  if (!event.startDate) {
    return event.status || "upcoming";
  }

  const endDate = event.endDate || event.startDate;
  return endDate < todayIso ? "past" : "upcoming";
}

function scoreRelated(baseEvent, candidate) {
  let score = 0;

  if (baseEvent.category === candidate.category) {
    score += 4;
  }

  const sharedTags = candidate.tags.filter((tag) => baseEvent.tags.includes(tag));
  score += sharedTags.length;

  if (baseEvent.organizer === candidate.organizer) {
    score += 2;
  }

  if (baseEvent.status === candidate.status) {
    score += 1;
  }

  return score;
}

function buildPrimaryAction(event) {
  if (event.externalUrl) {
    return {
      label: event.ctaLabel || "Get info",
      url: event.externalUrl
    };
  }

  if (event.flyerPdf) {
    return {
      label: event.ctaLabel || "Open flyer",
      url: event.flyerPdf
    };
  }

  return null;
}

function buildSecondaryLinks(event) {
  const links = [];

  if (event.flyerPdf && event.flyerPdf !== event.externalUrl) {
    links.push({
      label: "Open flyer (PDF)",
      url: event.flyerPdf
    });
  }

  if (event.sourceUrl && event.sourceUrl !== event.externalUrl) {
    links.push({
      label: event.sourceLabel || "Original source",
      url: event.sourceUrl
    });
  }

  return links;
}

function compareUpcoming(a, b) {
  return `${a.startDate}${a.startTime || "00:00"}`.localeCompare(`${b.startDate}${b.startTime || "00:00"}`);
}

function comparePast(a, b) {
  return `${b.startDate}${b.startTime || "00:00"}`.localeCompare(`${a.startDate}${a.startTime || "00:00"}`);
}

function scoreUpcomingSelection(event) {
  const haystack = [
    event.title,
    event.category,
    event.organizer,
    event.shortSummary,
    ...(event.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  if (!event.importSource) {
    score += 100;
  }

  if (event.organizer && event.organizer.toLowerCase().includes("white plains council of neighborhood associations")) {
    score += 50;
  }

  if (event.featured) {
    score += 35;
  }

  if (event.importSource === "bid") {
    score += 16;
  } else if (event.importSource === "wppac") {
    score += 14;
  } else if (event.importSource === "city") {
    score += 10;
  } else if (event.importSource === "library") {
    score += 8;
  }

  if (event.category === "Food & Downtown" || event.category === "Music & Family") {
    score += 14;
  } else if (event.category === "Family" || event.category === "Arts") {
    score += 11;
  } else if (event.category === "Workshop") {
    score += 10;
  } else if (event.category === "Local") {
    score += 9;
  } else if (event.category === "Learning") {
    score += 8;
  } else if (event.category === "Civic") {
    score += 7;
  }

  if (/\b(festival|parade|market|concert|show|theater|theatre|wing walk|rock the block|holiday|pride|juneteenth|soccer fest|family|music|downtown|tickets|workshop|public hearing|youth leadership|earth day)\b/.test(haystack)) {
    score += 14;
  }

  if (/\b(common council meeting|vision zero|housing|financial aid|energy|college|genealogy|narcan|history|white plains)\b/.test(haystack)) {
    score += 9;
  }

  if (/\b(work session|board|commission|agency|corporation|review board|transportation commission|conservation board|planning board|zoning board|special meeting)\b/.test(haystack)) {
    score -= 18;
  }

  return score;
}

function compareUpcomingSelection(a, b) {
  const scoreDiff = scoreUpcomingSelection(b) - scoreUpcomingSelection(a);

  if (scoreDiff !== 0) {
    return scoreDiff;
  }

  return compareUpcoming(a, b);
}

function eventSeriesKey(event) {
  const title = String(event.title || "").trim();

  if (!title) {
    return "";
  }

  const prefixed = title.split(/\s[-:]\s/)[0].trim();
  const base = prefixed.length >= 8 ? prefixed : title;

  return normalizeText(base);
}

function displayDedupeKey(event) {
  let title = normalizeText(event.title)
    .replace(
      /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\s+[—-]\s+/,
      ""
    )
    .replace(/\b20\d{2}\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (/rock the block/.test(title)) {
    title = "downtown white plains rock the block";
  }

  if (/soccer fest/.test(title) && /(white plains soccer fest|block party|fan fest)/.test(title)) {
    title = "white plains soccer fest block party";
  }

  return [event.startDate, event.startTime || "", title].join("|");
}

function displayDedupePriority(event) {
  if (!event.importSource) return 100;
  if (event.importSource === "bid") return 30;
  if (event.importSource === "wppac") return 25;
  if (event.importSource === "library") return 20;
  if (event.importSource === "city") return 15;
  return 10;
}

function dedupeDisplayEvents(events) {
  const selected = [];
  const keyToIndex = new Map();

  for (const event of events) {
    const key = displayDedupeKey(event);
    const existingIndex = keyToIndex.get(key);

    if (existingIndex === undefined) {
      keyToIndex.set(key, selected.push(event) - 1);
      continue;
    }

    const existing = selected[existingIndex];
    if (displayDedupePriority(event) > displayDedupePriority(existing)) {
      selected[existingIndex] = event;
    }
  }

  return selected.sort(compareUpcoming);
}

function limitUpcomingByMonth(events) {
  const monthMap = new Map();

  for (const event of events) {
    const list = monthMap.get(event.monthKey) || [];
    list.push(event);
    monthMap.set(event.monthKey, list);
  }

  return [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .flatMap(([, monthEvents]) => {
      const selected = [];
      const seriesCounts = new Map();

      for (const event of monthEvents.sort(compareUpcomingSelection)) {
        const seriesKey = eventSeriesKey(event);
        const seriesCount = seriesCounts.get(seriesKey) || 0;
        const eventScore = scoreUpcomingSelection(event);

        if (selected.length >= MAX_UPCOMING_PER_MONTH) {
          break;
        }

        if (eventScore < MIN_UPCOMING_SELECTION_SCORE) {
          continue;
        }

        if (seriesKey && seriesCount >= MAX_UPCOMING_PER_SERIES_PER_MONTH) {
          continue;
        }

        selected.push(event);
        if (seriesKey) {
          seriesCounts.set(seriesKey, seriesCount + 1);
        }
      }

      return selected.sort(compareUpcoming);
    });
}

function buildRelatedPreview(event) {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    category: event.category,
    shortSummary: event.shortSummary,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime,
    locationName: event.locationName,
    organizer: event.organizer,
    status: event.status,
    monthKey: event.monthKey,
    displayImage: event.displayImage,
    searchText: event.searchText,
    detailUrl: event.detailUrl,
    primaryAction: event.primaryAction
  };
}

const todayIso = getTodayIso();
const mergedEvents = mergeEvents(autoEvents, manualEvents);

const all = mergedEvents.map((rawEvent) => {
  const event = normalizeEventCopy(rawEvent);
  const hasIllustration = Boolean(event.image && event.image.startsWith("/assets/img/events/"));

  return {
    ...event,
    status: deriveStatus(event, todayIso),
    detailUrl: `/events/${event.slug}/`,
    primaryAction: buildPrimaryAction(event),
    secondaryLinks: buildSecondaryLinks(event),
    monthKey: event.startDate.slice(0, 7),
    hasIllustration,
    displayImage: hasIllustration ? null : event.image,
    searchText: [
      event.title,
      event.category,
      event.organizer,
      event.shortSummary,
      event.locationName,
      event.locationAddress,
      ...(event.tags || [])
    ]
      .join(" ")
      .toLowerCase()
  };
});

const rawUpcoming = all.filter((event) => event.status === "upcoming").sort(compareUpcoming);
const selectedUpcoming = limitUpcomingByMonth(rawUpcoming);
const upcoming = dedupeDisplayEvents(selectedUpcoming);
const selectedUpcomingSlugSet = new Set(selectedUpcoming.map((event) => event.slug));
const past = all.filter((event) => event.status === "past").sort(comparePast);
const visibleAll = all.filter(
  (event) => event.status === "past" || selectedUpcomingSlugSet.has(event.slug)
);

const bySlug = new Map(visibleAll.map((event) => [event.slug, event]));

for (const event of visibleAll) {
  event.relatedEvents = visibleAll
    .filter((candidate) => candidate.slug !== event.slug)
    .map((candidate) => ({
      candidate,
      score: scoreRelated(event, candidate)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return compareUpcoming(a.candidate, b.candidate);
    })
    .slice(0, 3)
    .map((entry) => buildRelatedPreview(entry.candidate));
}

const categories = [...new Set(visibleAll.map((event) => event.category))].sort();
const months = [...new Set(visibleAll.map((event) => event.monthKey))].sort();

const featuredUpcoming = upcoming.filter((event) => event.featured);
const featuredPast = past.filter((event) => event.featured);
const homeUpcoming = upcoming.slice(0, HOME_UPCOMING_POOL_SIZE);
const homePast = (featuredPast.length ? featuredPast : past).slice(0, 4);

module.exports = {
  all: visibleAll,
  bySlug,
  upcoming,
  past,
  categories,
  months,
  homeUpcomingLimit: HOME_UPCOMING_LIMIT,
  homeUpcoming,
  homePast
};
