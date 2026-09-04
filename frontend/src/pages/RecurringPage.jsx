import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { programService } from "../services/programService";
import { getErrorMessage } from "../services/api";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function RecurringPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    dayOfWeek: 6,
    startTime: "09:00",
    durationMinutes: 180,
    location: "",
    requiredHeadcount: 8,
    excludedDates: "",
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        dayOfWeek: Number(form.dayOfWeek),
        durationMinutes: Number(form.durationMinutes),
        requiredHeadcount: Number(form.requiredHeadcount),
        excludedDates: form.excludedDates
          ? form.excludedDates.split(",").map((value) => value.trim()).filter(Boolean)
          : [],
      };
      const data = await programService.generateRecurring(id, payload);
      setResult(data);
      toast.success("Schedule generated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Recurring schedule</h1>
        <label className="block text-sm font-medium">Start date</label>
        <input className="w-full rounded-lg border px-3 py-2" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
        <label className="block text-sm font-medium">End date</label>
        <input className="w-full rounded-lg border px-3 py-2" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
        <label className="block text-sm font-medium">Start time</label>
        <input className="w-full rounded-lg border px-3 py-2" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
        <label className="block text-sm font-medium">Location</label>
        <input className="w-full rounded-lg border px-3 py-2" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <label className="block text-sm font-medium">Day of week</label>
        <select
          className="w-full rounded-lg border px-3 py-2"
          value={form.dayOfWeek}
          onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
        >
          {days.map((day, index) => (
            <option key={day} value={index}>{day}</option>
          ))}
        </select>
        <label className="block text-sm font-medium">Duration (minutes)</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="number"
          min="1"
          value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
          required
        />
        <label className="block text-sm font-medium">Required headcount</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="number"
          min="1"
          value={form.requiredHeadcount}
          onChange={(e) => setForm({ ...form, requiredHeadcount: e.target.value })}
          required
        />
        <label className="block text-sm font-medium">Excluded holidays (YYYY-MM-DD, comma-separated)</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="2026-12-25, 2026-01-01"
          value={form.excludedDates}
          onChange={(e) => setForm({ ...form, excludedDates: e.target.value })}
        />
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-white">Generate</button>
      </form>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Result</h2>
        {!result && <p className="mt-2 text-sm text-slate-500">Created and skipped dates will appear here.</p>}
        {result && (
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <h3 className="font-medium">Created</h3>
              {(result.created || []).length === 0 ? <p className="text-slate-500">None</p> : (
                <ul className="mt-1 list-disc pl-5">
                  {result.created.map((row) => (
                    <li key={row.shiftId}>{row.date} · {row.shiftId}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-medium">Skipped</h3>
              {(result.skipped || []).length === 0 ? <p className="text-slate-500">None</p> : (
                <ul className="mt-1 list-disc pl-5">
                  {result.skipped.map((row) => (
                    <li key={`${row.date}-${row.reason}`}>{row.date} · {row.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
