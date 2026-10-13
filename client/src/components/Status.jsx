export function Loading({ label = 'Loading…' }) {
  return (
    <div className="status" role="status" aria-live="polite">
      <span className="status__spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorBox({ message }) {
  return (
    <div className="status status--error" role="alert">
      <strong>Stop press.</strong> {message}
    </div>
  );
}
