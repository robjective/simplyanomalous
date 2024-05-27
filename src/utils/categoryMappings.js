export const CATEGORY_GROUPS = {
  "Violent Crime": [
    "Assault",
    "Homicide",
    "Rape",
    "Robbery",
    "Human Trafficking (A), Commercial Sex Acts",
    "Human Trafficking, Commercial Sex Acts",
    "Human Trafficking (B), Involuntary Servitude",
    "Offences Against The Family And Children",
    "Weapons Carrying Etc",
    "Weapons Offense",
    "Weapons Offence",
  ],
  "Property Crime": [
    "Arson",
    "Burglary",
    "Forgery And Counterfeiting",
    "Fraud",
    "Larceny Theft",
    "Motor Vehicle Theft",
    "Motor Vehicle Theft?",
    "Stolen Property",
    "Vandalism",
    "Embezzlement",
    "Recovered Vehicle",
    "Vehicle Impounded",
    "Vehicle Misplaced",
  ],
  "Other Crimes": [
    "Case Closure",
    "Civil Sidewalks",
    "Courtesy Report",
    "Disorderly Conduct",
    "Drug Offense",
    "Drug Violation",
    "Fire Report",
    "Gambling",
    "Lost Property",
    "Malicious Mischief",
    "Miscellaneous Investigation",
    "Missing Person",
    "Non-Criminal",
    "Other",
    "Other Miscellaneous",
    "Other Offenses",
    "Prostitution",
    "Suicide",
    "Suspicious Occ",
    "Traffic Collision",
    "Traffic Violation Arrest",
    "Warrant",
    "Liquor Laws",
    "Suspicious",
    "undefined",
  ],
};

export const getCategoryGroup = (category) => {
  for (const [group, categories] of Object.entries(CATEGORY_GROUPS)) {
    if (categories.includes(category)) {
      return group;
    }
  }
  return "Other Crimes"; // Default to Other Crimes if category not found
};
