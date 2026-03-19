"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { TravelFormValues } from "@/lib/schemas";
import type { AccommodationType } from "@/types/travel";

const ACCOMMODATION_OPTIONS: { value: AccommodationType; label: string }[] = [
  { value: "Hotel", label: "Hotel" },
  { value: "Airbnb", label: "Airbnb / Vacation Rental" },
  { value: "Hostel", label: "Hostel" },
  { value: "Resort", label: "Resort" },
  { value: "BedAndBreakfast", label: "Bed & Breakfast" },
];

export default function AccommodationSection() {
  const { watch, setValue, control } = useFormContext<TravelFormValues>();
  const booked = watch("accommodation.booked");
  const prefs = watch("accommodation.preferences") ?? [];

  function togglePreference(value: AccommodationType) {
    const next = prefs.includes(value)
      ? prefs.filter((p) => p !== value)
      : [...prefs, value];
    setValue("accommodation.preferences", next as AccommodationType[]);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Accommodation</h2>
      <Controller
        control={control}
        name="accommodation.booked"
        render={({ field }) => (
          <div className="flex gap-3">
            {[
              { value: true, label: "Already booked" },
              { value: false, label: "Not yet booked" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => field.onChange(opt.value)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  field.value === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      />
      {!booked && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Accommodation preferences <span className="text-gray-400 font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCOMMODATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => togglePreference(opt.value)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  prefs.includes(opt.value)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
