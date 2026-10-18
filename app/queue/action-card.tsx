"use client";

import { useState, useTransition } from "react";
import { decideAction, editAction } from "./actions";

type Props = {
  id: string;
  platform: string;
  text: string;
  status: "pending" | "approved" | "rejected";
  source: "demo" | "claude";
};

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
};

export default function ActionCard({ id, platform, text, status, source }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const r = await decideAction(id, decision);
      if (r.error) setError(r.error);
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await editAction(id, draft);
      if (r.error) setError(r.error);
      else setEditing(false);
    });
  }

  return (
    <article className="post-card">
      <div className="post-meta">
        <span className="badge">{PLATFORM_LABEL[platform] ?? platform}</span>
        {source === "demo" ? <span className="badge badge-dim">Sample draft</span> : null}
      </div>

      {editing ? (
        <>
          <label className="sr-only" htmlFor={`edit-${id}`}>
            Edit post text
          </label>
          <textarea
            id={`edit-${id}`}
            className="post-edit"
            rows={6}
            value={draft}
            maxLength={2200}
            onChange={(e) => setDraft(e.target.value)}
          />
          {status === "approved" ? (
            <p className="fine">Saving an edit removes your approval. You will need to approve it again.</p>
          ) : null}
          <div className="row-actions">
            <button className="btn btn-small" onClick={save} disabled={pending}>
              {pending ? "Saving..." : "Save edit"}
            </button>
            <button
              className="btn btn-ghost btn-small"
              onClick={() => {
                setEditing(false);
                setDraft(text);
                setError(null);
              }}
              disabled={pending}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="post-text">{text}</p>
          {status === "approved" ? (
            <p className="fine">Approved. Publishing to your accounts comes in the next update.</p>
          ) : null}
          {status === "rejected" ? <p className="fine">Rejected. This will not be published.</p> : null}
          <div className="row-actions">
            {status === "pending" ? (
              <>
                <button className="btn btn-small" onClick={() => decide("approve")} disabled={pending}>
                  Approve
                </button>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => decide("reject")}
                  disabled={pending}
                >
                  Reject
                </button>
              </>
            ) : null}
            {status !== "rejected" ? (
              <button
                className="btn btn-ghost btn-small"
                onClick={() => setEditing(true)}
                disabled={pending}
              >
                Edit
              </button>
            ) : null}
          </div>
        </>
      )}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}
