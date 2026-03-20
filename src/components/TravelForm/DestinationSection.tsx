"use client";

import { useFormContext } from "react-hook-form";
import type { TravelFormValues } from "@/lib/schemas";

export default function DestinationSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<TravelFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Destination</h2>
      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
          City or Country
        </label>
        <input
          id="destination"
          type="text"
          placeholder="e.g. Tokyo, Japan or Barcelona"
          {...register("destination")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-describedby={errors.destination ? "destination-error" : undefined}
        />
        {errors.destination && (
          <p id="destination-error" className="mt-1 text-xs text-red-600">
            {errors.destination.message}
          </p>
        )}
      </div>
    </div>
  );
}
