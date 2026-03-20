import type { TravelFormData } from "@/types/travel";

export const PROMPT_VERSION = "v3";

// ── Shared helpers ─────────────────────────────────────────────────────────────

function groupContext(data: TravelFormData): string {
  return `${data.group.type} — ${data.group.adults} adult(s)${data.group.children > 0 ? `, ${data.group.children} child(ren)` : ""}`;
}

function transportLabel(data: TravelFormData): string {
  return data.transportMode === "car" ? "a rental car" : "public transport";
}

function validationPrefix(destination: string): string {
  return `First, validate that "${destination}" is a real, travelable destination.
If it is NOT valid (fictional, gibberish, or unrecognizable), return ONLY this JSON:
{ "valid": false, "reason": "brief explanation" }

Countries under conflict or with travel advisories are REAL destinations — generate the report and note risks in the safety section.

If the destination IS valid, generate the full report as defined below.
`;
}

// ── Call A — Experiences ───────────────────────────────────────────────────────
// Returns: safety, attractions, cuisine, accommodationSuggestions (optional)

export function buildExperiencesPrompt(data: TravelFormData): string {
  const transport = transportLabel(data);

  const accommodationInstruction = data.accommodation.booked
    ? `The traveler is staying at: "${data.accommodation.address}". Prioritize attractions geographically close to this address or well-connected by ${transport}. Mention proximity or transit options in howToGet for each attraction.`
    : `The traveler has NOT yet booked accommodation. Include an accommodationSuggestions array with 2–3 specific neighborhoods that offer the best access to the itinerary. Each entry: { area, why (1–2 sentences), topNearbyAttractions (attraction names from this list) }.`;

  const accommodationSuggestionsSchema = !data.accommodation.booked ? `
  accommodationSuggestions: Array<{
    area: string;
    why: string;
    topNearbyAttractions: string[];
  }>;` : "";

  return `${validationPrefix(data.destination)}
Destination: ${data.destination}
Dates: ${data.departureDate} to ${data.returnDate}
Group: ${groupContext(data)}
Interests: ${data.preferences.join(", ")}
Transport: ${transport}

${accommodationInstruction}

Group tailoring:
- Family: prioritize child-friendly attractions, note age suitability
- Friends with children: mix family-friendly and adult activities
- Business: efficiency, upscale venues, professional experiences
- Solo: safety, solo-friendly activities, social spots
- Couple: romantic experiences

For each attraction, set howToGet using ${transport}:
${data.transportMode === "car"
    ? "Mention parking availability, approximate drive time from city centre, and any road/access notes."
    : "Mention the nearest metro station or bus stop, line numbers if known, and approximate travel time from city centre."}

Respond with this exact JSON structure (no markdown, no preamble):
{
  "valid": true,
  "safety": {
    "level": "RED" | "ORANGE" | "GREEN",
    "headline": string,
    "summary": string,
    "specificRisks": string[]
  },
  "attractions": Array<{
    "name": string,
    "category": string,
    "priceLevel": "FREE" | "BUDGET" | "MODERATE" | "EXPENSIVE",
    "priceNote": string,
    "description": string,
    "tips": string[],
    "relevantFor": string[],
    "howToGet": string
  }>,
  "cuisine": {
    "mustTryDishes": Array<{ "name": string, "description": string, "whereToFind": string }>,
    "restaurantCategories": Array<{ "type": string, "priceRange": string, "description": string, "recommendation"?: string }>,
    "dietaryConsiderations": {
      "vegetarianFriendly": boolean,
      "veganOptions": boolean,
      "halalAvailable": boolean,
      "kosherAvailable": boolean,
      "commonAllergens": string[],
      "notes": string
    },
    "diningCustoms": string[],
    "tippingGuidance": string
  }${accommodationSuggestionsSchema}
}

Requirements:
- 8–12 attractions tailored to interests: ${data.preferences.join(", ")}
- 5–7 must-try dishes
- Safety level must reflect real-world current conditions`;
}

// ── Call B — Practicalities ────────────────────────────────────────────────────
// Returns: practical (currency, transportation+transportTips, electrical, language, weather, emergency, visa, culturalCustoms)

export function buildPracticalitiesPrompt(data: TravelFormData): string {
  const transport = transportLabel(data);

  return `${validationPrefix(data.destination)}
Destination: ${data.destination}
Dates: ${data.departureDate} to ${data.returnDate}
Group: ${groupContext(data)}
Transport: the traveler will use ${transport}

Generate practical travel information for this destination.
Include transportTips: 3–5 tips specific to using ${transport} in ${data.destination} (e.g. ${data.transportMode === "car" ? "parking apps, toll roads, fuel costs, road rules" : "transit cards, key lines, night service, accessibility"}).

Respond with this exact JSON structure (no markdown, no preamble):
{
  "valid": true,
  "practical": {
    "currency": { "name": string, "code": string, "exchangeTip": string, "cashVsCard": string },
    "transportation": {
      "drivingSide": "left" | "right",
      "internationalLicenseRequired": boolean,
      "publicTransportSummary": string,
      "taxiRideshareApps": string[],
      "transportTips": string[]
    },
    "electrical": { "voltage": string, "plugTypes": string[], "adapterNeeded": boolean },
    "language": {
      "official": string[],
      "englishWidelySpoken": boolean,
      "usefulPhrases": Array<{ "phrase": string, "translation": string }>
    },
    "weather": {
      "currentSeason": string,
      "expectedConditions": string,
      "packingTips": string[],
      "bestSeasons": string,
      "avoidSeasons"?: string
    },
    "emergency": {
      "policeNumber": string,
      "ambulanceNumber": string,
      "touristPolice"?: string,
      "embassyTip": string
    },
    "visa": { "requiredForCommonPassports": string, "processingNote": string },
    "culturalCustoms": string[]
  },
  "destinationFacts": [string, string, string, string, string]
}

Requirements:
- 3–5 useful local phrases
- 3–5 packing tips relevant to the travel dates and season
- Exactly 5 short interesting facts about ${data.destination} (one sentence each, max 15 words per fact; focus on surprising or little-known details)`;
}
