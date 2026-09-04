import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { shiftService } from "../services/shiftService";
import { programService } from "../services/programService";
import { useAuth } from "../context/AuthContext";
import StateBadge from "../components/StateBadge";
import EmptyState from "../components/EmptyState";

export default function ShiftsPage() {
  const { isCoordinator } = useAuth();
  const [params, setParams] = useSearchParams({ page: "1", limit: "10", sortBy: "date", sortOrder: "asc" });
  const query = Object.fromEntries(params.entries());

  const { data, isLoading, error } = useQuery({
    queryKey: ["shifts", query],
    queryFn: () => shiftService.list(query),
  });
  const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: () => programService.list() });

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", key === "page" ? value : "1");
    setParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isCoordinator ? "All shifts" : "Available shifts"}</h1>
        {isCoordinator && (
          <Link to="/shifts/new" className="rounded-lg bg-brand-600 px-4 py-2 text-white">New shift</Link>
        )}
      </div>
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-5">
        <input className="rounded-lg border px-3 py-2" placeholder="Search program or location" defaultValue={query.search} onBlur={(e) => update("search", e.target.value)} />
        <select className="rounded-lg border px-3 py-2" value={query.programId || ""} onChange={(e) => update("programId", e.target.value)}>
          <option value="">All programs</option>
          {(programs?.programs || []).map((program) => (
            <option key={program._id} value={program._id}>{program.name}</option>
          ))}
        </select>
        <select className="rounded-lg border px-3 py-2" value={query.state || ""} onChange={(e) => update("state", e.target.value)}>
          <option value="">All states</option>
          {["OPEN", "PARTIALLY_FILLED", "FILLED", "CLOSED"].map((state) => (
            <option key={state}>{state}</option>
          ))}
        </select>
        <input className="rounded-lg border px-3 py-2" type="date" value={query.dateFrom || ""} onChange={(e) => update("dateFrom", e.target.value)} />
        <select className="rounded-lg border px-3 py-2" value={`${query.sortBy}:${query.sortOrder}`} onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(":");
          update("sortBy", sortBy);
          const next = new URLSearchParams(params);
          next.set("sortBy", sortBy);
          next.set("sortOrder", sortOrder);
          setParams(next);
        }}>
          <option value="date:asc">Date asc</option>
          <option value="date:desc">Date desc</option>
          <option value="startTime:asc">Start time</option>
          <option value="state:asc">Fill state</option>
        </select>
      </div>
      {isLoading && <div>Loading shifts...</div>}
      {error && <div className="text-red-600">Could not load shifts.</div>}
      {!isLoading && data?.items?.length === 0 && <EmptyState title="No shifts found" body="Try adjusting filters." />}
      {data?.items?.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="p-3">Program</th>
                <th>Date</th>
                <th>Start</th>
                <th>Location</th>
                <th>Fill</th>
                <th>Signups</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((shift) => (
                <tr key={shift._id} className="border-t">
                  <td className="p-3">{shift.program?.name}</td>
                  <td>{String(shift.date).slice(0, 10)}</td>
                  <td>{shift.startTime}</td>
                  <td>{shift.location}</td>
                  <td><StateBadge state={shift.state} /></td>
                  <td>{shift.currentSignups}/{shift.requiredHeadcount}</td>
                  <td><Link className="text-brand-600" to={`/shifts/${shift._id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-3 text-sm">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} matches
            </span>
            <div className="space-x-2">
              <button disabled={data.pagination.page <= 1} onClick={() => update("page", String(data.pagination.page - 1))}>Prev</button>
              <button disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => update("page", String(data.pagination.page + 1))}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
