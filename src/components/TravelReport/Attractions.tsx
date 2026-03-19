import type { Attraction } from "@/types/travel";

interface Props {
  attractions: Attraction[];
}

const PRICE_CONFIG = {
  FREE: { label: "Free", style: "bg-green-100 text-green-700" },
  BUDGET: { label: "Budget", style: "bg-blue-100 text-blue-700" },
  MODERATE: { label: "Moderate", style: "bg-yellow-100 text-yellow-700" },
  EXPENSIVE: { label: "Expensive", style: "bg-orange-100 text-orange-700" },
};

export default function Attractions({ attractions }: Props) {
  return (
    <section aria-labelledby="attractions-heading">
      <h2 id="attractions-heading" className="text-xl font-bold text-gray-900 mb-4">
        🗺️ Attractions & Points of Interest
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {attractions.map((attr, i) => {
          const price = PRICE_CONFIG[attr.priceLevel];
          return (
            <article
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 leading-snug">{attr.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{attr.category}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${price.style}`}
                >
                  {price.label}
                </span>
              </div>

              {attr.priceNote && (
                <p className="text-xs text-gray-500 italic">{attr.priceNote}</p>
              )}

              <p className="text-sm text-gray-700 leading-relaxed">{attr.description}</p>

              {attr.tips.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Tips
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {attr.tips.map((tip, j) => (
                      <li key={j} className="flex gap-1.5">
                        <span className="text-blue-400 shrink-0">→</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
