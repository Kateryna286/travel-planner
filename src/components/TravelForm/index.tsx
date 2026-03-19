"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TravelFormSchema, type TravelFormValues } from "@/lib/schemas";
import type { TravelReport, ApiResponse } from "@/types/travel";
import DateSection from "./DateSection";
import DestinationSection from "./DestinationSection";
import AccommodationSection from "./AccommodationSection";
import GroupSection from "./GroupSection";
import PreferencesSection from "./PreferencesSection";

interface Props {
  onReport: (report: TravelReport, destination: string) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_DESTINATION:
    "We couldn't find this destination. Try a more specific city or country name.",
  RATE_LIMIT: "Too many requests — please wait a moment and try again.",
  TIMEOUT: "The request took too long. Please try again.",
  AI_ERROR: "Something went wrong generating your guide. Please try again.",
  VALIDATION_ERROR: "Please check your form and try again.",
};

type LoadingStep = 0 | 1 | 2;

export default function TravelForm({ onReport }: Props) {
  const methods = useForm<TravelFormValues>({
    resolver: zodResolver(TravelFormSchema),
    defaultValues: {
      accommodation: { booked: true },
      group: { adults: 1, children: 0, type: "Solo" },
      preferences: [],
    },
  });

  const [loadingStep, setLoadingStep] = useState<LoadingStep>(0);
  const [apiError, setApiError] = useState<string | null>(null);

  async function onSubmit(data: TravelFormValues) {
    setApiError(null);
    setLoadingStep(1);

    try {
      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      setLoadingStep(2);
      const json: ApiResponse = await res.json();

      if (!json.success) {
        setApiError(ERROR_MESSAGES[json.code] ?? json.error);
        setLoadingStep(0);
        return;
      }

      setLoadingStep(0);
      onReport(json.report, data.destination);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      setLoadingStep(0);
    }
  }

  const isLoading = loadingStep > 0;

  return (
    <FormProvider {...methods}>
      {/* ARIA live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loadingStep === 1 && "Validating your travel information..."}
        {loadingStep === 2 && "Generating personalized recommendations..."}
        {!isLoading && "Form ready."}
      </div>

      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate className="space-y-8">
        <DestinationSection />
        <DateSection />
        <AccommodationSection />
        <GroupSection />
        <PreferencesSection />

        {apiError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {apiError}
          </div>
        )}

        {isLoading && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-4 text-sm">
            <div className="flex items-center gap-3 text-blue-700 font-medium mb-1">
              <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {loadingStep === 1
                ? "Step 1 of 2: Validating your travel details..."
                : "Step 2 of 2: Generating your personalized guide..."}
            </div>
            <p className="text-blue-600 text-xs ml-7">This usually takes 10–15 seconds</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? "Generating..." : "Plan My Trip ✈️"}
        </button>
      </form>
    </FormProvider>
  );
}

// useState is a React hook — import it explicitly for clarity
import { useState } from "react";
