"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { TravelFormValues } from "@/lib/schemas";
import type { GroupType } from "@/types/travel";

const GROUP_TYPES: { value: GroupType; label: string; icon: string }[] = [
  { value: "Solo", label: "Solo", icon: "🧍" },
  { value: "Couple", label: "Couple", icon: "👫" },
  { value: "Family", label: "Family", icon: "👨‍👩‍👧" },
  { value: "Friends", label: "Friends", icon: "👯" },
  { value: "Business", label: "Business", icon: "💼" },
];

export default function GroupSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<TravelFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Your Group</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-1">
            Adults
          </label>
          <input
            id="adults"
            type="number"
            min={1}
            max={20}
            {...register("group.adults", { valueAsNumber: true })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby={errors.group?.adults ? "adults-error" : undefined}
          />
          {errors.group?.adults && (
            <p id="adults-error" className="mt-1 text-xs text-red-600">
              {errors.group.adults.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">
            Children
          </label>
          <input
            id="children"
            type="number"
            min={0}
            max={20}
            {...register("group.children", { valueAsNumber: true })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Group Type</p>
        <Controller
          control={control}
          name="group.type"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {GROUP_TYPES.map((gt) => (
                <button
                  key={gt.value}
                  type="button"
                  onClick={() => field.onChange(gt.value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                    field.value === gt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <span className="text-xl">{gt.icon}</span>
                  <span>{gt.label}</span>
                </button>
              ))}
            </div>
          )}
        />
        {errors.group?.type && (
          <p className="mt-1 text-xs text-red-600">{errors.group.type.message}</p>
        )}
      </div>
    </div>
  );
}
