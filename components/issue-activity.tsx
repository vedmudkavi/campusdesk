"use client";
import { useEffect, useState } from "react";
type Entry = {
  id: string;
  author: string;
  kind: string;
  message: string;
  created: number;
};
export function IssueActivity({ ticketId }: { ticketId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setEntries([]);
    setError("");
    fetch(`/api/activity?ticketId=${encodeURIComponent(ticketId)}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok)
          throw Error("Could not load activity. Reopen the issue to retry.");
        return r.json() as Promise<Entry[]>;
      })
      .then(setEntries)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [ticketId]);
  async function comment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          message: new FormData(form).get("message"),
        }),
      });
      const data = (await r.json()) as Entry & { error?: string };
      if (!r.ok) throw Error(data.error || "Unable to post comment.");
      setEntries((previous) => [...previous, data]);
      form.reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="activity">
      <h3>Activity & discussion</h3>
      <p className="activity-intro">A clear record of every step forward.</p>
      {loading ? (
        <p role="status">Loading activity…</p>
      ) : (
        <ol className="timeline">
          {entries.map((entry) => (
            <li key={entry.id} className={entry.kind}>
              <span className="timeline-dot" />
              <div>
                <b>{entry.author}</b>
                <time dateTime={new Date(entry.created).toISOString()}>
                  {new Date(entry.created).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                <p>{entry.message}</p>
              </div>
            </li>
          ))}
          {!entries.length && <li>Updates and comments will appear here.</li>}
        </ol>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={comment}>
        <label>
          Add a comment
          <textarea
            name="message"
            required
            maxLength={1000}
            rows={3}
            placeholder="Share an update or add useful context…"
          />
        </label>
        <button className="primary" disabled={busy || loading}>
          {busy ? "Posting…" : "Post comment"}
        </button>
      </form>
    </section>
  );
}
