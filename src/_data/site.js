const runtimePathPrefix = process.env.SITE_PATH_PREFIX || "/";
const canonicalPathPrefix = process.env.CANONICAL_PATH_PREFIX || process.env.SITE_PATH_PREFIX || "/wpcna2";
const deployBaseUrl = process.env.SITE_BASE_URL || "https://never-nude.github.io";
const cleanCanonicalPrefix = canonicalPathPrefix === "/" ? "" : canonicalPathPrefix.replace(/\/$/, "");

module.exports = {
  name: "White Plains Council of Neighborhood Associations",
  shortName: "WPCNA",
  brandLines: ["White Plains", "Council of", "Neighborhood", "Associations"],
  tagline: "White Plains civic and neighborhood guide.",
  baseUrl: `${deployBaseUrl.replace(/\/$/, "")}${cleanCanonicalPrefix}`,
  pathPrefix: runtimePathPrefix,
  themeColor: "#1F3A5F",
  contactName: "Michael Dalton, President",
  email: "info@wpcna.org",
  contactFormAction: "https://formsubmit.co/info@wpcna.org",
  contactFormSubject: "WPCNA website contact",
  // Posting form submits to a Cloudflare Worker — URL set after worker deploy
  postingApiUrl: process.env.POSTING_API_URL || "https://wpcna-posting.YOUR_SUBDOMAIN.workers.dev",
  location: "White Plains, New York",
  defaultOgImage: "/assets/img/home/old-site/WPP-pano.jpg",
  heroImage: "/assets/img/home/old-site/WPP-pano.jpg",
  heroImageAlt:
    "Panoramic view of downtown White Plains with the skyline rising above nearby homes and tree-lined blocks.",
  aboutImage: "/assets/img/home/old-site/White-Plains.jpeg",
  aboutImageAlt:
    "Golden-hour aerial view of White Plains with downtown buildings and surrounding neighborhoods.",
  homeGallery: [
    {
      src: "/assets/img/home/old-site/WPP-pano.jpg",
      alt: "Panoramic skyline view of White Plains at dusk.",
      label: "Downtown panorama"
    },
    {
      src: "/assets/img/home/old-site/White-Plains.jpeg",
      alt: "Golden-hour aerial view of downtown White Plains and nearby neighborhoods.",
      label: "Golden hour"
    },
    {
      src: "/assets/img/home/legacy/test-crop.jpg",
      alt: "Daytime aerial view of White Plains with downtown and residential blocks.",
      label: "Aerial view"
    }
  ],
  mission:
    "WPCNA helps keep neighborhood concerns, local events, and civic information easier to follow across White Plains.",
  purpose:
    "White Plains has City Hall meetings, downtown events, library programs, neighborhood association materials, and public notices all moving at once. This site pulls the most useful pieces together with a neighborhood lens.",
  useItFor:
    "Use it to see what is coming up, get a clearer feel for different parts of the city, and find the White Plains pages residents end up needing again and again.",
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
  footerNote: "Neighborhood-centered civic guide for White Plains."
};
