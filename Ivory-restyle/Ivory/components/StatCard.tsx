export default function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "danger" | "success";
}) {
  const accentClass =
    tone === "danger"
      ? "border-l-brick"
      : tone === "success"
      ? "border-l-teal"
      : "border-l-ink/20";

  const valueClass =
    tone === "danger" ? "text-brick" : tone === "success" ? "text-teal" : "text-ink";

  return (
    <div
      className={`rounded-xl border border-ivory-line border-l-4 bg-ivory-card p-5 shadow-sm ${accentClass}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/40">{sub}</p>}
    </div>
  );
}
