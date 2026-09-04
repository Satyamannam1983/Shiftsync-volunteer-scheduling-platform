import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardService, alertService } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";
import StateBadge from "../components/StateBadge";

export default function DashboardPage() {
  const { isCoordinator } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardService.summary });
  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: alertService.list,
    enabled: isCoordinator,
  });

  if (isLoading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-600">Could not load dashboard.</div>;

  const summary = data.summary || data;
  const cards = [
    ["Shifts this week", summary.shiftsThisWeek],
    ["Open this week", summary.openShiftsThisWeek],
    ["Signups this week", summary.signupsThisWeek],
    ["Closed this week", summary.closedShiftsThisWeek ?? summary.shiftsClosedThisWeek],
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-500">Live metrics from the server. No client-side aggregation.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-semibold">{value ?? 0}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Signups per week</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={summary.signupsPerWeek || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Shifts by fill state</h2>
          <ul className="space-y-2">
            {Object.entries(summary.byState || {}).map(([state, count]) => (
              <li key={state} className="flex items-center justify-between">
                <StateBadge state={state} />
                <span>{count}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 font-semibold">By program</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {(summary.byProgram || []).map((row) => (
              <li key={row._id} className="flex justify-between">
                <span>{row.programName}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {isCoordinator && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent alerts</h2>
            <Link className="text-sm text-brand-600" to="/alerts">View all</Link>
          </div>
          {(alerts?.alerts || []).slice(0, 5).map((alert) => (
            <div key={alert.shiftId} className="flex items-center justify-between border-t py-3 text-sm">
              <div>
                {alert.programName} · {alert.date} {alert.startTime}
              </div>
              <StateBadge state={alert.state} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
