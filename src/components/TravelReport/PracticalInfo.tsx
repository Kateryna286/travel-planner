import type { PracticalInfo } from "@/types/travel";

interface Props {
  practical: PracticalInfo;
}

function SectionBar({ title }: { title: string }) {
  return (
    <div className="mb-4 rounded-lg bg-[#214068] px-4 py-2.5">
      <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
    </div>
  );
}

function OrangeSubheading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-sm font-bold text-orange-700 uppercase tracking-wide">{children}</h3>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 font-semibold text-gray-500 w-28">{label}:</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

export default function PracticalInfo({ practical }: Props) {
  const { currency, transportation, electrical, language, weather, emergency, visa, culturalCustoms } = practical;

  return (
    <section aria-labelledby="practical-heading" className="space-y-6">
      <SectionBar title="Practical Information" />

      {/* 2-column grid for compact sections */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

        {/* Currency */}
        <div>
          <OrangeSubheading>Currency & Money</OrangeSubheading>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[#214068]">{currency.name} ({currency.code})</p>
            <p className="text-sm text-gray-700">{currency.exchangeTip}</p>
            <p className="text-sm text-gray-700">{currency.cashVsCard}</p>
          </div>
        </div>

        {/* Electricity */}
        <div>
          <OrangeSubheading>Electricity</OrangeSubheading>
          <div className="space-y-1.5">
            <InfoRow label="Voltage" value={electrical.voltage} />
            <InfoRow label="Plug types" value={electrical.plugTypes.join(", ")} />
            <InfoRow label="Adapter" value={
              electrical.adapterNeeded
                ? <span className="font-semibold text-orange-700">⚠ Adapter needed</span>
                : <span className="text-green-700">✓ No adapter needed</span>
            } />
          </div>
        </div>

        {/* Transportation */}
        <div>
          <OrangeSubheading>Getting Around</OrangeSubheading>
          <div className="space-y-1.5">
            <InfoRow
              label="Driving"
              value={
                <span>
                  {transportation.drivingSide === "left" ? "Keep LEFT" : "Keep RIGHT"}
                  {transportation.internationalLicenseRequired && (
                    <span className="ml-1 text-orange-700 font-medium">· Int&apos;l licence required</span>
                  )}
                </span>
              }
            />
            <p className="text-sm text-gray-700 pl-[7.5rem]">{transportation.publicTransportSummary}</p>
            {transportation.taxiRideshareApps.length > 0 && (
              <InfoRow label="Apps" value={transportation.taxiRideshareApps.join(", ")} />
            )}
          </div>
        </div>

        {/* Transport tips */}
        {transportation.transportTips && transportation.transportTips.length > 0 && (
          <div>
            <OrangeSubheading>Transport Tips</OrangeSubheading>
            <ul className="space-y-1.5">
              {transportation.transportTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="shrink-0 text-orange-400">–</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Language */}
        <div>
          <OrangeSubheading>Language</OrangeSubheading>
          <div className="space-y-1.5">
            <InfoRow label="Official" value={language.official.join(", ")} />
            <InfoRow
              label="English"
              value={language.englishWidelySpoken ? "Widely spoken" : "Limited"}
            />
            {language.usefulPhrases.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Useful Phrases</p>
                {language.usefulPhrases.map((ph, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="font-medium text-[#214068] shrink-0">"{ph.phrase}"</span>
                    <span className="text-gray-500">→ {ph.translation}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Weather */}
      <div>
        <OrangeSubheading>Weather & Packing</OrangeSubheading>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 space-y-2">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <InfoRow label="Season" value={weather.currentSeason} />
            <InfoRow label="Conditions" value={weather.expectedConditions} />
            {weather.bestSeasons && <InfoRow label="Best time" value={weather.bestSeasons} />}
            {weather.avoidSeasons && <InfoRow label="Avoid" value={weather.avoidSeasons} />}
          </div>
          {weather.packingTips.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Pack:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {weather.packingTips.map((tip, i) => (
                  <li key={i} className="flex gap-1.5 text-sm text-gray-700">
                    <span className="text-orange-400 shrink-0">–</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Visa */}
      <div>
        <OrangeSubheading>Visa Requirements</OrangeSubheading>
        <p className="text-sm text-gray-700">{visa.requiredForCommonPassports}</p>
        <p className="mt-1 text-xs italic text-gray-400">{visa.processingNote}</p>
      </div>

      {/* Emergency — light blue box */}
      <div>
        <OrangeSubheading>Emergency Contacts</OrangeSubheading>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#214068]">Police</p>
              <p className="font-mono text-lg font-bold text-gray-800">{emergency.policeNumber}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#214068]">Ambulance</p>
              <p className="font-mono text-lg font-bold text-gray-800">{emergency.ambulanceNumber}</p>
            </div>
            {emergency.touristPolice && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#214068]">Tourist Police</p>
                <p className="font-mono text-lg font-bold text-gray-800">{emergency.touristPolice}</p>
              </div>
            )}
          </div>
          <p className="text-xs italic text-gray-500">{emergency.embassyTip}</p>
        </div>
      </div>

      {/* Cultural customs */}
      <div>
        <OrangeSubheading>Cultural Customs & Etiquette</OrangeSubheading>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {culturalCustoms.map((custom, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="shrink-0 text-orange-400">–</span>
              <span>{custom}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
