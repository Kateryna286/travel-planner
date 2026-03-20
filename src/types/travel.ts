// ── Form ──────────────────────────────────────────────────────────────────────

/** All fields collected by the travel planning form and sent to POST /api/travel. */
export interface TravelFormData {
  /** City, country, or region the user wants to visit. */
  destination: string;
  /** ISO date (YYYY-MM-DD). Must be today or later. */
  departureDate: string;
  /** ISO date (YYYY-MM-DD). Must be after departureDate. */
  returnDate: string;
  accommodation: {
    /** True when the user has already booked a place to stay. */
    booked: boolean;
    /** Full address of the booked accommodation. Required when booked === true. */
    address?: string;
  };
  group: {
    /** Number of adults travelling (1–20). */
    adults: number;
    /** Number of children travelling (0–20). */
    children: number;
    /** Composition of the travel group — affects attraction tailoring. */
    type: GroupType;
  };
  /** At least one preference must be selected. */
  preferences: TravelPreference[];
  /** How the group will get around at the destination. */
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

/**
 * Merged result of the two parallel AI calls returned by POST /api/travel.
 * safety, attractions, cuisine come from Call A (experiences).
 * practical, destinationFacts come from Call B (practicalities).
 */
export interface TravelReport {
  safety: SafetyStatus;
  attractions: Attraction[];
  cuisine: CuisineReport;
  practical: PracticalInfo;
  /** Neighbourhood suggestions — only present when accommodation.booked === false. */
  accommodationSuggestions?: AccommodationSuggestion[];
  /** Exactly 5 short surprising facts about the destination, from Call B. */
  destinationFacts?: string[];
}

/** Traffic-light safety classification for the destination. */
export type SafetyLevel = "RED" | "ORANGE" | "GREEN";

export interface SafetyStatus {
  /** RED = high risk, ORANGE = use caution, GREEN = safe to travel. */
  level: SafetyLevel;
  /** One-line summary shown in the safety banner (e.g. "Exercise increased caution"). */
  headline: string;
  /** One or two sentences expanding on the headline. */
  summary: string;
  /** Bullet-level specific risks (crime, health, political, natural, etc.). */
  specificRisks: string[];
}

export interface Attraction {
  /** Display name of the attraction. */
  name: string;
  /** Type of attraction (e.g. "Museum", "Natural Landmark", "Market"). */
  category: string;
  /** Broad cost band. */
  priceLevel: "FREE" | "BUDGET" | "MODERATE" | "EXPENSIVE";
  /** Human-readable price note (e.g. "~€15 adult entry"). */
  priceNote: string;
  /** 2–3 sentence description tailored to the group's interests. */
  description: string;
  /** Practical visitor tips. First tip is shown in the PDF tip box. */
  tips: string[];
  /** Travel preference tags this attraction is relevant for (from TravelPreference). */
  relevantFor: string[];
  /** How to reach the attraction by the chosen transport mode. */
  howToGet: string;
}

/** Neighbourhood suggestion returned when the traveller has not booked accommodation. */
export interface AccommodationSuggestion {
  /** Name of the area or neighbourhood. */
  area: string;
  /** 1–2 sentences explaining why this area suits the itinerary. */
  why: string;
  /** Names of attractions from the attractions list that are nearby. */
  topNearbyAttractions: string[];
}

export interface CuisineReport {
  /** 5–7 dishes the AI recommends trying. */
  mustTryDishes: {
    name: string;
    description: string;
    /** Where to find the dish (street food areas, market, restaurant type, etc.). */
    whereToFind: string;
  }[];
  /** Restaurant categories covering the price spectrum. */
  restaurantCategories: {
    type: string;
    priceRange: string;
    description: string;
    /** Optional specific restaurant or chain name to try. */
    recommendation?: string;
  }[];
  dietaryConsiderations: {
    vegetarianFriendly: boolean;
    veganOptions: boolean;
    halalAvailable: boolean;
    kosherAvailable: boolean;
    /** Common local ingredients that are allergens. */
    commonAllergens: string[];
    /** Free-text note on dietary landscape. */
    notes: string;
  };
  /** Local etiquette rules around eating and dining. */
  diningCustoms: string[];
  /** Single sentence summarising tipping norms. */
  tippingGuidance: string;
}

export interface PracticalInfo {
  currency: {
    /** Full currency name (e.g. "Japanese Yen"). */
    name: string;
    /** ISO 4217 code (e.g. "JPY"). */
    code: string;
    /** Advice on where/how to exchange money. */
    exchangeTip: string;
    /** Guidance on cash vs card acceptance. */
    cashVsCard: string;
  };
  transportation: {
    /** Which side of the road traffic drives on. */
    drivingSide: "left" | "right";
    /** Whether an International Driving Permit is required. */
    internationalLicenseRequired: boolean;
    /** Overview of public transport options (metro, bus, rail). */
    publicTransportSummary: string;
    /** Local taxi or rideshare app names. */
    taxiRideshareApps: string[];
    /**
     * 3–5 tips tailored to the user's chosen transportMode:
     * - car: parking apps, toll roads, fuel, road rules
     * - publicTransport: transit cards, key lines, night service, accessibility
     */
    transportTips: string[];
  };
  electrical: {
    /** Mains voltage and frequency (e.g. "230V / 50Hz"). */
    voltage: string;
    /** Plug type letters used in the destination (e.g. ["C", "F"]). */
    plugTypes: string[];
    /** True if a plug adapter is typically needed for visitors. */
    adapterNeeded: boolean;
  };
  language: {
    /** Official language(s) of the destination. */
    official: string[];
    englishWidelySpoken: boolean;
    /** 3–5 useful local phrases with English translations. */
    usefulPhrases: { phrase: string; translation: string }[];
  };
  weather: {
    /** Season at the destination during the travel dates. */
    currentSeason: string;
    /** Expected temperature range and conditions. */
    expectedConditions: string;
    /** 3–5 packing tips relevant to the travel dates and season. */
    packingTips: string[];
    /** Recommended months or seasons to visit. */
    bestSeasons: string;
    /** Months or seasons to avoid (e.g. hurricane season). Optional. */
    avoidSeasons?: string;
  };
  emergency: {
    /** Local emergency number for police. */
    policeNumber: string;
    /** Local emergency number for ambulance. */
    ambulanceNumber: string;
    /** Tourist-specific police line if one exists. */
    touristPolice?: string;
    /** Advice on locating the traveller's home embassy. */
    embassyTip: string;
  };
  visa: {
    /** Visa requirement summary for the most common passport holders. */
    requiredForCommonPassports: string;
    /** Processing time or e-visa availability note. */
    processingNote: string;
  };
  /** Local customs and etiquette tips (dress codes, gestures, taboos, etc.). */
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
