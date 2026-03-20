// ── Form ──────────────────────────────────────────────────────────────────────

export interface TravelFormData {
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  accommodation: {
    booked: boolean;
    address?: string; // required when booked === true
  };
  group: {
    adults: number;
    children: number;
    type: GroupType;
  };
  preferences: TravelPreference[];
  transportMode: "car" | "publicTransport";
}

export type GroupType = "Family" | "Friends" | "Solo" | "Couple" | "Business";

export type TravelPreference =
  | "Nature"
  | "Architecture"
  | "Entertainment"
  | "Food"
  | "Adventure"
  | "Art"
  | "Shopping"
  | "Wellness"
  | "LocalExperiences";

// ── Travel Report ─────────────────────────────────────────────────────────────

export interface TravelReport {
  safety: SafetyStatus;
  attractions: Attraction[];
  cuisine: CuisineReport;
  practical: PracticalInfo;
  accommodationSuggestions?: AccommodationSuggestion[]; // only when booked === false
  destinationFacts?: string[];                          // 5 short facts, from Call B
}

export type SafetyLevel = "RED" | "ORANGE" | "GREEN";

export interface SafetyStatus {
  level: SafetyLevel;
  headline: string;
  summary: string;
  specificRisks: string[];
}

export interface Attraction {
  name: string;
  category: string;
  priceLevel: "FREE" | "BUDGET" | "MODERATE" | "EXPENSIVE";
  priceNote: string;
  description: string;
  tips: string[];
  relevantFor: string[];
  howToGet: string;
}

export interface AccommodationSuggestion {
  area: string;
  why: string;
  topNearbyAttractions: string[];
}

export interface CuisineReport {
  mustTryDishes: {
    name: string;
    description: string;
    whereToFind: string;
  }[];
  restaurantCategories: {
    type: string;
    priceRange: string;
    description: string;
    recommendation?: string;
  }[];
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
}

export interface PracticalInfo {
  currency: {
    name: string;
    code: string;
    exchangeTip: string;
    cashVsCard: string;
  };
  transportation: {
    drivingSide: "left" | "right";
    internationalLicenseRequired: boolean;
    publicTransportSummary: string;
    taxiRideshareApps: string[];
    transportTips: string[];
  };
  electrical: {
    voltage: string;
    plugTypes: string[];
    adapterNeeded: boolean;
  };
  language: {
    official: string[];
    englishWidelySpoken: boolean;
    usefulPhrases: { phrase: string; translation: string }[];
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
  visa: {
    requiredForCommonPassports: string;
    processingNote: string;
  };
  culturalCustoms: string[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export type ApiResponse =
  | { success: true; report: TravelReport }
  | { success: false; error: string; code: ApiErrorCode };

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_DESTINATION"
  | "AI_ERROR"
  | "RATE_LIMIT"
  | "TIMEOUT";
