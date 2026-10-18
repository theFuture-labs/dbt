"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { draftPostsAction } from "./actions";

export default function DraftButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await draftPostsAction();
      if (result.error) {
        setError(result.error);
      } else {
        const kind = result.source === "demo" ? "sample drafts" : "drafts";
        setMessage(`${result.count} ${kind} are waiting for your approval.`);
      }
    });
  }

  return (
    <div>
      <button className="btn" onClick={run} disabled={pending}>
        {pending ? "Writing drafts..." : "Draft posts"}
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
