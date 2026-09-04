export default function StateBadge({ state }) {
  const styles = {
    OPEN: "bg-emerald-100 text-emerald-800",
    PARTIALLY_FILLED: "bg-amber-100 text-amber-800",
    FILLED: "bg-blue-100 text-blue-800",
    CLOSED: "bg-slate-200 text-slate-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[state] || "bg-slate-100"}`}>
      {state}
    </span>
  );
}
