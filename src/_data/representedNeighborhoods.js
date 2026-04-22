const neighborhoodStore = require("./neighborhoodStore");
const featuredNeighborhoodMap = require("./featuredNeighborhoodMap");
const mapRegionBySlug = new Map(
  featuredNeighborhoodMap.regions.map((region) => [region.slug, region])
);

function uniqueParagraphs(paragraphs = []) {
  const seen = new Set();

  return paragraphs
    .map((paragraph) => String(paragraph || "").trim())
    .filter(Boolean)
    .filter((paragraph) => {
      const normalized = paragraph.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function removeLeadDupes(paragraphs = [], lead = "") {
  const normalizedLead = String(lead || "").trim().toLowerCase();

  if (!normalizedLead) {
    return paragraphs;
  }

  return paragraphs.filter((paragraph) => paragraph.toLowerCase() !== normalizedLead);
}

function buildExisting(slug, overrides = {}) {
  const neighborhood = neighborhoodStore.bySlug[slug];
  const mapSlug = overrides.mapSlug || slug;
  const mapRegion = mapRegionBySlug.get(mapSlug) || null;
  const teaser = overrides.teaser || neighborhood.teaser;

  if (!neighborhood) {
    throw new Error(`Missing represented neighborhood data for slug: ${slug}`);
  }

  const bodyParagraphs = removeLeadDupes(
    uniqueParagraphs(overrides.bodyParagraphs || neighborhood.detailParagraphs || []),
    teaser
  );

  return {
    slug: overrides.slug || slug,
    name: overrides.name || neighborhood.name,
    group: overrides.group || neighborhood.group,
    teaser,
    bodyParagraphs,
    hero: neighborhood.hero
      ? {
          imagePath: neighborhood.hero.imagePath,
          altText: neighborhood.hero.altText
        }
      : null,
    detailUrl: neighborhood.detailUrl,
    reviewNote: overrides.reviewNote || "",
    isPlaceholder: false,
    mapRegionSlug: mapRegion ? mapSlug : "",
    mapRegion: mapRegion
      ? {
          points: mapRegion.points
        }
      : null
  };
}

function buildPlaceholder(config) {
  const bodyParagraphs = removeLeadDupes(
    uniqueParagraphs(config.bodyParagraphs),
    config.teaser
  );

  return {
    slug: config.slug,
    name: config.name,
    group: config.group || "WPCNA represented neighborhood",
    teaser: config.teaser,
    bodyParagraphs,
    hero: null,
    detailUrl: "",
    reviewNote: config.reviewNote || "",
    isPlaceholder: true,
    mapRegionSlug: "",
    mapRegion: null
  };
}

const items = [
  buildExisting("battle-hill"),
  buildPlaceholder({
    slug: "carhart",
    name: "Carhart",
    teaser: "Carhart is among the White Plains neighborhoods currently represented through WPCNA.",
    bodyParagraphs: [
      "Recent WPCNA meeting minutes list Carhart among the neighborhood associations currently represented in council meetings.",
      "A fuller public profile is being reviewed before publication. This placeholder keeps the represented-neighborhood list current without adding claims that still need final confirmation."
    ],
    reviewNote: "Profile under review"
  }),
  buildExisting("fisher-hill"),
  buildExisting("gedney-farms"),
  buildExisting("gedney-meadows", {
    name: "Gedney Meadow"
  }),
  buildExisting("highlands"),
  buildExisting("north-broadway"),
  buildExisting("north-street"),
  buildExisting("old-oak-ridge"),
  buildExisting("rosedale"),
  buildPlaceholder({
    slug: "stewart-ross",
    name: "Stewart Ross",
    teaser: "Stewart Ross is one of the neighborhood associations currently represented through WPCNA.",
    bodyParagraphs: [
      "Recent WPCNA meeting minutes list Stewart Ross among the neighborhoods represented in the council's current roster.",
      "A fuller public profile is being reviewed before publication so the site can reflect the association accurately without overstating details."
    ],
    reviewNote: "Profile under review"
  })
];

module.exports = {
  imagePath: featuredNeighborhoodMap.imagePath,
  imageVersion: featuredNeighborhoodMap.imageVersion,
  imageAlt:
    "White Plains neighborhood map with clickable highlights for the neighborhoods currently represented through WPCNA.",
  imageWidth: featuredNeighborhoodMap.imageWidth,
  imageHeight: featuredNeighborhoodMap.imageHeight,
  items,
  mappedItems: items.filter((item) => item.mapRegion)
};
