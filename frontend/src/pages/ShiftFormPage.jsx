import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { shiftService } from "../services/shiftService";
import { programService } from "../services/programService";
import { getErrorMessage } from "../services/api";

export default function ShiftFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({
    program: search.get("programId") || "",
    date: "",
    startTime: "09:00",
    durationMinutes: 120,
    location: "",
    requiredHeadcount: 4,
  });

  useEffect(() => {
    programService.list().then((data) => setPrograms(data.programs || []));
    if (id) {
      shiftService.get(id).then((data) => {
        const shift = data.shift;
        setForm({
          program: shift.program?._id || shift.program,
          date: String(shift.date).slice(0, 10),
          startTime: shift.startTime,
          durationMinutes: shift.durationMinutes,
          location: shift.location,
          requiredHeadcount: shift.requiredHeadcount,
        });
      });
    }
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        requiredHeadcount: Number(form.requiredHeadcount),
      };
      if (id) {
        await shiftService.update(id, payload);
        toast.success("Shift updated");
        navigate(`/shifts/${id}`);
      } else {
        const created = await shiftService.create(payload);
        toast.success("Shift created");
        navigate(`/shifts/${created.shift._id}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3 rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{id ? "Edit shift" : "Create shift"}</h1>
      <select className="w-full rounded-lg border px-3 py-2" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} required>
        <option value="">Program</option>
        {programs.filter((program) => !program.archived).map((program) => (
          <option key={program._id} value={program._id}>{program.name}</option>
        ))}
      </select>
      <input className="w-full rounded-lg border px-3 py-2" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
      <input className="w-full rounded-lg border px-3 py-2" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
      <input className="w-full rounded-lg border px-3 py-2" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
      <input className="w-full rounded-lg border px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
      <input className="w-full rounded-lg border px-3 py-2" type="number" value={form.requiredHeadcount} onChange={(e) => setForm({ ...form, requiredHeadcount: e.target.value })} />
      <button className="rounded-lg bg-brand-600 px-4 py-2 text-white">Save</button>
    </form>
  );
}
