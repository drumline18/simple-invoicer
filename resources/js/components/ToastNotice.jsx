export default function ToastNotice({ open, tone = "info", message, onClose }) {
  if (!open || !message) {
    return null;
  }

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <div className={`toast ${tone}`}>
        <p>{message}</p>
        <button type="button" onClick={onClose} aria-label="Dismiss notification">Close</button>
      </div>
    </div>
  );
}
