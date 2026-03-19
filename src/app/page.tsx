"use client";

import { useState } from "react";
import type { TravelReport } from "@/types/travel";
import TravelForm from "@/components/TravelForm";
import TravelReportComponent from "@/components/TravelReport";

export default function Home() {
  const [report, setReport] = useState<TravelReport | null>(null);
  const [destination, setDestination] = useState("");

  function handleReport(newReport: TravelReport, dest: string) {
    setReport(newReport);
    setDestination(dest);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setReport(null);
    setDestination("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {!report ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                ✈️ Travel Planner
              </h1>
              <p className="mt-3 text-lg text-gray-600 max-w-xl mx-auto">
                Tell us about your trip and our AI will generate a personalised
                guide — safety status, attractions, food, and everything you need to know.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
              <TravelForm onReport={handleReport} />
            </div>
          </>
        ) : (
          <TravelReportComponent
            report={report}
            destination={destination}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}
