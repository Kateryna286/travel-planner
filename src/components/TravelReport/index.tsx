"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TravelReport, AccommodationSuggestion } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";
import SafetyBanner from "./SafetyBanner";
import Attractions from "./Attractions";
import Cuisine from "./Cuisine";
import PracticalInfo from "./PracticalInfo";

interface Props {
  report: TravelReport;
  destination: string;
  formData: TravelFormValues;
  savedGuideId?: string | null;
  onSave?: () => void;   // omit to hide the save button entirely
  animateIn?: boolean;   // true = progressive skeleton reveal on mount
}

// ── Section reveal schedule ────────────────────────────────────────────────

const SECTION_IDS = ["safety", "accommodation", "attractions", "cuisine", "practical"] as const;
type SectionId = typeof SECTION_IDS[number];

const REVEAL_DELAYS: Record<SectionId, number> = {
  safety:        250,
  accommodation: 500,
  attractions:   800,
  cuisine:       1200,
  practical:     1700,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

// ── Skeleton building-blocks ───────────────────────────────────────────────

function SkeletonLine({ w = "full" }: { w?: string }) {
  return <div className={`h-3.5 rounded bg-gray-200 w-${w}`} />;
}

function SkeletonHeader() {
  return (
    <div className="animate-pulse space-y-2.5">
      <div className="h-10 w-2/3 rounded-lg bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-4 h-0.5 w-full rounded bg-gray-200" />
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="h-3 w-1/4 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-2/3 rounded bg-gray-200" />
              <div className="h-3 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SafetySkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-12 rounded-lg bg-gray-200" />
      <div className="space-y-2">
        <SkeletonLine w="3/4" />
        <SkeletonLine w="1/2" />
        <SkeletonLine w="5/6" />
      </div>
    </div>
  );
}

function AccommodationSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-9 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0,1,2].map(i => (
          <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-2">
            <SkeletonLine w="1/2" />
            <SkeletonLine />
            <SkeletonLine w="3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AttractionsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-9 rounded-lg bg-gray-200" />
      {[0,1,2].map(i => (
        <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <SkeletonLine w="1/3" />
            <div className="h-5 w-16 rounded bg-gray-200" />
          </div>
          <SkeletonLine />
          <SkeletonLine w="3/4" />
        </div>
      ))}
    </div>
  );
}

function CuisineSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-9 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <SkeletonLine w="2/3" />
            <SkeletonLine />
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticalSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-9 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0,1,2,3].map(i => (
          <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-2">
            <SkeletonLine w="1/2" />
            <SkeletonLine />
            <SkeletonLine w="3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reveal wrapper ────────────────────────────────────────────────────────

interface RevealProps {
  revealed: boolean;
  animateIn: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

function Reveal({ revealed, animateIn, skeleton, children }: RevealProps) {
  if (!animateIn) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {revealed ? (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="skeleton"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {skeleton}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Facts ticker ───────────────────────────────────────────────────────────

function FactsTicker({ facts }: { facts: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (facts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % facts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [facts.length]);

  if (facts.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-blue-500 mt-0.5 text-sm">📍</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="text-sm italic text-gray-600 leading-snug"
          >
            {facts[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function TravelReport({
  report,
  destination,
  formData,
  savedGuideId = null,
  onSave,
  animateIn = false,
}: Props) {
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(
    report.safety.level !== "RED"
  );
  const [pdfState, setPdfState] = useState<"idle" | "generating" | "done">("idle");
  const [revealed, setRevealed] = useState<Set<SectionId>>(
    () => animateIn ? new Set<SectionId>() : new Set(SECTION_IDS)
  );

  useEffect(() => {
    if (!animateIn) return;
    const timers = SECTION_IDS.map((id) =>
      setTimeout(() => {
        setRevealed((prev) => new Set([...prev, id]));
      }, REVEAL_DELAYS[id])
    );
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const blocked = report.safety.level === "RED" && !safetyAcknowledged;

  const totalTravellers = formData.group.adults + formData.group.children;
  const groupDesc =
    formData.group.children > 0
      ? `${formData.group.type} · ${formData.group.adults} adult${formData.group.adults !== 1 ? "s" : ""}, ${formData.group.children} child${formData.group.children !== 1 ? "ren" : ""}`
      : `${formData.group.type} · ${totalTravellers} traveller${totalTravellers !== 1 ? "s" : ""}`;

  const dateRange = `${formatDate(formData.departureDate)} – ${formatDate(formData.returnDate)}`;

  const tripDays = Math.ceil(
    (new Date(formData.returnDate).getTime() - new Date(formData.departureDate).getTime()) / 86400000
  );

  async function handleDownload() {
    setPdfState("generating");
    try {
      const { generateTravelPDF } = await import("@/lib/pdf-generator");
      generateTravelPDF(report, formData, savedGuideId ?? undefined);
      setPdfState("done");
      setTimeout(() => setPdfState("idle"), 3000);
    } catch {
      setPdfState("idle");
    }
  }

  return (
    <div className="space-y-0">

      {/* ── Cover header ───────────────────────────────────────────────────────── */}
      <div className="rounded-t-2xl border border-b-0 border-gray-200 bg-white px-6 pt-8 pb-6 sm:px-8">

        {/* Destination title */}
        <h1 className="text-4xl font-bold tracking-tight text-[#214068] sm:text-5xl">
          {destination.toUpperCase()}
        </h1>

        {/* Orange date range */}
        <p className="mt-1 text-lg font-medium text-orange-700">{dateRange}</p>

        {/* Italic meta line */}
        <p className="mt-0.5 text-sm italic text-gray-400">
          AI-generated travel guide · {groupDesc}
        </p>

        {/* Navy divider */}
        <div className="mt-4 h-0.5 w-full bg-[#214068]" />

        {/* Beige summary box */}
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#214068]">Trip Summary</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
            {[
              { label: "Dates",    value: dateRange },
              { label: "Duration", value: `${tripDays} day${tripDays !== 1 ? "s" : ""}` },
              { label: "Group",    value: groupDesc },
              { label: "Guide ID", value: savedGuideId ?? "Not saved" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-bold text-orange-700">{label}</p>
                <p className="text-xs text-gray-700 leading-snug">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {onSave !== undefined && (
            <button
              onClick={onSave}
              disabled={!!savedGuideId}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {savedGuideId ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Saved
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  Save Guide
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={pdfState === "generating"}
            className="inline-flex items-center gap-2 rounded-lg bg-[#214068] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a3354] disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#214068]"
          >
            {pdfState === "generating" ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF…
              </>
            ) : pdfState === "done" ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Downloaded!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>

        {/* Facts ticker — shown when we have destination facts */}
        {report.destinationFacts && report.destinationFacts.length > 0 && (
          <FactsTicker facts={report.destinationFacts} />
        )}
      </div>

      {/* ── Report content ─────────────────────────────────────────────────────── */}
      <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white">

        {/* Safety — always shown first */}
        <div className="px-6 py-6 sm:px-8">
          <Reveal
            revealed={revealed.has("safety")}
            animateIn={animateIn}
            skeleton={<SafetySkeleton />}
          >
            <SafetyBanner
              safety={report.safety}
              acknowledged={safetyAcknowledged}
              onAcknowledge={() => setSafetyAcknowledged(true)}
            />
          </Reveal>
        </div>

        {/* Rest gated behind RED acknowledgment */}
        {!blocked && (
          <>
            {report.accommodationSuggestions && report.accommodationSuggestions.length > 0 && (
              <>
                <SectionDivider />
                <div className="px-6 py-6 sm:px-8">
                  <Reveal
                    revealed={revealed.has("accommodation")}
                    animateIn={animateIn}
                    skeleton={<AccommodationSkeleton />}
                  >
                    <AccommodationSuggestions suggestions={report.accommodationSuggestions} />
                  </Reveal>
                </div>
              </>
            )}

            <SectionDivider />
            <div className="px-6 py-6 sm:px-8">
              <Reveal
                revealed={revealed.has("attractions")}
                animateIn={animateIn}
                skeleton={<AttractionsSkeleton />}
              >
                <Attractions
                  attractions={report.attractions}
                  transportMode={formData.transportMode}
                />
              </Reveal>
            </div>

            <SectionDivider />
            <div className="px-6 py-6 sm:px-8">
              <Reveal
                revealed={revealed.has("cuisine")}
                animateIn={animateIn}
                skeleton={<CuisineSkeleton />}
              >
                <Cuisine cuisine={report.cuisine} />
              </Reveal>
            </div>

            <SectionDivider />
            <div className="px-6 py-6 sm:px-8">
              <Reveal
                revealed={revealed.has("practical")}
                animateIn={animateIn}
                skeleton={<PracticalSkeleton />}
              >
                <PracticalInfo practical={report.practical} />
              </Reveal>
            </div>

            {/* Closing line — only show once all sections are revealed */}
            {(!animateIn || revealed.has("practical")) && (
              <div className="border-t border-gray-100 px-6 py-5 text-center sm:px-8">
                <p className="text-sm italic text-orange-700">
                  Have a wonderful trip to {destination}!
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Report generated by Claude AI · Always verify safety information with official government travel advisories before travelling.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-gray-100" />;
}

function AccommodationSuggestions({ suggestions }: { suggestions: AccommodationSuggestion[] }) {
  return (
    <section aria-labelledby="accom-suggest-heading">
      <div className="mb-4 rounded-lg bg-[#214068] px-4 py-2.5">
        <h2 id="accom-suggest-heading" className="text-sm font-bold uppercase tracking-widest text-white">
          Where to Stay
        </h2>
        <p className="text-xs italic text-blue-200 mt-0.5">
          Best neighborhoods based on your itinerary
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {suggestions.map((s, i) => (
          <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="font-bold text-[#214068] text-sm">{s.area}</p>
            <p className="text-sm text-gray-700 leading-snug">{s.why}</p>
            {s.topNearbyAttractions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700 mb-1">
                  Nearby highlights
                </p>
                <ul className="space-y-0.5">
                  {s.topNearbyAttractions.map((name, j) => (
                    <li key={j} className="text-xs text-gray-600">– {name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
