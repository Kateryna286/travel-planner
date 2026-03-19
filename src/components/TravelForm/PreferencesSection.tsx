"use client";

import { useFormContext } from "react-hook-form";
import type { TravelFormValues } from "@/lib/schemas";
import type { TravelPreference } from "@/types/travel";

const PREFERENCES: { value: TravelPreference; label: string; icon: string }[] = [
  { value: "Nature", label: "Nature & Outdoors", icon: "🌿" },
  { value: "Architecture", label: "Architecture & History", icon: "🏛️" },
  { value: "Entertainment", label: "Entertainment & Nightlife", icon: "🎭" },
  { value: "Food", label: "Food & Cuisine", icon: "🍜" },
  { value: "Adventure", label: "Adventure & Sports", icon: "🧗" },
  { value: "Art", label: "Art & Culture", icon: "🎨" },
  { value: "Shopping", label: "Shopping", icon: "🛍️" },
  { value: "Wellness", label: "Wellness & Spa", icon: "🧘" },
  { value: "LocalExperiences", label: "Local Experiences", icon: "🗺️" },
];

export default function PreferencesSection() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TravelFormValues>();

  const selected = watch("preferences") ?? [];

  function toggle(value: TravelPreference) {
    const next = selected.includes(value)
      ? selected.filter((p) => p !== value)
      : [...selected, value];
    setValue("preferences", next as TravelPreference[], { shouldValidate: true });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Travel Preferences</h2>
      <p className="text-sm text-gray-500">Select everything that interests you</p>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="group"
        aria-label="Travel preferences"
      >
        {PREFERENCES.map((pref) => {
          const isSelected = selected.includes(pref.value);
          return (
            <button
              key={pref.value}
              type="button"
              onClick={() => toggle(pref.value)}
              aria-pressed={isSelected}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              <span className="text-base shrink-0">{pref.icon}</span>
              <span className="leading-tight">{pref.label}</span>
            </button>
          );
        })}
      </div>
      {errors.preferences && (
        <p className="text-xs text-red-600">{errors.preferences.message}</p>
      )}
    </div>
  );
}
