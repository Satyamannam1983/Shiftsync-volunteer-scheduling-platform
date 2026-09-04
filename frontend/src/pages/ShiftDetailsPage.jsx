import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { shiftService } from "../services/shiftService";
import { userService } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { currentUserId, sameId } from "../utils/ids";
import StateBadge from "../components/StateBadge";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ShiftDetailsPage() {
  const { id } = useParams();
  const { user, isCoordinator } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [volunteerId, setVolunteerId] = useState("");
  const [confirm, setConfirm] = useState(null);

  const { data, isLoading, error } = useQuery({ queryKey: ["shift", id], queryFn: () => shiftService.get(id) });
  const { data: signups } = useQuery({ queryKey: ["signups", id], queryFn: () => shiftService.signups(id) });
  const { data: history } = useQuery({ queryKey: ["history", id], queryFn: () => shiftService.history(id) });
  const { data: volunteers } = useQuery({
    queryKey: ["volunteers"],
    queryFn: () => userService.volunteers(),
    enabled: isCoordinator,
  });

  if (isLoading) return <div>Loading shift...</div>;
  if (error) return <div className="text-red-600">Could not load shift.</div>;

  const shift = data.shift;
  const mySignup = (signups?.signups || []).find((signup) => sameId(signup.volunteer?._id, currentUserId(user)));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["shift", id] });
    queryClient.invalidateQueries({ queryKey: ["signups", id] });
    queryClient.invalidateQueries({ queryKey: ["history", id] });
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  };

  const signup = async () => {
    try {
      await shiftService.signup(id, isCoordinator ? volunteerId : undefined);
      toast.success("Signed up");
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const cancel = (signupId) => {
    setConfirm({
      title: "Cancel this signup?",
      body: "The volunteer will lose this spot and fill state will be recalculated on the server.",
      confirmLabel: "Cancel signup",
      danger: true,
      onConfirm: async () => {
        try {
          await shiftService.cancelSignup(id, signupId);
          toast.success("Signup cancelled");
          refresh();
        } catch (err) {
          toast.error(getErrorMessage(err));
        } finally {
          setConfirm(null);
        }
      },
    });
  };

  const closeShift = () => {
    setConfirm({
      title: "Close this shift?",
      body: "After closing, no new signups or cancellations are allowed.",
      confirmLabel: "Close shift",
      onConfirm: async () => {
        try {
          await shiftService.close(id);
          toast.success("Shift closed");
          refresh();
        } catch (err) {
          toast.error(getErrorMessage(err));
        } finally {
          setConfirm(null);
        }
      },
    });
  };

  const deleteShift = () => {
    setConfirm({
      title: "Delete this shift?",
      body: "This removes the shift. History already recorded stays immutable.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await shiftService.remove(id);
          toast.success("Deleted");
          navigate("/shifts");
        } catch (err) {
          toast.error(getErrorMessage(err));
        } finally {
          setConfirm(null);
        }
      },
    });
  };

  const addNote = async (e) => {
    e.preventDefault();
    try {
      await shiftService.addNote(id, note);
      setNote("");
      toast.success("Note added");
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{shift.program?.name}</p>
          <h1 className="text-2xl font-semibold">{String(shift.date).slice(0, 10)} · {shift.startTime}</h1>
          <p className="text-slate-500">{shift.location} · {shift.durationMinutes} minutes</p>
        </div>
        <StateBadge state={shift.state} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm">Required: {shift.requiredHeadcount}</p>
          <p className="text-sm">Current signups: {shift.currentSignups}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {isCoordinator && <Link className="rounded-lg border px-3 py-2" to={`/shifts/${id}/edit`}>Edit</Link>}
            {isCoordinator && <button className="rounded-lg border px-3 py-2" onClick={closeShift}>Close shift</button>}
            {isCoordinator && <button className="rounded-lg border px-3 py-2 text-red-600" onClick={deleteShift}>Delete</button>}
            {!isCoordinator && !mySignup && <button className="rounded-lg bg-brand-600 px-3 py-2 text-white" onClick={signup}>Sign up</button>}
            {mySignup && <button className="rounded-lg border px-3 py-2" onClick={() => cancel(mySignup._id)}>Cancel my signup</button>}
          </div>
          {isCoordinator && (
            <div className="mt-4 flex gap-2">
              <select className="rounded-lg border px-3 py-2" value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)}>
                <option value="">Signup a volunteer</option>
                {(volunteers?.volunteers || []).map((person) => (
                  <option key={person._id} value={person._id}>{person.name}</option>
                ))}
              </select>
              <button className="rounded-lg bg-brand-600 px-3 py-2 text-white" onClick={signup}>Add</button>
            </div>
          )}
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Current signups</h2>
          <ul className="mt-3 divide-y text-sm">
            {(signups?.signups || []).map((signupRow) => (
              <li key={signupRow._id} className="flex items-center justify-between py-2">
                <span>{signupRow.volunteer?.name}</span>
                {(isCoordinator || sameId(signupRow.volunteer?._id, currentUserId(user))) && (
                  <button className="text-red-600" onClick={() => cancel(signupRow._id)}>Cancel</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {isCoordinator && (
        <form onSubmit={addNote} className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">Add note</h2>
          <textarea className="w-full rounded-lg border px-3 py-2" value={note} onChange={(e) => setNote(e.target.value)} required />
          <button className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-white">Save note</button>
        </form>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">History</h2>
        <ol className="mt-4 space-y-3">
          {(history?.history || []).map((event) => (
            <li key={event._id} className="border-l-2 border-slate-200 pl-4 text-sm">
              <div className="font-medium">{event.type}</div>
              <div className="text-slate-500">{event.actor?.name} · {new Date(event.createdAt).toLocaleString()}</div>
              {event.metadata?.note && <div>{event.metadata.note}</div>}
              {event.metadata?.oldState && <div>{event.metadata.oldState} → {event.metadata.newState}</div>}
            </li>
          ))}
        </ol>
      </section>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        body={confirm?.body}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
