export default function StateBadge({ state }) {
  const styles = {
    OPEN: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dot: "bg-emerald-500",
    },
    PARTIALLY_FILLED: {
      badge: "bg-amber-50 text-amber-700 border-amber-200/80",
      dot: "bg-amber-500",
    },
    FILLED: {
      badge: "bg-blue-50 text-blue-700 border-blue-200/80",
      dot: "bg-blue-500",
    },
    CLOSED: {
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const current = styles[state] || { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${current.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`}></span>
      {state ? state.replace("_", " ") : "UNKNOWN"}
    </span>
  );
}
