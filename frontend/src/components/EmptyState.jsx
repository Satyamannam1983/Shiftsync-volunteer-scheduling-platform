export default function EmptyState({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}
