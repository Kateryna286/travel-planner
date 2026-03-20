import type { Attraction } from "@/types/travel";

interface Props {
  attractions: Attraction[];
  transportMode?: "car" | "publicTransport";
}

const PRICE_CONFIG = {
  FREE:      { label: "FREE",      short: "FREE",  bar: "bg-green-100 border-green-400",  text: "text-green-700",  num: "text-green-600" },
  BUDGET:    { label: "BUDGET",    short: "BUDG",  bar: "bg-blue-100 border-blue-400",    text: "text-blue-700",   num: "text-blue-600"  },
  MODERATE:  { label: "MODERATE",  short: "MOD",   bar: "bg-amber-100 border-amber-400",  text: "text-amber-700",  num: "text-amber-600" },
  EXPENSIVE: { label: "EXPENSIVE", short: "PREM",  bar: "bg-pink-100 border-pink-400",    text: "text-pink-700",   num: "text-pink-600"  },
};

export default function Attractions({ attractions, transportMode }: Props) {
  const transportIcon = transportMode === "car" ? "🚗" : "🚌";
  return (
    <section aria-labelledby="attractions-heading">
      {/* Section header — navy bar style */}
      <div className="mb-4 rounded-lg bg-[#214068] px-4 py-2.5">
        <h2 id="attractions-heading" className="text-sm font-bold uppercase tracking-widest text-white">
          Attractions & Points of Interest
        </h2>
        <p className="text-xs italic text-blue-200 mt-0.5">
          {attractions.length} recommended highlights
        </p>
      </div>

      <div className="space-y-2">
        {attractions.map((attr, i) => {
          const price = PRICE_CONFIG[attr.priceLevel];
          return (
            <article key={i} className="flex overflow-hidden rounded-lg border border-gray-200">

              {/* Left badge column */}
              <div className={`flex w-16 shrink-0 flex-col items-center justify-center gap-1 border-r py-4 ${price.bar}`}>
                <span className={`text-lg font-bold leading-none ${price.num}`}>{i + 1}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${price.text}`}>{price.short}</span>
              </div>

              {/* Center content */}
              <div className="flex-1 min-w-0 p-3 space-y-1.5">
                <div>
                  <h3 className="font-bold text-orange-700 leading-snug">{attr.name}</h3>
                  <p className="text-xs italic text-gray-400 mt-0.5">{attr.category}</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{attr.description}</p>
                {attr.tips.length > 0 && (
                  <div className="rounded border border-yellow-300 bg-yellow-50 px-3 py-2">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold text-yellow-800">TIP: </span>
                      {attr.tips[0]}
                    </p>
                    {attr.tips.slice(1).map((tip, j) => (
                      <p key={j} className="text-xs text-gray-700 mt-1">
                        <span className="font-semibold text-yellow-800">TIP: </span>
                        {tip}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="hidden w-40 shrink-0 border-l border-blue-100 bg-blue-50 p-3 space-y-2.5 sm:block">
                {attr.howToGet && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#214068]">
                      {transportIcon} How to get there
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600 leading-snug">{attr.howToGet}</p>
                  </div>
                )}
                {attr.relevantFor.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#214068]">Best For</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {attr.relevantFor.map((tag, j) => (
                        <li key={j} className="text-xs text-gray-600">– {tag}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {attr.priceNote && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#214068]">Price</p>
                    <p className="mt-0.5 text-xs text-gray-600 leading-snug">{attr.priceNote}</p>
                  </div>
                )}
              </div>

            </article>
          );
        })}
      </div>
    </section>
  );
}
