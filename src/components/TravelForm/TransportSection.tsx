"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { TravelFormValues } from "@/lib/schemas";

const CAR_ICON = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 .001M13 16H5m8 0h3m3-4h.5A1.5 1.5 0 0121 13.5V16h-2M6 10h6l2-4H6l-2 4z" />
  </svg>
);

const BUS_ICON = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100-4 2 2 0 000 4zM16 17a2 2 0 100-4 2 2 0 000 4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M5 6V4a1 1 0 011-1h12a1 1 0 011 1v2M5 17V7h14v10M5 10v4m14-4v4" />
  </svg>
);

export default function TransportSection() {
  const { control } = useFormContext<TravelFormValues>();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">How will you get around?</h2>
      <Controller
        control={control}
        name="transportMode"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: "car" as const,
                label: "Rent a car",
                description: "Parking tips, drive times, road notes",
                icon: CAR_ICON,
              },
              {
                value: "publicTransport" as const,
                label: "Public transport",
                description: "Metro / bus stops, transit cards, travel times",
                icon: BUS_ICON,
              },
            ].map((opt) => {
              const selected = field.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-colors ${
                    selected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className={selected ? "text-blue-600" : "text-gray-400"}>
                    {opt.icon}
                  </span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className={`text-xs leading-snug ${selected ? "text-blue-500" : "text-gray-400"}`}>
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      />
    </div>
  );
}
