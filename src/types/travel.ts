// ── Form ──────────────────────────────────────────────────────────────────────

export interface TravelFormData {
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  accommodation: {
    booked: boolean;
    preferences?: AccommodationType[];
  };
  group: {
    adults: number;
    children: number;
    type: GroupType;
  };
  preferences: TravelPreference[];
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

export type AccommodationType =
  | "Hotel"
  | "Airbnb"
  | "Hostel"
  | "Resort"
  | "BedAndBreakfast";

// ── Haiku output ──────────────────────────────────────────────────────────────

export interface HaikuOutput {
  valid: boolean;
  reason?: string;
  travelProfile?: string;
  extractedParams?: {
    tripDurationDays: number;
    season: string;
    groupContext: string;
    primaryInterests: string[];
  };
  concerns?: string[];
}

// ── Travel Report ─────────────────────────────────────────────────────────────

export interface TravelReport {
  safety: SafetyStatus;
  attractions: Attraction[];
  cuisine: CuisineReport;
  practical: PracticalInfo;
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
