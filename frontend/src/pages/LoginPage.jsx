import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Volunteer Scheduling System</p>
        <label className="mt-6 block text-sm font-medium">Email</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button disabled={loading} className="mt-6 w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 transition">
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-4 text-sm text-slate-500">
          Need an account? <Link className="text-brand-600 font-medium hover:underline" to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
