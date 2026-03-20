"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TravelFormSchema, type TravelFormValues } from "@/lib/schemas";
import type { TravelReport, ApiResponse } from "@/types/travel";
import DateSection from "./DateSection";
import DestinationSection from "./DestinationSection";
import AccommodationSection from "./AccommodationSection";
import GroupSection from "./GroupSection";
import PreferencesSection from "./PreferencesSection";
import TransportSection from "./TransportSection";

interface Props {
  onReport: (report: TravelReport, destination: string, formData: TravelFormValues) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_DESTINATION: "We couldn't find this destination. Try a more specific city or country name.",
  RATE_LIMIT: "Too many requests — please wait a moment and try again.",
  TIMEOUT: "The request took too long. Please try again.",
  AI_ERROR: "Something went wrong generating your guide. Please try again.",
  VALIDATION_ERROR: "Please check your form and try again.",
};

interface PendingResult {
  report: TravelReport;
  destination: string;
  formData: TravelFormValues;
}

interface LoadingData {
  destination: string;
  groupType: string;
}

export default function TravelForm({ onReport }: Props) {
  const methods = useForm<TravelFormValues>({
    resolver: zodResolver(TravelFormSchema),
    defaultValues: {
      accommodation: { booked: true },
      group: { adults: 1, children: 0, type: "Solo" },
      preferences: [],
      transportMode: "publicTransport",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loadingData, setLoadingData] = useState<LoadingData | null>(null);
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  async function onSubmit(data: TravelFormValues) {
    setApiError(null);
    setLoadingData({ destination: data.destination, groupType: data.group.type });
    setIsLoading(true);

    try {
      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: ApiResponse = await res.json();

      if (!json.success) {
        setApiError(ERROR_MESSAGES[json.code] ?? json.error);
        setIsLoading(false);
        setLoadingData(null);
        return;
      }

      // Store result, trigger completing flash before transitioning
      setPendingResult({ report: json.report, destination: data.destination, formData: data });
      setIsCompleting(true);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      setIsLoading(false);
      setLoadingData(null);
    }
  }

  function handleLoadingComplete() {
    const result = pendingResult;
    setIsLoading(false);
    setIsCompleting(false);
    setLoadingData(null);
    setPendingResult(null);
    if (result) {
      onReport(result.report, result.destination, result.formData);
    }
  }

  const showLoader = isLoading || isCompleting;

  return (
    <FormProvider {...methods}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {showLoader ? "Generating your personalised travel guide..." : "Form ready."}
      </div>

      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate className="space-y-8">
        <DestinationSection />
        <DateSection />
        <AccommodationSection />
        <GroupSection />
        <PreferencesSection />
        <TransportSection />

        {apiError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        {showLoader && loadingData && (
          <LoadingPanel
            destination={loadingData.destination}
            groupType={loadingData.groupType}
            isCompleting={isCompleting}
            onComplete={handleLoadingComplete}
          />
        )}

        <button
          type="submit"
          disabled={showLoader}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {showLoader ? "Generating..." : "Plan My Trip ✈️"}
        </button>
      </form>
    </FormProvider>
  );
}

// ── Loading panel ─────────────────────────────────────────────────────────────

interface StepDef {
  id: number;
  label: (groupType: string) => string;
  showAt: number;        // elapsed seconds before this step appears
  autoCompleteAt: number | null; // elapsed seconds → auto-complete (null = only on API done)
}

const STEPS: StepDef[] = [
  { id: 0, label: () => "Validating destination...",                              showAt: 0, autoCompleteAt: 1 },
  { id: 1, label: () => "Analysing your group and preferences...",                showAt: 0, autoCompleteAt: 2 },
  { id: 2, label: (g) => `Finding the best attractions for your ${g.toLowerCase()} trip...`, showAt: 0, autoCompleteAt: null },
  { id: 3, label: () => "Building your day-by-day itinerary...",                  showAt: 3, autoCompleteAt: null },
  { id: 4, label: () => "Researching local cuisine and hidden gems...",           showAt: 6, autoCompleteAt: null },
  { id: 5, label: () => "Calculating transport routes and practical tips...",     showAt: 9, autoCompleteAt: null },
];

interface LoadingPanelProps {
  destination: string;
  groupType: string;
  isCompleting: boolean;
  onComplete: () => void;
}

function LoadingPanel({ destination, groupType, isCompleting, onComplete }: LoadingPanelProps) {
  const [elapsed, setElapsed] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const completingStarted = useRef(false);

  // 1-second timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-complete steps based on timer
  useEffect(() => {
    STEPS.forEach((step) => {
      if (step.autoCompleteAt !== null && elapsed >= step.autoCompleteAt) {
        setCompletedIds((prev) => (prev.has(step.id) ? prev : new Set(prev).add(step.id)));
      }
    });
  }, [elapsed]);

  // Flash remaining steps to done when API returns, then call onComplete
  useEffect(() => {
    if (!isCompleting || completingStarted.current) return;
    completingStarted.current = true;

    const incomplete = STEPS.filter(
      (s) => elapsed >= s.showAt && !completedIds.has(s.id)
    ).sort((a, b) => a.id - b.id);

    let delay = 0;
    incomplete.forEach((step) => {
      setTimeout(() => {
        setCompletedIds((prev) => new Set(prev).add(step.id));
      }, delay);
      delay += 130;
    });

    setTimeout(onComplete, delay + 300);
  }, [isCompleting]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleSteps = STEPS.filter((s) => elapsed >= s.showAt);
  const doneCount = completedIds.size;
  const progress = isCompleting ? 100 : Math.min(85, (doneCount / STEPS.length) * 100 + elapsed * 1.5);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Navy header */}
      <div className="flex items-center justify-between bg-[#214068] px-5 py-3">
        <div className="flex items-center gap-2.5">
          {isCompleting ? (
            <svg className="h-4 w-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          <span className="text-sm font-bold uppercase tracking-widest text-white">
            {isCompleting ? "Guide ready!" : "Generating your guide"}
          </span>
        </div>
        <span className="text-xs text-blue-200">~20 sec</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-orange-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="px-5 py-4 space-y-2.5">
        {visibleSteps.map((step) => {
          const done = completedIds.has(step.id);
          return (
            <div
              key={step.id}
              className="flex items-start gap-3 transition-opacity duration-300"
              style={{ opacity: done ? 0.55 : 1 }}
            >
              {done ? (
                <span className="mt-0.5 shrink-0 text-xs text-green-500">✓</span>
              ) : (
                <span className="mt-1 inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
              )}
              <p className="text-sm text-gray-700">{step.label(groupType)}</p>
            </div>
          );
        })}
      </div>

      {/* Facts ticker — placeholder during loading */}
      <div className="mx-5 mb-4 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-blue-400 mt-0.5">📍</span>
          <p className="text-sm italic text-gray-400 animate-pulse leading-snug">
            Loading fascinating facts about {destination}…
          </p>
        </div>
      </div>
    </div>
  );
}
