import type { ProductNote } from "@/lib/types";

const HEIGHT = 300;
const WIDTH = 220;

interface PyramidSection {
  position: ProductNote["position"];
  notes: ProductNote[];
  label: string;
  blurb: string;
  fill: string;
}

const sections: Omit<PyramidSection, "notes">[] = [
  { position: "BASE", label: "Base", blurb: "The foundation — lasts for hours.", fill: "#b57f4d" },
  { position: "HEART", label: "Heart", blurb: "The soul of the composition.", fill: "#d9942f" },
  { position: "TOP", label: "Top", blurb: "The first impression.", fill: "#eac575" },
];

function point(x: number, y: number): string {
  return `${x},${y}`;
}

export function NotePyramid({ notes }: { notes: ProductNote[] }) {
  const top = notes.filter((n) => n.position === "TOP").map((n) => n.note.name);
  const heart = notes.filter((n) => n.position === "HEART").map((n) => n.note.name);
  const base = notes.filter((n) => n.position === "BASE").map((n) => n.note.name);

  const configured = sections.map((s) => ({ ...s, notes: notes.filter((n) => n.position === s.position) }));

  const apexY = 20;
  const baseY = HEIGHT - 20;
  const midY = (apexY + baseY) / 2;
  const half = WIDTH / 2 - 12;

  const topPoly = `${point(half, apexY + 2)} ${point(WIDTH - 16, midY - 2)} ${point(16, midY - 2)}`;
  const heartPoly = `${point(16, midY - 2)} ${point(WIDTH - 16, midY - 2)} ${point(WIDTH - 6, baseY - 2)} ${point(6, baseY - 2)}`;
  const basePoly = `${point(6, baseY - 2)} ${point(WIDTH - 6, baseY - 2)} ${point(WIDTH - 6, HEIGHT - 4)} ${point(6, HEIGHT - 4)}`;

  if (!notes.length) return null;

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mx-auto w-full max-w-[240px]" role="img" aria-label="Perfume note pyramid">
        <polygon points={topPoly} fill="#eac575" opacity="0.9" />
        <polygon points={heartPoly} fill="#d9942f" opacity="0.85" />
        <polygon points={basePoly} fill="#b57f4d" opacity="0.8" />
        <g fontSize="13" fontWeight="600" textAnchor="middle" fill="#3e1f0f">
          <text x={half} y={midY - 14}>{top[0] ?? ""}</text>
          <text x={half} y={midY + 34}>{heart[0] ?? ""}</text>
          <text x={half} y={baseY + 22}>{base[0] ?? ""}</text>
        </g>
      </svg>

      <div className="flex flex-col justify-center gap-3">
        {configured.map((section) => (
          <div key={section.position} className="glass-soft flex items-center gap-4 rounded-2xl px-4 py-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: section.fill, boxShadow: `0 0 0 4px ${section.fill}33` }}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/70 dark:text-ivory/70">{section.label}</p>
              <p className="truncate text-sm font-medium text-ink dark:text-ivory">
                {section.notes.map((n) => n.note.name).join(" · ") || "—"}
              </p>
              <p className="text-xs text-ink/50">{section.blurb}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}