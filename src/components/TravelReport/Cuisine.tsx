import type { CuisineReport } from "@/types/travel";

interface Props {
  cuisine: CuisineReport;
}

function SectionBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 rounded-lg bg-[#214068] px-4 py-2.5">
      <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
      {subtitle && <p className="text-xs italic text-blue-200 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function OrangeSubheading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-sm font-bold text-orange-700 uppercase tracking-wide">{children}</h3>
  );
}

export default function Cuisine({ cuisine }: Props) {
  const { mustTryDishes, restaurantCategories, dietaryConsiderations, diningCustoms, tippingGuidance } = cuisine;

  return (
    <section aria-labelledby="cuisine-heading" className="space-y-6">
      <SectionBar title="Local Cuisine & Dining" />

      {/* Must-try dishes */}
      <div>
        <OrangeSubheading>Must-Try Dishes</OrangeSubheading>
        <div className="space-y-3">
          {mustTryDishes.map((dish, i) => (
            <div key={i} className="space-y-1 pl-4 border-l-2 border-orange-200">
              <p className="font-bold text-[#214068] text-sm">{dish.name}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{dish.description}</p>
              <p className="text-xs italic text-gray-400">Where to find: {dish.whereToFind}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant table */}
      <div>
        <OrangeSubheading>Restaurant Guide</OrangeSubheading>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          {/* Table header */}
          <div className="grid grid-cols-[120px_90px_1fr] bg-[#214068] px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-white">Type</span>
            <span className="text-xs font-bold uppercase tracking-wide text-white">Price</span>
            <span className="text-xs font-bold uppercase tracking-wide text-white">Description</span>
          </div>
          {/* Table rows */}
          {restaurantCategories.map((cat, i) => (
            <div
              key={i}
              className={`grid grid-cols-[120px_90px_1fr] gap-x-2 px-3 py-2.5 text-sm ${
                i % 2 === 0 ? "bg-blue-50" : "bg-white"
              }`}
            >
              <span className="font-semibold text-[#214068] truncate">{cat.type}</span>
              <span className="text-gray-600">{cat.priceRange}</span>
              <span className="text-gray-700">
                {cat.description}
                {cat.recommendation && (
                  <span className="text-gray-500"> — <em>{cat.recommendation}</em></span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dining customs + tipping */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <OrangeSubheading>Dining Customs</OrangeSubheading>
          <ul className="space-y-1.5">
            {diningCustoms.map((custom, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="shrink-0 text-orange-400">–</span>
                <span>{custom}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-yellow-800">Tipping</p>
          <p className="text-sm text-gray-700">{tippingGuidance}</p>
        </div>
      </div>

      {/* Dietary considerations — beige box */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#214068]">
          Dietary Considerations
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            { val: dietaryConsiderations.vegetarianFriendly, t: "Vegetarian-friendly",    f: "Limited vegetarian" },
            { val: dietaryConsiderations.veganOptions,        t: "Vegan options",          f: "Limited vegan" },
            { val: dietaryConsiderations.halalAvailable,      t: "Halal available",        f: "Halal limited" },
            { val: dietaryConsiderations.kosherAvailable,     t: "Kosher available",       f: "Kosher limited" },
          ].map(({ val, t, f }, i) => (
            <span
              key={i}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                val ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              {val ? "✓" : "✗"} {val ? t : f}
            </span>
          ))}
        </div>
        {dietaryConsiderations.commonAllergens.length > 0 && (
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-orange-700">Common allergens: </span>
            {dietaryConsiderations.commonAllergens.join(", ")}
          </p>
        )}
        {dietaryConsiderations.notes && (
          <p className="mt-1 text-xs text-gray-600">{dietaryConsiderations.notes}</p>
        )}
      </div>
    </section>
  );
}
