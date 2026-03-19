import type { SafetyStatus } from "@/types/travel";

interface Props {
  safety: SafetyStatus;
  acknowledged: boolean;
  onAcknowledge: () => void;
}

const LEVEL_CONFIG = {
  RED: {
    emoji: "🔴",
    label: "HIGH RISK",
    banner: "bg-red-50 border-red-300",
    heading: "text-red-800",
    body: "text-red-700",
    badge: "bg-red-100 text-red-800 border border-red-300",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  ORANGE: {
    emoji: "🟠",
    label: "CAUTION ADVISED",
    banner: "bg-amber-50 border-amber-300",
    heading: "text-amber-800",
    body: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border border-amber-300",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  GREEN: {
    emoji: "🟢",
    label: "SAFE TO VISIT",
    banner: "bg-green-50 border-green-300",
    heading: "text-green-800",
    body: "text-green-700",
    badge: "bg-green-100 text-green-800 border border-green-300",
    button: "",
  },
};

export default function SafetyBanner({ safety, acknowledged, onAcknowledge }: Props) {
  const cfg = LEVEL_CONFIG[safety.level];
  const needsAck = safety.level === "RED" && !acknowledged;

  return (
    <div
      role="alert"
      aria-label={`Safety level: ${safety.level}. ${safety.headline}`}
      className={`rounded-xl border-2 p-5 ${cfg.banner}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden="true">
          {cfg.emoji}
        </span>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${cfg.badge}`}>
              {safety.level} — {cfg.label}
            </span>
          </div>
          <h2 className={`text-base font-bold ${cfg.heading}`}>{safety.headline}</h2>
          <p className={`text-sm ${cfg.body}`}>{safety.summary}</p>

          {safety.specificRisks.length > 0 && (
            <ul className={`text-sm space-y-1 list-disc list-inside ${cfg.body}`}>
              {safety.specificRisks.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          )}

          {needsAck && (
            <button
              onClick={onAcknowledge}
              className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${cfg.button}`}
            >
              I understand the risks — show me the guide anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
