import type { TravelFormData, HaikuOutput } from "@/types/travel";

export const HAIKU_PROMPT_VERSION = "v1";
export const SONNET_PROMPT_VERSION = "v1";

export function buildHaikuPrompt(data: TravelFormData): string {
  return `You are a travel data validator. Analyze this travel request and respond with valid JSON only — no markdown, no explanation.

Input:
${JSON.stringify(data, null, 2)}

Respond with exactly this JSON structure:
{
  "valid": boolean,
  "reason": "string — only set if valid is false",
  "travelProfile": "string — 1 paragraph summary, only set if valid is true",
  "extractedParams": {
    "tripDurationDays": number,
    "season": "string",
    "groupContext": "string",
    "primaryInterests": ["string"]
  },
  "concerns": ["string"]
}

Rules:
- Set valid=false if the destination is not a real, recognizable place
- Set valid=false if date logic is impossible
- concerns may be an empty array
- Respond with raw JSON only`;
}

export function buildSonnetPrompt(data: TravelFormData, haiku: HaikuOutput): string {
  return `You are an expert travel advisor. Generate a comprehensive, personalized travel report as JSON.

Travel profile: ${haiku.travelProfile}
Trip parameters: ${JSON.stringify(haiku.extractedParams)}
Concerns to address: ${haiku.concerns?.join(", ") || "none"}
Original request: ${JSON.stringify(data)}

Generate a complete TravelReport JSON matching this TypeScript interface exactly:

interface TravelReport {
  safety: {
    level: "RED" | "ORANGE" | "GREEN";
    headline: string;
    summary: string;
    specificRisks: string[];
  };
  attractions: Array<{
    name: string;
    category: string;
    priceLevel: "FREE" | "BUDGET" | "MODERATE" | "EXPENSIVE";
    priceNote: string;
    description: string;
    tips: string[];
    relevantFor: string[];
  }>;
  cuisine: {
    mustTryDishes: Array<{ name: string; description: string; whereToFind: string }>;
    restaurantCategories: Array<{
      type: string;
      priceRange: string;
      description: string;
      recommendation?: string;
    }>;
    dietaryConsiderations: {
      vegetarianFriendly: boolean;
      veganOptions: boolean;
      halalAvailable: boolean;
      kosherAvailable: boolean;
      commonAllergens: string[];
      notes: string;
    };
    diningCustoms: string[];
    tippingGuidance: string;
  };
  practical: {
    currency: { name: string; code: string; exchangeTip: string; cashVsCard: string };
    transportation: {
      drivingSide: "left" | "right";
      internationalLicenseRequired: boolean;
      publicTransportSummary: string;
      taxiRideshareApps: string[];
    };
    electrical: { voltage: string; plugTypes: string[]; adapterNeeded: boolean };
    language: {
      official: string[];
      englishWidelySpoken: boolean;
      usefulPhrases: Array<{ phrase: string; translation: string }>;
    };
    weather: {
      currentSeason: string;
      expectedConditions: string;
      packingTips: string[];
      bestSeasons: string;
      avoidSeasons?: string;
    };
    emergency: {
      policeNumber: string;
      ambulanceNumber: string;
      touristPolice?: string;
      embassyTip: string;
    };
    visa: { requiredForCommonPassports: string; processingNote: string };
    culturalCustoms: string[];
  };
}

Requirements:
- Include 8–12 attractions tailored to preferences: ${data.preferences.join(", ")}
- Consider group type (${data.group.type}) and composition (${data.group.adults} adults, ${data.group.children} children)
- Safety level must reflect real-world current conditions for this destination
- Include 5–7 must-try dishes in cuisine
- Include 3–5 useful local phrases
- Respond with raw JSON only — no markdown, no preamble`;
}
