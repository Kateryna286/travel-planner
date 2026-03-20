"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { TravelFormValues } from "@/lib/schemas";
import type { GroupType } from "@/types/travel";

const GROUP_TYPES: { value: GroupType; label: string; icon: string; description: string }[] = [
  { value: "Solo",     label: "Solo",     icon: "🧍", description: "Just me" },
  { value: "Couple",   label: "Couple",   icon: "👫", description: "2 adults" },
  { value: "Family",   label: "Family",   icon: "👨‍👩‍👧", description: "Adults + kids" },
  { value: "Friends",  label: "Friends",  icon: "👯", description: "Group of friends" },
  { value: "Business", label: "Business", icon: "💼", description: "Work trip" },
];

export default function GroupSection() {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<TravelFormValues>();

  const groupType = watch("group.type");

  function handleTypeChange(type: GroupType) {
    if (type === "Solo") {
      setValue("group.adults", 1);
      setValue("group.children", 0);
    } else if (type === "Couple") {
      setValue("group.adults", 2);
      setValue("group.children", 0);
    } else if (type === "Business") {
      setValue("group.children", 0);
    } else if (type === "Friends") {
      // Ensure minimum of 2 adults for friend groups
      const current = watch("group.adults");
      if (!current || current < 2) setValue("group.adults", 2);
    }
  }

  const showAdults   = groupType === "Family" || groupType === "Friends" || groupType === "Business";
  const showChildren = groupType === "Family" || groupType === "Friends";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Your Group</h2>

      {/* Group type — primary selection */}
      <Controller
        control={control}
        name="group.type"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {GROUP_TYPES.map((gt) => (
              <button
                key={gt.value}
                type="button"
                onClick={() => {
                  field.onChange(gt.value);
                  handleTypeChange(gt.value);
                }}
                className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  field.value === gt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                <span className="text-xl">{gt.icon}</span>
                <span>{gt.label}</span>
                <span className={`text-[10px] font-normal leading-tight ${field.value === gt.value ? "text-blue-500" : "text-gray-400"}`}>
                  {gt.description}
                </span>
              </button>
            ))}
          </div>
        )}
      />
      {errors.group?.type && (
        <p className="text-xs text-red-600">{errors.group.type.message}</p>
      )}

      {/* Conditional number inputs */}
      {(showAdults || showChildren) && (
        <div className={`grid gap-4 ${showAdults && showChildren ? "grid-cols-2" : "grid-cols-1 sm:w-1/2"}`}>
          {showAdults && (
            <div>
              <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-1">
                Adults
                {groupType === "Friends" && (
                  <span className="ml-1 text-xs text-gray-400 font-normal">(min 2)</span>
                )}
              </label>
              <input
                id="adults"
                type="number"
                min={groupType === "Friends" ? 2 : 1}
                max={20}
                {...register("group.adults", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-describedby={errors.group?.adults ? "adults-error" : undefined}
              />
              {errors.group?.adults && (
                <p id="adults-error" className="mt-1 text-xs text-red-600">
                  {errors.group.adults.message}
                </p>
              )}
            </div>
          )}

          {showChildren && (
            <div>
              <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">
                Children
                <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="children"
                type="number"
                min={0}
                max={20}
                {...register("group.children", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Auto-set info for Solo / Couple */}
      {(groupType === "Solo" || groupType === "Couple") && (
        <p className="text-xs text-gray-400">
          {groupType === "Solo"
            ? "Set to 1 adult, no children."
            : "Set to 2 adults, no children."}
        </p>
      )}
    </div>
  );
}
