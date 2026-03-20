/**
 * @file guides-storage.ts
 * Client-side persistence for saved travel guides.
 *
 * localStorage key: "travelGuides"
 * Value: JSON-serialised SavedGuide[] ordered newest-first.
 *
 * All functions return an empty result ([] / false) when called server-side
 * (window === undefined) so they are safe to import in Server Components,
 * but must only be called from client code ("use client").
 */
import type { TravelReport } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";

/**
 * A persisted travel guide entry stored in localStorage.
 *
 * @property id            - Unique guide ID produced by generateGuideId() in pdf-generator.ts
 *                           Format: `DEST_DDMMYY_RANDOM6` (e.g. "PARIS_200326_AB12CD")
 * @property destination   - Raw destination string as entered by the user
 * @property departureDate - ISO date string (YYYY-MM-DD)
 * @property returnDate    - ISO date string (YYYY-MM-DD)
 * @property groupType     - GroupType value (Family | Friends | Solo | Couple | Business)
 * @property groupSize     - Number of adults and children
 * @property report        - Full AI-generated TravelReport
 * @property formData      - Original validated form values used to generate the report
 * @property createdAt     - ISO datetime string (new Date().toISOString()) set at save time
 */
export interface SavedGuide {
  id: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  groupType: string;
  groupSize: { adults: number; children: number };
  report: TravelReport;
  formData: TravelFormValues;
  createdAt: string;
}

const KEY = "travelGuides";

export function getGuides(): SavedGuide[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(KEY);
    return data ? (JSON.parse(data) as SavedGuide[]) : [];
  } catch {
    return [];
  }
}

export function saveGuide(guide: SavedGuide): void {
  const guides = getGuides();
  guides.unshift(guide); // newest first
  localStorage.setItem(KEY, JSON.stringify(guides));
}

export function deleteGuide(id: string): void {
  const guides = getGuides().filter((g) => g.id !== id);
  localStorage.setItem(KEY, JSON.stringify(guides));
}

export function guideExists(id: string): boolean {
  return getGuides().some((g) => g.id === id);
}
