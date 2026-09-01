const STYLES: Record<string, string> = {
  hoog: "bg-red-100 text-red-700",
  midden: "bg-orange-100 text-orange-700",
  laag: "bg-green-100 text-green-700",
  open: "bg-red-100 text-red-700",
  opgelost: "bg-green-100 text-green-700",
  te_doen: "bg-slate-100 text-slate-700",
  mee_bezig: "bg-orange-100 text-orange-700",
  klaar: "bg-green-100 text-green-700",
  urgent: "bg-red-100 text-red-700",
  in_scope: "bg-green-100 text-green-700",
  buiten_scope: "bg-slate-100 text-slate-500",
};

const LABELS: Record<string, string> = {
  te_doen: "Te doen",
  mee_bezig: "Mee bezig",
  klaar: "Klaar",
  niet_gestart: "Niet gestart",
  in_aanvraag: "In aanvraag",
  ingediend: "Ingediend",
  goedgekeurd: "Goedgekeurd",
  afgewezen: "Afgewezen",
};

export default function Badge({ value }: { value: string }) {
  const style = STYLES[value] ?? "bg-slate-100 text-slate-700";
  const label = LABELS[value] ?? value.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {label}
    </span>
  );
}
