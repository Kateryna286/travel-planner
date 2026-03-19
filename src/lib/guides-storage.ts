import type { TravelReport } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";

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
