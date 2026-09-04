import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { alertService } from "../services/dashboardService";
import { getErrorMessage } from "../services/api";
import StateBadge from "../components/StateBadge";
import EmptyState from "../components/EmptyState";

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["alerts"], queryFn: alertService.list });

  const dismiss = async (shiftId) => {
    try {
      await alertService.dismiss(shiftId);
      toast.success("Alert dismissed");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) return <div>Loading alerts...</div>;
  const alerts = data?.alerts || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Alerts {alerts.length}</h1>
      {alerts.length === 0 ? (
        <EmptyState title="No understaffed shifts" body="Upcoming open or partially filled shifts within 3 days will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="p-3">Program</th>
                <th>Date</th>
                <th>Start</th>
                <th>Location</th>
                <th>Signups</th>
                <th>State</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.shiftId} className="border-t">
                  <td className="p-3">{alert.programName}</td>
                  <td>{alert.date}</td>
                  <td>{alert.startTime}</td>
                  <td>{alert.location}</td>
                  <td>{alert.currentSignups}/{alert.requiredHeadcount}</td>
                  <td><StateBadge state={alert.state} /></td>
                  <td className="space-x-3">
                    <Link className="text-brand-600" to={`/shifts/${alert.shiftId}`}>Open</Link>
                    <button className="text-slate-600" onClick={() => dismiss(alert.shiftId)}>Dismiss</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
