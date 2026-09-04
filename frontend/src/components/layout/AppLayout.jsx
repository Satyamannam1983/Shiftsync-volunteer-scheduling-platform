import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { alertService } from "../../services/alertService";

const linkClass = ({ isActive }) =>
  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
    isActive
      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/40 font-semibold"
      : "text-slate-300 hover:bg-white/10 hover:text-white"
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
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/programs" className={linkClass} onClick={() => setOpen(false)}>
        <span>{isCoordinator ? "Programs" : "My Programs"}</span>
      </NavLink>
      <NavLink to="/shifts" className={linkClass} onClick={() => setOpen(false)}>
        <span>{isCoordinator ? "All Shifts" : "Available Shifts"}</span>
      </NavLink>
      {isCoordinator && (
        <NavLink to="/alerts" className={linkClass} onClick={() => setOpen(false)}>
          <span>Alerts</span>
          {alertCount > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              {alertCount}
            </span>
          )}
        </NavLink>
      )}
      {!isCoordinator && (
        <NavLink to="/my-signups" className={linkClass} onClick={() => setOpen(false)}>
          <span>My Signups</span>
        </NavLink>
      )}
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr] bg-slate-50/80">
      <aside className="hidden bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 p-5 lg:block border-r border-slate-800">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/30">
            VS
          </div>
          <div>
            <div className="text-base font-bold text-white leading-tight">Volunteer</div>
            <div className="text-xs text-slate-400 font-medium">Scheduling Hub</div>
          </div>
        </div>
        <nav className="space-y-1.5">{nav}</nav>
      </aside>

      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur px-6 py-3.5 shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-700 hidden sm:inline-block">
              {isCoordinator ? "Coordinator Workspace" : "Volunteer Workspace"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 py-1 pl-1.5 pr-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 font-bold text-xs text-white">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800 leading-tight">{user?.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
              </div>
            </div>

            <button
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-subtle"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log out
            </button>
          </div>
        </header>

        {open && (
          <div className="space-y-1.5 bg-slate-900 p-4 lg:hidden border-b border-slate-800 shadow-xl">
            {nav}
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
