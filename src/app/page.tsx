"use client";

import { useState } from "react";
import type { TravelReport } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";
import { useGuides } from "@/hooks/useGuides";
import { generateGuideId } from "@/lib/pdf-generator";
import TravelForm from "@/components/TravelForm";
import TravelReportComponent from "@/components/TravelReport";
import MyGuidesPage from "@/components/MyGuides";
import type { SavedGuide } from "@/lib/guides-storage";

type Tab = "new" | "guides";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [report, setReport] = useState<TravelReport | null>(null);
  const [destination, setDestination] = useState("");
  const [formData, setFormData] = useState<TravelFormValues | null>(null);
  const [savedGuideId, setSavedGuideId] = useState<string | null>(null);

  const { guides, save, remove } = useGuides();

  function handleReport(newReport: TravelReport, dest: string, data: TravelFormValues) {
    setReport(newReport);
    setDestination(dest);
    setFormData(data);
    setSavedGuideId(null);
    setActiveTab("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setReport(null);
    setDestination("");
    setFormData(null);
    setSavedGuideId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave() {
    if (!report || !formData) return;
    const id = generateGuideId(formData.destination, formData.departureDate);
    const guide: SavedGuide = {
      id,
      destination: formData.destination,
      departureDate: formData.departureDate,
      returnDate: formData.returnDate,
      groupType: formData.group.type,
      groupSize: { adults: formData.group.adults, children: formData.group.children },
      report,
      formData,
      createdAt: new Date().toISOString(),
    };
    save(guide);
    setSavedGuideId(id);
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">✈️ Travel Planner</h1>
          <p className="mt-3 text-lg text-gray-600 max-w-xl mx-auto">
            AI-generated travel guides — safety, attractions, food, and everything you need.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-8">
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
            🗺️ My Guides{guideCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                {guideCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "new" ? (
          report && formData ? (
            <TravelReportComponent
              report={report}
              destination={destination}
              formData={formData}
              savedGuideId={savedGuideId}
              onSave={handleSave}
              onViewGuides={() => setActiveTab("guides")}
              onReset={handleReset}
            />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
              <TravelForm onReport={handleReport} />
            </div>
          )
        ) : (
          <MyGuidesPage
            guides={guides}
            onDelete={remove}
            onDownload={handleDownload}
          />
        )}
      </div>
    </main>
  );
}
