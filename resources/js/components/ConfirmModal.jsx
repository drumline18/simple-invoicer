export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <h3 id="modal-title">{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>{cancelLabel || "Cancel"}</button>
          <button type="button" className="primary" onClick={onConfirm}>
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
