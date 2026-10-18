"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createPlanAction, draftFromPlanAction } from "./actions";
import { decideAction } from "../queue/actions";

export function CreatePlanButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const r = await createPlanAction();
      if (r.error) setError(r.error);
    });
  }

  return (
    <div>
      <button className="btn" onClick={run} disabled={pending}>
        {pending ? "Writing your plan..." : label}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PlanDecision({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const r = await decideAction(id, decision);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div>
      <div className="row-actions">
        <button className="btn" onClick={() => decide("approve")} disabled={pending}>
          Approve plan
        </button>
        <button className="btn btn-ghost" onClick={() => decide("reject")} disabled={pending}>
          Reject plan
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DraftFromPlanButton({ remaining }: { remaining: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const r = await draftFromPlanAction();
      if (r.error) {
        setError(r.error);
      } else {
        const kind = r.source === "demo" ? "sample drafts" : "drafts";
        setMessage(`${r.count} ${kind} are waiting for your approval.`);
      }
    });
  }

  return (
    <div>
      <button className="btn" onClick={run} disabled={pending || remaining === 0}>
        {pending ? "Writing drafts..." : remaining === 0 ? "All slots drafted" : "Draft the next 5 posts"}
      </button>
      {message ? (
        <p className="ok-note" role="status">
          {message} <Link href="/queue">Open the queue</Link>
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
