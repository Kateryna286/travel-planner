import type { PracticalInfo } from "@/types/travel";

interface Props {
  practical: PracticalInfo;
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      <div className="text-sm text-gray-600 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="font-medium text-gray-500 shrink-0">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export default function PracticalInfo({ practical }: Props) {
  const { currency, transportation, electrical, language, weather, emergency, visa, culturalCustoms } = practical;

  return (
    <section aria-labelledby="practical-heading" className="space-y-4">
      <h2 id="practical-heading" className="text-xl font-bold text-gray-900">
        📋 Essential Practical Information
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Currency */}
        <Card title="Currency" icon="💰">
          <Row label="Currency" value={`${currency.name} (${currency.code})`} />
          <Row label="Exchange" value={currency.exchangeTip} />
          <Row label="Payment" value={currency.cashVsCard} />
        </Card>

        {/* Transport */}
        <Card title="Transportation" icon="🚗">
          <Row label="Drive on" value={transportation.drivingSide === "left" ? "Left side" : "Right side"} />
          <Row label="Int'l license" value={transportation.internationalLicenseRequired ? "Required" : "Not required"} />
          <Row label="Public transit" value={transportation.publicTransportSummary} />
          {transportation.taxiRideshareApps.length > 0 && (
            <Row label="Apps" value={transportation.taxiRideshareApps.join(", ")} />
          )}
        </Card>

        {/* Electrical */}
        <Card title="Electricity" icon="🔌">
          <Row label="Voltage" value={electrical.voltage} />
          <Row label="Plug types" value={electrical.plugTypes.join(", ")} />
          <Row label="Adapter" value={electrical.adapterNeeded ? "⚠️ Adapter needed" : "✓ No adapter needed"} />
        </Card>

        {/* Language */}
        <Card title="Language" icon="💬">
          <Row label="Official" value={language.official.join(", ")} />
          <Row label="English" value={language.englishWidelySpoken ? "Widely spoken" : "Limited"} />
          {language.usefulPhrases.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="font-medium text-gray-500 text-xs uppercase tracking-wide">Useful phrases</p>
              {language.usefulPhrases.map((p, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="font-medium text-gray-700 shrink-0">"{p.phrase}"</span>
                  <span className="text-gray-500">= {p.translation}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Weather */}
        <Card title="Weather" icon="🌤️">
          <Row label="Season" value={weather.currentSeason} />
          <Row label="Conditions" value={weather.expectedConditions} />
          <Row label="Best time" value={weather.bestSeasons} />
          {weather.avoidSeasons && <Row label="Avoid" value={weather.avoidSeasons} />}
          {weather.packingTips.length > 0 && (
            <div className="mt-1">
              <span className="font-medium text-gray-500">Pack: </span>
              {weather.packingTips.join(", ")}
            </div>
          )}
        </Card>

        {/* Emergency */}
        <Card title="Emergency Contacts" icon="🚨">
          <Row label="Police" value={<span className="font-mono font-bold">{emergency.policeNumber}</span>} />
          <Row label="Ambulance" value={<span className="font-mono font-bold">{emergency.ambulanceNumber}</span>} />
          {emergency.touristPolice && (
            <Row label="Tourist police" value={<span className="font-mono font-bold">{emergency.touristPolice}</span>} />
          )}
          <p className="text-xs text-gray-500 mt-1 italic">{emergency.embassyTip}</p>
        </Card>

        {/* Visa */}
        <Card title="Visa Requirements" icon="🛂">
          <Row label="Required?" value={visa.requiredForCommonPassports} />
          <p className="text-xs text-gray-500 italic">{visa.processingNote}</p>
        </Card>

        {/* Cultural customs */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 sm:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <span aria-hidden="true">🙏</span>
            Cultural Customs & Etiquette
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {culturalCustoms.map((custom, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-indigo-400 shrink-0">•</span>
                <span>{custom}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}
