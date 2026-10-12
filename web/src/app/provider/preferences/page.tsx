"use client";

export default function ProviderPreferencesPage() {
  return (
    <>
      <p className="eyebrow">Reporting preferences</p>
      <h1>Your reporting preferences</h1>
      <p className="lead">Choose how often to receive a report of cases introduced to your institution.</p>
      <section className="panel">
        <p className="text-sm text-[var(--muted)]">
          SOPHIMA controls the available periods, report content and authorised delivery. Only your own referred
          cases appear.
        </p>
        <button type="button" className="btn btn-primary mt-4">
          Save preference
        </button>
      </section>
    </>
  );
}
