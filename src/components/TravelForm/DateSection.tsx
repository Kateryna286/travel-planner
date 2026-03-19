"use client";

import { useFormContext } from "react-hook-form";
import type { TravelFormValues } from "@/lib/schemas";

export default function DateSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<TravelFormValues>();

  const departure = watch("departureDate");
  const returnDate = watch("returnDate");

  const tripDays =
    departure && returnDate
      ? Math.ceil(
          (new Date(returnDate).getTime() - new Date(departure).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Travel Dates</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-1">
            Departure Date
          </label>
          <input
            id="departureDate"
            type="date"
            min={today}
            {...register("departureDate")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby={errors.departureDate ? "departureDate-error" : undefined}
          />
          {errors.departureDate && (
            <p id="departureDate-error" className="mt-1 text-xs text-red-600">
              {errors.departureDate.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
            Return Date
          </label>
          <input
            id="returnDate"
            type="date"
            min={departure || today}
            {...register("returnDate")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby={errors.returnDate ? "returnDate-error" : undefined}
          />
          {errors.returnDate && (
            <p id="returnDate-error" className="mt-1 text-xs text-red-600">
              {errors.returnDate.message}
            </p>
          )}
        </div>
      </div>
      {tripDays !== null && tripDays > 0 && (
        <p className="text-sm text-blue-600 font-medium">
          Trip duration: {tripDays} {tripDays === 1 ? "day" : "days"}
        </p>
      )}
    </div>
  );
}
