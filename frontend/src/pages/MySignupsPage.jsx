import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { signupService } from "../services/shiftService";
import EmptyState from "../components/EmptyState";

export default function MySignupsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["my-signups"], queryFn: signupService.mine });
  if (isLoading) return <div>Loading signups...</div>;
  const signups = data?.signups || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My signups</h1>
      {signups.length === 0 ? (
        <EmptyState title="No active signups" body="When you join a shift it will show up here." />
      ) : (
        <ul className="space-y-3">
          {signups.map((signup) => (
            <li key={signup._id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="font-medium">{signup.shift?.program?.name}</div>
              <div className="text-sm text-slate-500">
                {String(signup.shift?.date || "").slice(0, 10)} · {signup.shift?.startTime} · {signup.shift?.location}
              </div>
              <Link className="mt-2 inline-block text-sm text-brand-600" to={`/shifts/${signup.shift?._id}`}>
                View shift
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
