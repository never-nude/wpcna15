const neighborhoodStore = require("./neighborhoodStore");

const runtimePathPrefix = process.env.SITE_PATH_PREFIX || "/";
const canonicalPathPrefix = process.env.CANONICAL_PATH_PREFIX || process.env.SITE_PATH_PREFIX || "/wpcna15";
const deployBaseUrl = process.env.SITE_BASE_URL || "https://never-nude.github.io";
const cleanCanonicalPrefix = canonicalPathPrefix === "/" ? "" : canonicalPathPrefix.replace(/\/$/, "");
const homeHeroImage = "/assets/img/home/legacy-carousel/White-Plains.jpeg";
const neighborhoodsHeroImage = "/assets/img/heroes/cna-neighborhoods-hero.png";
const aboutImage = "/assets/img/home/legacy-carousel/Wp.pm.jpg";
const eventHeroImage = "/assets/img/heroes/cna-events-hero.png";
const agendasHeroImage = "/assets/img/heroes/cna-agenda-hero.jpg";
const handbookHeroImage = "/assets/img/heroes/cna-workshop-classroom.jpg";
const postingHeroImage = "/assets/img/heroes/wpcna-parade-community-posting.png";
const pageHeroImages = new Set([
  homeHeroImage,
  neighborhoodsHeroImage,
  aboutImage,
  eventHeroImage,
  agendasHeroImage,
  handbookHeroImage,
  postingHeroImage
]);
const legacyCarousel = [
  {
    src: "/assets/img/home/legacy-carousel/white-plains-new-york-pano.jpg",
    alt: "Aerial view across White Plains with downtown towers rising above nearby homes and tree-lined streets.",
    sourceLabel: "WPCNA legacy site archive"
  },
  {
    src: "/assets/img/home/legacy-carousel/Wp.pm.jpg",
    alt: "Downtown White Plains at twilight with office towers, apartment buildings, and the city skyline lit against a deep blue sky.",
    sourceLabel: "WPCNA legacy site archive"
  },
  {
    src: homeHeroImage,
    alt: "Golden-hour aerial view of downtown White Plains with neighborhoods, treetops, and streets stretching toward the horizon.",
    sourceLabel: "WPCNA legacy site archive"
  },
  {
    src: "/assets/img/home/legacy-carousel/CityHall.jfif",
    alt: "Historic civic building and columned facade in White Plains with a modern downtown tower rising behind it.",
    sourceLabel: "WPCNA legacy site archive"
  },
  {
    src: "/assets/img/home/legacy-carousel/white-plains-farmers-market.jpg",
    alt: "Residents walking between vendor tents at the White Plains farmers market downtown.",
    sourceLabel: "WPCNA legacy site archive"
  },
  {
    src: "/assets/img/home/legacy-carousel/white-plains-archway-dusk.jpeg",
    alt: "White Plains residence at dusk with a stone archway entrance, iron gates, and warm exterior lighting.",
    sourceLabel: "WPCNA legacy site archive"
  },
  {
    src: "/assets/img/home/legacy-carousel/white-plains-brick-building-cupola.jpeg",
    alt: "Historic brick building in White Plains with a cupola, arched windows, and spring trees.",
    sourceLabel: "WPCNA legacy site archive"
  },
  {
    src: "/assets/img/home/legacy-carousel/white-plains-tudor-home-evening.jpeg",
    alt: "Tudor-style home on a White Plains street in soft evening light with mature trees in front.",
    sourceLabel: "WPCNA legacy site archive"
  }
];
const commonsCarousel = [
  {
    src: "/assets/img/home/commons/downtown-white-plains-2007.jpg",
    alt: "Downtown White Plains skyline with civic and commercial buildings rising above nearby streets.",
    sourceLabel: "Jawny80, public domain, via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Downtown_White_Plains.jpg"
  },
  {
    src: "/assets/img/home/commons/city-of-white-plains-2012.jpg",
    alt: "Wide view of White Plains from the west side with downtown buildings beyond a leafy residential foreground.",
    sourceLabel: "Steve Carrea, public domain, via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:City_of_White_Plains,_Jul_2012.jpg"
  },
  {
    src: "/assets/img/home/commons/downtown-white-plains-ne.jpg",
    alt: "Downtown White Plains seen from the northeast with towers, neighborhoods, and distant hills.",
    sourceLabel: "Ynsalh, CC BY-SA 4.0, via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Downtown_White_Plains_from_the_NE.jpg"
  },
  {
    src: "/assets/img/home/commons/mlk-drive-library.jpg",
    alt: "Martin Luther King Drive in White Plains with the public library and courthouse area in view.",
    sourceLabel: "Paul Sableman, CC BY 2.0, via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dr._Martin_Luther_King_Drive_-_White_Plains,_NY_and_the_White_Plains_Library.jpg"
  },
  {
    src: "/assets/img/home/commons/downtown-white-plains-2010.jpg",
    alt: "Street-level view of downtown White Plains with buildings, sidewalks, and city traffic.",
    sourceLabel: "Paul Sableman, CC BY 2.0, via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Downtown_White_Plains,_NY_2010-05-20.jpg"
  },
  {
    src: "/assets/img/home/commons/white-plains-skyline.jpg",
    alt: "White Plains skyline with modern high-rises and treetops in the foreground.",
    sourceLabel: "Reck345, CC BY-SA 4.0, via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:White_Plains_Skyline.JPG"
  },
  {
    src: "/assets/img/home/commons/downtown-route-119-2011.jpg",
    alt: "Downtown White Plains and New York State Route 119 with city buildings and winter light.",
    sourceLabel: "Doug Kerr, CC BY-SA 2.0, via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Downtown_White_Plains_and_New_York_State_Route_119_2011-12-24.jpg"
  },
  {
    src: "/assets/img/home/commons/fountain-white-plains.jpg",
    alt: "Fountain in White Plains with water jets and city surroundings.",
    sourceLabel: "Blithebear, CC0, via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Fountain_in_White_Plains,_NY.jpg"
  }
];
const photoStatuses = new Set(["approved", "photo"]);
const sourceUrlForPhoto = (url = "") => (String(url).startsWith("http") ? url : "");
const isProvidedWpcnaPhoto = (hero = {}) =>
  /photo provided to wpcna/i.test(hero.attributionText || "");
const neighborhoodCarouselPhotos = neighborhoodStore.all
  .filter((neighborhood) => {
    const hero = neighborhood.hero;

    return (
      neighborhood.slug !== "fisher-hill" &&
      hero &&
      photoStatuses.has(hero.status) &&
      !isProvidedWpcnaPhoto(hero) &&
      hero.imagePath
    );
  })
  .map((neighborhood) => ({
    src: neighborhood.hero.imagePath,
    alt: neighborhood.hero.altText,
    sourceLabel: `${neighborhood.name}: ${neighborhood.hero.attributionText || "WPCNA"}`,
    sourceUrl: sourceUrlForPhoto(neighborhood.hero.attributionUrl || neighborhood.hero.sourceUrl)
  }));

function uniqueCarouselPhotos(photos) {
  const seen = new Set();

  return photos.filter((photo) => {
    const srcKey = `src:${photo.src}`;
    const sourceKey = photo.sourceUrl ? `source:${photo.sourceUrl}` : "";

    if (seen.has(srcKey) || (sourceKey && seen.has(sourceKey))) {
      return false;
    }

    seen.add(srcKey);
    if (sourceKey) {
      seen.add(sourceKey);
    }

    return true;
  });
}
const closerLookCarousel = uniqueCarouselPhotos([
  ...legacyCarousel,
  ...commonsCarousel,
  ...neighborhoodCarouselPhotos
]).filter((photo) => !pageHeroImages.has(photo.src));

module.exports = {
  name: "White Plains Council of Neighborhood Associations",
  shortName: "WPCNA",
  brandLines: ["White Plains Council", "of Neighborhood", "Associations"],
  tagline: "Neighborhood-centered civic hub for White Plains.",
  baseUrl: `${deployBaseUrl.replace(/\/$/, "")}${cleanCanonicalPrefix}`,
  pathPrefix: runtimePathPrefix,
  themeColor: "#d65f22",
  assetVersion: "2026-05-09-test-contact-email",
  contactName: "Michael Dalton, President",
  email: "michael.kushman@gmail.com",
  contactFormAction: "https://formsubmit.co/michael.kushman@gmail.com",
  contactFormSubject: "WPCNA website contact",
  askWhitePlainsApiUrl: process.env.ASK_WHITE_PLAINS_API_URL || "",
  // Posting form submits to a Cloudflare Worker — URL set after worker deploy
  postingApiUrl: process.env.POSTING_API_URL || "https://wpcna-posting.YOUR_SUBDOMAIN.workers.dev",
  location: "White Plains, New York",
  defaultOgImage: homeHeroImage,
  heroImage: homeHeroImage,
  heroImageAlt:
    "Golden-hour aerial view of downtown White Plains with neighborhoods, treetops, and streets stretching toward the horizon.",
  neighborhoodsHeroImage,
  neighborhoodsHeroImageAlt:
    "Aerial view across White Plains with downtown towers rising above nearby homes and tree-lined streets.",
  aboutImage,
  aboutImageAlt:
    "Downtown White Plains at twilight with office towers, apartment buildings, and the city skyline lit against a deep blue sky.",
  eventHeroImage,
  eventHeroImageAlt: "Families gathered in a park for an outdoor community event with children holding large balloons.",
  agendasHeroImage,
  agendasHeroImageAlt: "Residents seated in a public meeting room while a presenter speaks at the front.",
  handbookHeroImage,
  handbookHeroImageAlt: "An instructor teaching adults in a classroom during a workshop.",
  postingHeroImage,
  postingHeroImageAlt: "WPCNA members and neighbors holding a WPCNA banner during a White Plains parade.",
  legacyCarousel,
  commonsCarousel,
  neighborhoodCarouselPhotos,
  closerLookCarousel,
  mission:
    "WPCNA brings neighborhood associations together, shares civic information across the city, and helps residents stay connected to public life in White Plains.",
  purpose:
    "White Plains has neighborhood concerns, public meetings, local events, workshop materials, and city notices moving at the same time. This site keeps the most useful pieces together in one place with a neighborhood-centered lens.",
  useItFor:
    "Use it to keep up with what is coming up, open a neighborhood profile, review agendas and minutes, and find the White Plains pages residents need again and again.",
  meetingNote:
    "WPCNA usually meets on the second Tuesday of the month at 7:00 p.m. Meetings are held in person at the White Plains Board of Education building (5 Homeside Lane) or online via Zoom, depending on the agenda. Format and timing can shift month to month, so check the latest agenda before you go.",
  communityChannels: [
    {
      label: "White Plains Public Library calendar",
      url: "https://calendar.whiteplainslibrary.org/"
    },
    {
      label: "City of White Plains calendar",
      url: "https://www.cityofwhiteplains.com/Calendar.aspx"
    }
  ],
  footerNote: "Neighborhood-centered civic hub for White Plains."
};
