const runtimePathPrefix = process.env.SITE_PATH_PREFIX || "/";
const canonicalPathPrefix = process.env.CANONICAL_PATH_PREFIX || process.env.SITE_PATH_PREFIX || "/wpcna4";
const deployBaseUrl = process.env.SITE_BASE_URL || "https://never-nude.github.io";
const cleanCanonicalPrefix = canonicalPathPrefix === "/" ? "" : canonicalPathPrefix.replace(/\/$/, "");
const homeHeroImage = "/assets/img/home/legacy-carousel/White-Plains.jpeg";
const legacyCarousel = [
  {
    src: "/assets/img/home/legacy-carousel/white-plains-new-york-pano.jpg",
    alt: "Aerial view across White Plains with downtown towers rising above nearby homes and tree-lined streets."
  },
  {
    src: "/assets/img/home/legacy-carousel/Wp.pm.jpg",
    alt: "Downtown White Plains at twilight with office towers, apartment buildings, and the city skyline lit against a deep blue sky."
  },
  {
    src: homeHeroImage,
    alt: "Golden-hour aerial view of downtown White Plains with neighborhoods, treetops, and streets stretching toward the horizon."
  },
  {
    src: "/assets/img/home/legacy-carousel/CityHall.jfif",
    alt: "Historic civic building and columned facade in White Plains with a modern downtown tower rising behind it."
  },
  {
    src: "/assets/img/home/legacy-carousel/white-plains-farmers-market.jpg",
    alt: "Residents walking between vendor tents at the White Plains farmers market downtown."
  },
  {
    src: "/assets/img/home/legacy-carousel/white-plains-archway-dusk.jpeg",
    alt: "White Plains residence at dusk with a stone archway entrance, iron gates, and warm exterior lighting."
  },
  {
    src: "/assets/img/home/legacy-carousel/white-plains-brick-building-cupola.jpeg",
    alt: "Historic brick building in White Plains with a cupola, arched windows, and spring trees."
  },
  {
    src: "/assets/img/home/legacy-carousel/white-plains-tudor-home-evening.jpeg",
    alt: "Tudor-style home on a White Plains street in soft evening light with mature trees in front."
  }
];

module.exports = {
  name: "White Plains Council of Neighborhood Associations",
  shortName: "WPCNA",
  brandLines: ["White Plains", "Council of", "Neighborhood", "Associations"],
  tagline: "Neighborhood-centered civic hub for White Plains.",
  baseUrl: `${deployBaseUrl.replace(/\/$/, "")}${cleanCanonicalPrefix}`,
  pathPrefix: runtimePathPrefix,
  themeColor: "#E85D04",
  contactName: "Michael Dalton, President",
  email: "info@wpcna.org",
  contactFormAction: "https://formsubmit.co/info@wpcna.org",
  contactFormSubject: "WPCNA website contact",
  askWhitePlainsApiUrl: process.env.ASK_WHITE_PLAINS_API_URL || "",
  // Posting form submits to a Cloudflare Worker — URL set after worker deploy
  postingApiUrl: process.env.POSTING_API_URL || "https://wpcna-posting.YOUR_SUBDOMAIN.workers.dev",
  location: "White Plains, New York",
  defaultOgImage: homeHeroImage,
  heroImage: homeHeroImage,
  heroImageAlt:
    "Golden-hour aerial view of downtown White Plains with neighborhoods, treetops, and streets stretching toward the horizon.",
  aboutImage: "/assets/img/home/old-site/WPP-pano.jpg",
  aboutImageAlt:
    "Panoramic view of downtown White Plains with the skyline rising above nearby homes and tree-lined blocks.",
  eventHeroImage: "/assets/img/home/old-site/white-plains-farmers-market.jpg",
  eventHeroImageAlt: "Residents walking between vendor tents at the White Plains farmers market downtown.",
  postingHeroImage: "/assets/img/heroes/wpcna-parade-community-posting.png",
  postingHeroImageAlt: "WPCNA members and neighbors holding a WPCNA banner during a White Plains parade.",
  legacyCarousel,
  closerLookCarousel: legacyCarousel.filter((photo) => photo.src !== homeHeroImage),
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
