import Link from "next/link";

export default function StatCard({
  label,
  value,
  sub,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "danger" | "success";
  href?: string;
}) {
  const accentClass =
    tone === "danger"
      ? "border-l-brick"
      : tone === "success"
      ? "border-l-teal"
      : "border-l-ink/20";

  const valueClass =
    tone === "danger" ? "text-brick" : tone === "success" ? "text-teal" : "text-ink";

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/40">{sub}</p>}
    </>
  );

  const classes = `block rounded-xl border border-ivory-line border-l-4 bg-ivory-card p-5 shadow-sm transition ${accentClass} ${
    href ? "hover:border-gold hover:shadow-md" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
