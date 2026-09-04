import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { programService } from "../services/programService";
import { getErrorMessage } from "../services/api";

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
        {["startDate", "endDate", "startTime", "location"].map((field) => (
          <input
            key={field}
            className="w-full rounded-lg border px-3 py-2"
            type={field.includes("Date") ? "date" : "text"}
            placeholder={field}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required={field !== "location" ? true : true}
          />
        ))}
        <select
          className="w-full rounded-lg border px-3 py-2"
          value={form.dayOfWeek}
          onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
        >
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => (
            <option key={day} value={index}>{day}</option>
          ))}
        </select>
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="number"
          placeholder="Duration minutes"
          value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="number"
          placeholder="Required headcount"
          value={form.requiredHeadcount}
          onChange={(e) => setForm({ ...form, requiredHeadcount: e.target.value })}
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Excluded holidays, comma-separated YYYY-MM-DD"
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
              <pre className="mt-1 overflow-auto rounded bg-slate-50 p-3">{JSON.stringify(result.created, null, 2)}</pre>
            </div>
            <div>
              <h3 className="font-medium">Skipped</h3>
              <pre className="mt-1 overflow-auto rounded bg-slate-50 p-3">{JSON.stringify(result.skipped, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
