const rawPostings = [
  {
    slug: "fisher-hill-spring-cleanup-walk",
    category: "Neighborhood",
    sourceLabel: "Fisher Hill Neighborhood Association",
    status: "upcoming",
    title: "Fisher Hill Spring Cleanup Walk",
    startDate: "2026-05-17",
    startTime: "09:00",
    endTime: "11:30",
    displayTime: "9:00 AM - 11:30 AM",
    locationName: "Fisher Hill Greenway Entrance",
    locationAddress: "45 Ridgeway Avenue, White Plains, NY 10605",
    shortSummary:
      "Residents are invited to help remove litter, clear walking paths, and prepare planting beds along the Fisher Hill Greenway.",
    fullDescription:
      "The Fisher Hill Spring Cleanup Walk brings together residents and volunteers to help prepare neighborhood public spaces for the warmer months.\n\nParticipants may assist with litter removal, light landscaping, path clearing, and planting preparation along portions of the Fisher Hill Greenway.\n\nCleanup supplies and gloves will be available at the meeting area."
  },
  {
    slug: "highlands-rain-garden-workshop",
    category: "Workshop",
    sourceLabel: "Highlands Neighborhood Association",
    status: "upcoming",
    title: "Highlands Rain Garden Workshop",
    startDate: "2026-05-21",
    startTime: "18:30",
    endTime: "20:00",
    displayTime: "6:30 PM - 8:00 PM",
    locationName: "Highlands Neighborhood Association Hall",
    locationAddress: "210 North Street, White Plains, NY 10605",
    shortSummary:
      "Learn simple techniques for reducing stormwater runoff using native plants and small residential rain gardens.",
    fullDescription:
      "This workshop introduces residents to small-scale rain garden techniques designed for neighborhood homes and shared spaces.\n\nVolunteers and environmental educators will discuss native planting, runoff management, and practical ways residents can reduce localized flooding and erosion.\n\nPrinted materials will be available following the presentation."
  },
  {
    slug: "white-plains-emergency-preparedness-night",
    category: "Civic",
    sourceLabel: "City of White Plains",
    status: "upcoming",
    title: "White Plains Emergency Preparedness Night",
    startDate: "2026-05-28",
    startTime: "19:00",
    endTime: "20:30",
    displayTime: "7:00 PM - 8:30 PM",
    locationName: "White Plains Public Library",
    locationAddress: "100 Martine Avenue, White Plains, NY 10601",
    shortSummary:
      "City staff and neighborhood volunteers will discuss emergency alerts, cooling centers, severe weather response, and practical household preparedness.",
    fullDescription:
      "Residents are invited to attend an informational evening focused on emergency preparedness and public safety resources available throughout White Plains.\n\nTopics include severe weather notifications, cooling center locations, emergency communications, and household preparedness recommendations.\n\nRepresentatives from the City and neighborhood organizations will answer questions following the presentation."
  },
  {
    slug: "gedney-farms-historic-homes-tour",
    category: "History",
    sourceLabel: "Gedney Farms Preservation Committee",
    status: "upcoming",
    title: "Gedney Farms Historic Homes Walking Tour",
    startDate: "2026-06-02",
    startTime: "17:30",
    endTime: "19:00",
    displayTime: "5:30 PM - 7:00 PM",
    locationName: "Gedney Farms Preservation District",
    locationAddress: "Gedney Esplanade, White Plains, NY 10605",
    shortSummary:
      "A guided walking tour highlighting several historic homes and neighborhood landmarks within the Gedney Farms area.",
    fullDescription:
      "This walking tour explores several historic residences and neighborhood landmarks associated with the development of the Gedney Farms district.\n\nVolunteer guides will provide historical background on architecture, preservation efforts, and neighborhood planning history.\n\nParticipants are encouraged to wear comfortable walking shoes."
  },
  {
    slug: "north-street-community-picnic",
    category: "Music & Family",
    sourceLabel: "North Street Civic Association",
    status: "upcoming",
    title: "North Street Community Picnic & Music Evening",
    startDate: "2026-06-06",
    startTime: "16:00",
    endTime: "19:00",
    displayTime: "4:00 PM - 7:00 PM",
    locationName: "Turnure Park",
    locationAddress: "Lake Street & Turnure Park Entrance, White Plains, NY 10601",
    shortSummary:
      "Neighbors are encouraged to bring blankets and picnic dinners for an informal evening of live acoustic music and family activities.",
    fullDescription:
      "Residents and families are invited to gather for a relaxed community evening featuring acoustic music performances and outdoor picnic seating.\n\nThe event is intended as a casual neighborhood gathering and will include open lawn space for children and families.\n\nAttendees are encouraged to bring blankets or folding chairs."
  },
  {
    slug: "safe-streets-bicycle-visibility-clinic",
    category: "Learning",
    sourceLabel: "White Plains Safe Streets Coalition",
    status: "upcoming",
    title: "Safe Streets Bicycle Visibility Clinic",
    startDate: "2026-06-12",
    startTime: "17:00",
    endTime: "18:30",
    displayTime: "5:00 PM - 6:30 PM",
    locationName: "Ebersole Ice Rink Parking Area",
    locationAddress: "110 Lake Street, White Plains, NY 10604",
    shortSummary:
      "Volunteers will provide free bicycle light installation, helmet fitting guidance, and visibility tips for riders.",
    fullDescription:
      "The Safe Streets Bicycle Visibility Clinic offers residents practical bicycle safety guidance ahead of the summer season.\n\nVolunteers will assist with helmet fitting, visibility recommendations, and free front/rear bicycle light installation while supplies last.\n\nFamilies and riders of all ages are welcome."
  }
];

function toSearchText(posting) {
  return [
    posting.title,
    posting.category,
    posting.sourceLabel,
    posting.locationName,
    posting.locationAddress,
    posting.shortSummary
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function withDerivedFields(posting) {
  const detailUrl = `/posting/${posting.slug}/`;
  const monthKey = posting.startDate.slice(0, 7);

  return {
    ...posting,
    organizer: posting.sourceLabel,
    source: posting.sourceLabel,
    detailUrl,
    monthKey,
    cardActionLabel: "Posting details",
    primaryAction: {
      label: "Posting details",
      url: `${detailUrl}#about-this-posting`
    },
    searchText: toSearchText(posting)
  };
}

const all = rawPostings
  .map(withDerivedFields)
  .sort((a, b) => `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`));

module.exports = {
  all,
  upcoming: all.filter((posting) => posting.status === "upcoming"),
  categories: [...new Set(all.map((posting) => posting.category))]
};
