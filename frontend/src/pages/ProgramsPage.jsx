import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { programService } from "../services/programService";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";

export default function ProgramsPage() {
  const { isCoordinator } = useAuth();
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["programs", includeArchived],
    queryFn: () => programService.list(isCoordinator && includeArchived ? { archived: "all" } : undefined),
  });

  if (isLoading) return <div>Loading programs...</div>;
  if (error) return <div className="text-red-600">Could not load programs.</div>;

  const programs = data.programs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isCoordinator ? "Programs" : "My Programs"}</h1>
        {isCoordinator && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">
              <input
                className="mr-2"
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
              Show archived
            </label>
            <Link to="/programs/new" className="rounded-lg bg-brand-600 px-4 py-2 text-white">
              New program
            </Link>
          </div>
        )}
      </div>
      {programs.length === 0 ? (
        <EmptyState title="No programs yet" body="Programs you belong to will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <Link key={program._id} to={`/programs/${program._id}`} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{program.name}</h2>
                {program.archived && <span className="text-xs text-slate-500">Archived</span>}
              </div>
              <p className="mt-2 text-sm text-slate-500">{program.description || "No description"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
