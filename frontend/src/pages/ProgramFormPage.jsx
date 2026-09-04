import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { programService } from "../services/programService";
import { getErrorMessage } from "../services/api";

export default function ProgramFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    programService.get(id).then((data) => {
      setForm({ name: data.program.name, description: data.program.description || "" });
    });
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await programService.update(id, form);
        toast.success("Program updated");
        navigate(`/programs/${id}`);
      } else {
        const created = await programService.create(form);
        toast.success("Program created");
        navigate(`/programs/${created.program._id}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{id ? "Edit program" : "Create program"}</h1>
      <input
        className="w-full rounded-lg border px-3 py-2"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <textarea
        className="w-full rounded-lg border px-3 py-2"
        placeholder="Description"
        rows={4}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <button disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-white">
        Save
      </button>
    </form>
  );
}
