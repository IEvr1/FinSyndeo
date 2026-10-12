/** Client introduction journey strip from guidelines `facilities/ui.js`. */
export function ClientJourneySteps({ current = 1 }: { current?: 1 | 2 | 3 | 4 }) {
  const steps = [
    "1. Compare results",
    "2. Choose a solution",
    "3. Pay if required",
    "4. Request confirmed",
  ] as const;

  return (
    <ol className="journey-steps" aria-label="Introduction journey">
      {steps.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3 | 4;
        return (
          <li key={label} aria-current={current === step ? "step" : undefined}>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
