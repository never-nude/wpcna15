const neighborhoodStore = require("./neighborhoodStore");
const featuredNeighborhoodMap = require("./featuredNeighborhoodMap");
const mapRegionBySlug = new Map(
  (featuredNeighborhoodMap.allRegions || featuredNeighborhoodMap.regions).map((region) => [
    region.slug,
    region
  ])
);
const includeGedneyMeadows = true;

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
  const isFisherHill = slug === "fisher-hill";
  const teaser = isFisherHill
    ? overrides.teaser || neighborhood.teaser
    : neighborhood.displayTeaser || "Description coming soon";

  if (!neighborhood) {
    throw new Error(`Missing represented neighborhood data for slug: ${slug}`);
  }

  const bodyParagraphs = isFisherHill
    ? removeLeadDupes(
        uniqueParagraphs(overrides.bodyParagraphs || neighborhood.detailParagraphs || []),
        teaser
      )
    : [];

  return {
    slug: overrides.slug || slug,
    name: overrides.name || neighborhood.name,
    group: overrides.group || neighborhood.group,
    teaser,
    bodyParagraphs,
    profilePlaceholder: !isFisherHill,
    guideImageLabel: neighborhood.guideImageLabel || "Image coming soon",
    hero: isFisherHill && neighborhood.hero
      ? {
          imagePath: neighborhood.hero.imagePath,
          cardImagePath: neighborhood.hero.cardImagePath,
          altText: neighborhood.hero.altText,
          cardAltText: neighborhood.hero.cardAltText
        }
      : null,
    resourceLinks: neighborhood.resourceLinks || [],
    association: isFisherHill ? overrides.association || neighborhood.association || null : null,
    detailUrl: neighborhood.detailUrl,
    reviewNote: overrides.reviewNote || "",
    aliases: overrides.aliases || [],
    isPlaceholder: false,
    mapRegionSlug: mapRegion ? mapSlug : "",
    mapRegion: mapRegion
      ? {
          pathD: mapRegion.pathD,
          points: mapRegion.points || ""
        }
      : null
  };
}

const items = [
  buildExisting("north-broadway"),
  buildExisting("battle-hill"),
  buildExisting("fisher-hill"),
  buildExisting("highlands"),
  buildExisting("carhart"),
  buildExisting("gedney-farms"),
  buildExisting("north-street"),
  buildExisting("rosedale"),
  buildExisting("old-oak-ridge")
];

if (includeGedneyMeadows) {
  items.push(buildExisting("gedney-meadows"));
}

module.exports = {
  imagePath: featuredNeighborhoodMap.imagePath,
  imageVersion: featuredNeighborhoodMap.imageVersion,
  imageAlt:
    "White Plains neighborhood map with clickable highlights for the neighborhoods currently represented through WPCNA.",
  imageWidth: featuredNeighborhoodMap.imageWidth,
  imageHeight: featuredNeighborhoodMap.imageHeight,
  viewBoxWidth: featuredNeighborhoodMap.viewBoxWidth,
  viewBoxHeight: featuredNeighborhoodMap.viewBoxHeight,
  includeGedneyMeadows,
  items,
  mappedItems: items.filter((item) => item.mapRegion)
};
