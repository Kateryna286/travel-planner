import type { SafetyStatus } from "@/types/travel";

interface Props {
  safety: SafetyStatus;
  acknowledged: boolean;
  onAcknowledge: () => void;
}

const LEVEL_CONFIG = {
  RED: {
    label: "HIGH RISK",
    bar: "bg-red-600",
    banner: "bg-red-50 border-red-300",
    heading: "text-red-800",
    body: "text-red-700",
    badge: "bg-red-100 text-red-800 border border-red-300",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  ORANGE: {
    label: "USE CAUTION",
    bar: "bg-orange-500",
    banner: "bg-orange-50 border-orange-300",
    heading: "text-orange-800",
    body: "text-orange-700",
    badge: "bg-orange-100 text-orange-800 border border-orange-300",
    button: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  GREEN: {
    label: "SAFE TO TRAVEL",
    bar: "bg-green-600",
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
    <div role="alert" aria-label={`Safety level: ${safety.level}. ${safety.headline}`}>
      {/* Navy-style section header bar */}
      <div className={`flex items-center gap-3 rounded-t-lg px-4 py-2.5 ${cfg.bar}`}>
        <span className={`rounded px-2 py-0.5 text-xs font-bold tracking-widest text-white border border-white/30`}>
          SAFETY STATUS: {cfg.label}
        </span>
        <span className="text-sm font-semibold text-white">{safety.headline}</span>
      </div>

      {/* Body */}
      <div className={`rounded-b-lg border border-t-0 p-4 space-y-3 ${cfg.banner}`}>
        <p className={`text-sm leading-relaxed ${cfg.body}`}>{safety.summary}</p>

        {safety.specificRisks.length > 0 && (
          <div>
            <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${cfg.heading}`}>
              Specific Risks
            </p>
            <ul className={`text-sm space-y-1 ${cfg.body}`}>
              {safety.specificRisks.map((risk, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0">–</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {needsAck && (
          <button
            onClick={onAcknowledge}
            className={`mt-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${cfg.button}`}
          >
            I understand the risks — show me the guide anyway
          </button>
        )}
      </div>
    </div>
  );
}
