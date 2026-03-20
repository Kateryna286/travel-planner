"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { TravelFormValues } from "@/lib/schemas";

export default function AccommodationSection() {
  const {
    watch,
    register,
    control,
    formState: { errors },
  } = useFormContext<TravelFormValues>();

  const booked = watch("accommodation.booked");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Accommodation</h2>

      {/* Booked toggle */}
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

      {/* Already booked — address field */}
      {booked && (
        <div>
          <label
            htmlFor="accommodation-address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your accommodation address or hotel name
            <span className="ml-1 text-red-500">*</span>
          </label>
          <input
            id="accommodation-address"
            type="text"
            placeholder="e.g. Hotel Hilton, 123 Main Street, Paris"
            {...register("accommodation.address")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby={errors.accommodation?.address ? "address-error" : undefined}
          />
          {errors.accommodation?.address && (
            <p id="address-error" className="mt-1 text-xs text-red-600">
              {errors.accommodation.address.message}
            </p>
          )}
          <p className="mt-1.5 text-xs text-gray-400">
            We&apos;ll prioritize attractions close to your accommodation.
          </p>
        </div>
      )}

      {/* Not yet booked — hint */}
      {!booked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">📍 Location tips included:</span>{" "}
            We&apos;ll suggest the best neighborhoods or areas to stay based on your itinerary.
          </p>
        </div>
      )}
    </div>
  );
}
