import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "volunteer" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Volunteer Scheduling System</p>
        
        <div className="mt-4">
          <label className="block text-sm font-medium">Role</label>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2 bg-white capitalize"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="volunteer">Volunteer</option>
            <option value="coordinator">Coordinator</option>
          </select>
        </div>

        {["name", "email", "password"].map((field) => (
          <div key={field} className="mt-4">
            <label className="block text-sm font-medium capitalize">{field}</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              type={field === "password" ? "password" : field === "email" ? "email" : "text"}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required
            />
          </div>
        ))}

        <button disabled={loading} className="mt-6 w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 transition">
          {loading ? "Creating..." : "Register"}
        </button>
        
        <p className="mt-4 text-sm text-slate-500">
          Already have an account? <Link className="text-brand-600 font-medium hover:underline" to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
