import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardService } from "../services/dashboardService";
import { alertService } from "../services/alertService";
import { useAuth } from "../context/AuthContext";
import StateBadge from "../components/StateBadge";
import EmptyState from "../components/EmptyState";

export default function DashboardPage() {
  const { isCoordinator } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardService.summary });
  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: alertService.list,
    enabled: isCoordinator,
  });

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 font-medium">
        Loading dashboard metrics...
      </div>
    );

  if (error)
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 font-medium">
        Could not load dashboard metrics.
      </div>
    );

  const summary = data.summary || data;
  const cards = [
    {
      label: "Shifts This Week",
      value: summary.shiftsThisWeek,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50/60 border-blue-100",
    },
    {
      label: "Open Shifts",
      value: summary.openShiftsThisWeek,
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-600",
      bgLight: "bg-emerald-50/60 border-emerald-100",
    },
    {
      label: "Signups Made",
      value: summary.signupsThisWeek,
      color: "from-indigo-500 to-violet-600",
      textColor: "text-indigo-600",
      bgLight: "bg-indigo-50/60 border-indigo-100",
    },
    {
      label: "Shifts Closed",
      value: summary.closedShiftsThisWeek ?? summary.shiftsClosedThisWeek,
      color: "from-slate-600 to-slate-800",
      textColor: "text-slate-700",
      bgLight: "bg-slate-100/60 border-slate-200",
    },
  ];

  const upcoming = summary.upcomingShifts || [];
  const recentAlerts = alerts?.alerts || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time scheduling operational insights</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all duration-200`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</div>
            <div className={`mt-2 text-3xl font-black ${card.textColor}`}>{card.value ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Signups Trend (8 Weeks)</h2>
            <span className="text-xs font-medium text-slate-400">Weekly Total</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.signupsPerWeek || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="mb-4 font-bold text-slate-900">Shifts Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(summary.byState || {}).map(([state, count]) => (
                <div
                  key={state}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5"
                >
                  <StateBadge state={state} />
                  <span className="font-bold text-slate-800 text-sm">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">By Program</h3>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {(summary.byProgram || []).map((row) => (
                <div key={row._id} className="flex justify-between text-xs font-medium text-slate-600">
                  <span className="truncate pr-2">{row.programName}</span>
                  <span className="font-bold text-slate-900">{row.count} shifts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Upcoming Shifts</h2>
            <Link className="text-xs font-bold text-indigo-600 hover:text-indigo-800" to="/shifts">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming shifts" body="Scheduled shifts will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {upcoming.map((shift) => (
                <li key={shift._id} className="flex items-center justify-between py-3 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                  <div>
                    <div className="font-semibold text-slate-800">{shift.program?.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {String(shift.date).slice(0, 10)} · {shift.startTime} · {shift.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StateBadge state={shift.state} />
                    <Link
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 shadow-subtle transition-all"
                      to={`/shifts/${shift._id}`}
                    >
                      Details
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isCoordinator && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Understaffed Alerts</h2>
              <Link className="text-xs font-bold text-indigo-600 hover:text-indigo-800" to="/alerts">
                Manage alerts
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                All upcoming shifts within 3 days are adequately staffed.
              </p>
            ) : (
              <div className="space-y-2">
                {recentAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.shiftId}
                    className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/40 px-4 py-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{alert.programName}</div>
                      <div className="text-slate-500 mt-0.5">
                        {alert.date} at {alert.startTime} · {alert.currentSignups}/{alert.requiredHeadcount} signed up
                      </div>
                    </div>
                    <StateBadge state={alert.state} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
