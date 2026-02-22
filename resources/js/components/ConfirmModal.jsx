import { Check, X } from "lucide-react";

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
          <button type="button" onClick={onCancel} className="with-icon">
            <X size={16} aria-hidden="true" />
            {cancelLabel || "Cancel"}
          </button>
          <button type="button" className="primary with-icon" onClick={onConfirm}>
            <Check size={16} aria-hidden="true" />
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
