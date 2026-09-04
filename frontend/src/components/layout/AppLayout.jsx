import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { alertService } from "../../services/dashboardService";

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-white/15 text-white" : "text-slate-200 hover:bg-white/10"
  }`;

export default function AppLayout() {
  const { user, logout, isCoordinator } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["alerts"],
    queryFn: alertService.list,
    enabled: isCoordinator,
  });

  const alertCount = data?.count || 0;

  const nav = (
    <>
      <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>
        Dashboard
      </NavLink>
      <NavLink to="/programs" className={linkClass} onClick={() => setOpen(false)}>
        {isCoordinator ? "Programs" : "My Programs"}
      </NavLink>
      <NavLink to="/shifts" className={linkClass} onClick={() => setOpen(false)}>
        {isCoordinator ? "All Shifts" : "Available Shifts"}
      </NavLink>
      {isCoordinator && (
        <NavLink to="/alerts" className={linkClass} onClick={() => setOpen(false)}>
          Alerts {alertCount > 0 && <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs text-slate-900">{alertCount}</span>}
        </NavLink>
      )}
      {!isCoordinator && (
        <NavLink to="/my-signups" className={linkClass} onClick={() => setOpen(false)}>
          My Signups
        </NavLink>
      )}
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden bg-slate-900 p-5 lg:block">
        <div className="mb-8 text-lg font-semibold text-white">Volunteer Scheduling</div>
        <nav className="space-y-1">{nav}</nav>
      </aside>

      <div>
        <header className="flex items-center justify-between border-b bg-white px-4 py-3">
          <button className="rounded-lg border px-3 py-1 lg:hidden" onClick={() => setOpen((v) => !v)}>
            Menu
          </button>
          <div className="text-sm text-slate-600">
            {user?.name} · {user?.role}
          </div>
          <button
            className="rounded-lg border px-3 py-1 text-sm"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </header>
        {open && <div className="space-y-1 bg-slate-900 p-4 lg:hidden">{nav}</div>}
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
