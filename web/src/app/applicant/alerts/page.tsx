"use client";

export default function AlertsPage() {
  return (
    <>
      <p className="eyebrow">Match notifications</p>
      <h1>New-provider notifications</h1>
      <p className="lead">Manage notifications for your saved assessment.</p>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <h2>Keep me informed of new matches</h2>
        <label className="checkline flex gap-2 items-start">
          <input type="checkbox" name="alerts-enabled" />
          <span>Notify me when a new provider fits my requirements.</span>
        </label>
        <p className="text-sm text-[var(--muted)]">
          You can turn notifications off at any time. Essential requirements must still be met.
        </p>
        <label className="field">
          <span>Minimum match</span>
          <select name="threshold" defaultValue="90">
            <option value="80">80%+</option>
            <option value="85">85%+</option>
            <option value="90">90%+</option>
            <option value="95">95%+</option>
            <option value="100">100%</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary">
          Save preference
        </button>
      </form>
    </>
  );
}
