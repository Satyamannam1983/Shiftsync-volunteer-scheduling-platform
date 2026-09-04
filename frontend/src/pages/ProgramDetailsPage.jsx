import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { programService } from "../services/programService";
import { shiftService } from "../services/shiftService";
import { userService } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import StateBadge from "../components/StateBadge";

export default function ProgramDetailsPage() {
  const { id } = useParams();
  const { isCoordinator } = useAuth();
  const queryClient = useQueryClient();
  const [volunteerId, setVolunteerId] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["program", id], queryFn: () => programService.get(id) });
  const { data: members } = useQuery({ queryKey: ["members", id], queryFn: () => programService.members(id) });
  const { data: shifts } = useQuery({
    queryKey: ["shifts", { programId: id }],
    queryFn: () => shiftService.list({ programId: id, limit: 20 }),
  });
  const { data: volunteers } = useQuery({
    queryKey: ["volunteers"],
    queryFn: () => userService.volunteers(),
    enabled: isCoordinator,
  });

  if (isLoading) return <div>Loading...</div>;
  const program = data.program;

  const archiveOrRestore = async () => {
    try {
      if (program.archived) await programService.restore(id);
      else await programService.archive(id);
      queryClient.invalidateQueries({ queryKey: ["program", id] });
      toast.success(program.archived ? "Restored" : "Archived");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await programService.addMember(id, volunteerId);
      setVolunteerId("");
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      toast.success("Member added");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeMember = async (volunteer) => {
    if (!window.confirm("Remove this volunteer? Future signups will be cancelled; history is kept.")) return;
    try {
      await programService.removeMember(id, volunteer);
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      toast.success("Member removed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const exportRoster = async () => {
    const blob = await programService.exportRoster(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${program.name}_roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{program.name}</h1>
          <p className="text-slate-500">{program.description}</p>
        </div>
        {isCoordinator && (
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-lg border px-3 py-2" to={`/programs/${id}/edit`}>Edit</Link>
            <Link className="rounded-lg border px-3 py-2" to={`/programs/${id}/recurring`}>Recurring schedule</Link>
            <Link className="rounded-lg border px-3 py-2" to={`/shifts/new?programId=${id}`}>New shift</Link>
            <button className="rounded-lg border px-3 py-2" onClick={exportRoster}>Export Roster</button>
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-white" onClick={archiveOrRestore}>
              {program.archived ? "Restore" : "Archive"}
            </button>
          </div>
        )}
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Members</h2>
        {isCoordinator && (
          <form onSubmit={addMember} className="mb-4 flex gap-2">
            <select className="rounded-lg border px-3 py-2" value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)} required>
              <option value="">Select volunteer</option>
              {(volunteers?.volunteers || []).map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name} ({person.email})
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-white">Add</button>
          </form>
        )}
        <ul className="divide-y">
          {(members?.members || []).map((member) => (
            <li key={member._id} className="flex items-center justify-between py-3 text-sm">
              <span>{member.volunteer?.name} · {member.volunteer?.email}</span>
              {isCoordinator && (
                <button className="text-red-600" onClick={() => removeMember(member.volunteer?._id)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Shifts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-2">Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Fill</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(shifts?.items || []).map((shift) => (
                <tr key={shift._id} className="border-t">
                  <td className="py-2">{String(shift.date).slice(0, 10)}</td>
                  <td>{shift.startTime}</td>
                  <td>{shift.location}</td>
                  <td><StateBadge state={shift.state} /></td>
                  <td><Link className="text-brand-600" to={`/shifts/${shift._id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
