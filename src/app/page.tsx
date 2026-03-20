"use client";

import { useState } from "react";
import type { TravelReport } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";
import { useGuides } from "@/hooks/useGuides";
import TravelForm from "@/components/TravelForm";
import MyGuidesPage from "@/components/MyGuides";
import type { SavedGuide } from "@/lib/guides-storage";

type Tab = "new" | "guides";

export interface PendingReport {
  report: TravelReport;
  destination: string;
  formData: TravelFormValues;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [pendingReport, setPendingReport] = useState<PendingReport | null>(null);

  const { guides, save, remove } = useGuides();

  function handleReport(newReport: TravelReport, dest: string, data: TravelFormValues) {
    setPendingReport({ report: newReport, destination: dest, formData: data });
    setActiveTab("guides");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSavePending(guide: SavedGuide) {
    save(guide);
    setPendingReport(null);
  }

  async function handleDownload(guide: SavedGuide) {
    const { generateTravelPDF } = await import("@/lib/pdf-generator");
    generateTravelPDF(guide.report, guide.formData, guide.id);
  }

  const guideCount = guides.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">✈️ Travel Planner</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600">
            AI-generated travel guides — safety, attractions, food, and everything you need.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mb-8 flex gap-1 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "new"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ✈️ New Guide
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "guides"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🗺️ My Guides
            {guideCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                {guideCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "new" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <TravelForm onReport={handleReport} />
          </div>
        ) : (
          <MyGuidesPage
            guides={guides}
            pendingReport={pendingReport}
            onSavePending={handleSavePending}
            onDelete={remove}
            onDownload={handleDownload}
          />
        )}
      </div>
    </main>
  );
}
