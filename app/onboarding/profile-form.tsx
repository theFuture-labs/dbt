"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveProfile } from "./actions";
import { TONE_OPTIONS, type ProfileValues } from "../../lib/profile";

const STEPS = [
  { title: "Your business", hint: "Start with the basics." },
  { title: "Products and customers", hint: "What you sell, and to whom." },
  { title: "Your voice", hint: "How your posts should sound." },
  { title: "Your rules", hint: "Lines your team must never cross." },
];

export default function ProfileForm({
  initial,
  editing,
}: {
  initial: ProfileValues;
  editing: boolean;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ProfileValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleTone(tone: string) {
    const has = values.tone.includes(tone);
    if (!has && values.tone.length >= 4) return;
    set("tone", has ? values.tone.filter((t) => t !== tone) : [...values.tone, tone]);
  }

  function next() {
    if (step === 0 && !values.name.trim()) {
      setError("Add your business name to continue.");
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveProfile(values);
      if (result?.error) setError(result.error);
    });
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="auth-panel wide">
      <p className="step-count">
        Step {step + 1} of {STEPS.length}
      </p>
      <h1>{STEPS[step].title}</h1>
      <p className="muted">{STEPS[step].hint}</p>

      {step === 0 && (
        <>
          <label className="field">
            <span>Business name</span>
            <input
              value={values.name}
              maxLength={120}
              onChange={(e) => set("name", e.target.value)}
              autoComplete="organization"
            />
          </label>
          <label className="field">
            <span>What does your business do?</span>
            <textarea
              rows={4}
              value={values.whatWeDo}
              onChange={(e) => set("whatWeDo", e.target.value)}
              placeholder="Two or three sentences is plenty."
            />
          </label>
        </>
      )}

      {step === 1 && (
        <>
          <label className="field">
            <span>Main products or services</span>
            <textarea
              rows={4}
              value={values.products}
              onChange={(e) => set("products", e.target.value)}
              placeholder="List what you sell, with prices if you like."
            />
          </label>
          <label className="field">
            <span>Who are your customers?</span>
            <textarea
              rows={4}
              value={values.audience}
              onChange={(e) => set("audience", e.target.value)}
              placeholder="Age, location, what they care about."
            />
          </label>
        </>
      )}

      {step === 2 && (
        <>
          <fieldset className="field">
            <legend>Pick up to four words that describe your voice</legend>
            <div className="chips">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  className={values.tone.includes(tone) ? "chip on" : "chip"}
                  aria-pressed={values.tone.includes(tone)}
                  onClick={() => toggleTone(tone)}
                >
                  {tone}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Anything else about how you talk to customers?</span>
            <textarea
              rows={4}
              value={values.voiceNotes}
              onChange={(e) => set("voiceNotes", e.target.value)}
              placeholder="Words you love, how you greet people, emoji or no emoji."
            />
          </label>
        </>
      )}

      {step === 3 && (
        <>
          <label className="field">
            <span>Always do</span>
            <textarea
              rows={3}
              value={values.dos}
              onChange={(e) => set("dos", e.target.value)}
              placeholder="For example: mention delivery is nationwide."
            />
          </label>
          <label className="field">
            <span>Never do</span>
            <textarea
              rows={3}
              value={values.donts}
              onChange={(e) => set("donts", e.target.value)}
              placeholder="For example: never promise discounts or compare us to competitors."
            />
          </label>
          <p className="fine">
            Your team drafts everything and waits for your approval before
            anything is published.
          </p>
        </>
      )}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="actions">
        {step > 0 ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={pending}
          >
            Back
          </button>
        ) : editing ? (
          <Link className="btn btn-ghost" href="/dashboard">
            Cancel
          </Link>
        ) : (
          <span />
        )}
        {last ? (
          <button type="button" className="btn" onClick={submit} disabled={pending}>
            {pending ? "Saving..." : editing ? "Save changes" : "Finish setup"}
          </button>
        ) : (
          <button type="button" className="btn" onClick={next}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
