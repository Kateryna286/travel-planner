import type { CuisineReport } from "@/types/travel";

interface Props {
  cuisine: CuisineReport;
}

function BooleanBadge({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {value ? "✓" : "✗"} {value ? trueLabel : falseLabel}
    </span>
  );
}

export default function Cuisine({ cuisine }: Props) {
  const { mustTryDishes, restaurantCategories, dietaryConsiderations, diningCustoms, tippingGuidance } = cuisine;

  return (
    <section aria-labelledby="cuisine-heading" className="space-y-6">
      <h2 id="cuisine-heading" className="text-xl font-bold text-gray-900">
        🍜 Local Cuisine & Dining
      </h2>

      {/* Must-try dishes */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Must-Try Dishes</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mustTryDishes.map((dish, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-3 space-y-1">
              <p className="font-semibold text-gray-900 text-sm">{dish.name}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{dish.description}</p>
              <p className="text-xs text-gray-400 italic">📍 {dish.whereToFind}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant categories */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Where to Eat</h3>
        <div className="space-y-2">
          {restaurantCategories.map((cat, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
              <div className="flex items-center gap-2 sm:w-40 shrink-0">
                <span className="font-semibold text-sm text-gray-800">{cat.type}</span>
                <span className="text-xs text-blue-600 font-medium">{cat.priceRange}</span>
              </div>
              <div className="text-sm text-gray-600 flex-1">
                {cat.description}
                {cat.recommendation && (
                  <span className="text-gray-500"> — Try: <em>{cat.recommendation}</em></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dietary considerations */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Dietary Considerations</h3>
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <BooleanBadge value={dietaryConsiderations.vegetarianFriendly} trueLabel="Vegetarian-friendly" falseLabel="Limited vegetarian" />
            <BooleanBadge value={dietaryConsiderations.veganOptions} trueLabel="Vegan options" falseLabel="Limited vegan" />
            <BooleanBadge value={dietaryConsiderations.halalAvailable} trueLabel="Halal available" falseLabel="Halal limited" />
            <BooleanBadge value={dietaryConsiderations.kosherAvailable} trueLabel="Kosher available" falseLabel="Kosher limited" />
          </div>
          {dietaryConsiderations.commonAllergens.length > 0 && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-amber-700">Common allergens:</span>{" "}
              {dietaryConsiderations.commonAllergens.join(", ")}
            </p>
          )}
          {dietaryConsiderations.notes && (
            <p className="text-sm text-gray-600">{dietaryConsiderations.notes}</p>
          )}
        </div>
      </div>

      {/* Dining customs + tipping */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">Dining Customs</h3>
          <ul className="text-sm text-gray-600 space-y-1.5">
            {diningCustoms.map((custom, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-teal-500 shrink-0">•</span>
                <span>{custom}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
          <h3 className="text-sm font-semibold text-teal-800 mb-1">💵 Tipping</h3>
          <p className="text-sm text-teal-700">{tippingGuidance}</p>
        </div>
      </div>
    </section>
  );
}
