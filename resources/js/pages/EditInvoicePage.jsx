import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import InvoiceEditor from "../components/InvoiceEditor";
import InvoicePdfPreview from "../components/InvoicePdfPreview";
import ToastNotice from "../components/ToastNotice";
import { getInvoice, getSettings, listClients, saveClient, updateInvoice } from "../lib/api";
import { normalizeInvoiceFromApi } from "../lib/invoiceMath";

export default function EditInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({});
  const [clients, setClients] = useState([]);
  const [saveClientForQuickFill, setSaveClientForQuickFill] = useState(false);
  const [notice, setNotice] = useState("Loading invoice...");
  const [noticeTone, setNoticeTone] = useState("info");
  const [toast, setToast] = useState({ open: false, message: "", tone: "info" });
  const [overwriteModal, setOverwriteModal] = useState({ open: false, payload: null });
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(message, tone) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ open: true, message, tone });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
      toastTimerRef.current = null;
    }, 3500);
  }

  function closeToast() {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast((prev) => ({ ...prev, open: false }));
  }

  function showInfo(message) {
    setNotice(message);
    setNoticeTone("info");
    showToast(message, "info");
  }

  function showSuccess(message) {
    setNotice(message);
    setNoticeTone("success");
    showToast(message, "success");
  }

  function showError(message) {
    setNotice(message);
    setNoticeTone("error");
    showToast(message, "error");
  }

  useEffect(() => {
    async function load() {
      try {
        const [loadedInvoice, loadedSettings, loadedClients] = await Promise.all([
          getInvoice(id),
          getSettings(),
          listClients(),
        ]);
        setInvoice(normalizeInvoiceFromApi(loadedInvoice));
        setSettings(loadedSettings);
        setClients(loadedClients);
        showInfo("Loaded.");
      } catch (error) {
        showError(error.message);
      }
    }
    load();
  }, [id]);

  const preview = useMemo(() => {
    if (!invoice) return null;
    return <InvoicePdfPreview invoice={invoice} settings={settings} />;
  }, [invoice, settings]);

  function clientPayloadFromInvoice(payload, overwrite) {
    return {
      name: payload.client_name,
      email: payload.client_email,
      phone: payload.client_phone,
      address: payload.client_address,
      overwrite: overwrite === true,
    };
  }

  async function refreshClients() {
    const rows = await listClients();
    setClients(rows);
  }

  async function saveInvoiceWithOptionalClient(payload, overwriteExistingClient = false) {
    if (saveClientForQuickFill) {
      if (!String(payload.client_name || "").trim()) {
        throw new Error("Client name is required to save a quick-fill client.");
      }
      try {
        await saveClient(clientPayloadFromInvoice(payload, overwriteExistingClient));
        await refreshClients();
      } catch (error) {
        if (error.status === 409 && error.data?.code === "CLIENT_EXISTS") {
          setOverwriteModal({ open: true, payload });
          showError(error.message);
          return null;
        }
        throw error;
      }
    }

    return updateInvoice(id, payload);
  }

  async function handleSave(payload) {
    try {
      const saved = await saveInvoiceWithOptionalClient(payload);
      if (!saved) {
        return;
      }
      setInvoice(normalizeInvoiceFromApi(saved));
      showSuccess("Invoice updated.");
    } catch (error) {
      showError(error.message);
    }
  }

  function handleExport() {
    window.open(`/print/invoice/${id}?autoprint=1`, "_blank", "noopener");
  }

  if (!invoice) {
    return <div className="panel">{notice}</div>;
  }

  return (
    <div className="page-container-wide">
      <InvoiceEditor
        invoice={invoice}
        onInvoiceChange={setInvoice}
        onSave={handleSave}
        onExport={handleExport}
        mode="edit"
        modeLabel={`Editing invoice #${invoice.invoice_number || id}`}
        saveLabel="Update Invoice"
        notice={notice}
        noticeTone={noticeTone}
        settings={settings}
        preview={preview}
        clients={clients}
        saveClientForQuickFill={saveClientForQuickFill}
        onSaveClientForQuickFillChange={setSaveClientForQuickFill}
      />
      <ToastNotice
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={closeToast}
      />
      <ConfirmModal
        open={overwriteModal.open}
        title="Client already exists"
        message={`A client named "${overwriteModal.payload?.client_name || invoice.client_name}" already exists. Overwrite saved details?`}
        confirmLabel="Overwrite"
        cancelLabel="Cancel"
        onConfirm={async () => {
          const pending = overwriteModal.payload;
          setOverwriteModal({ open: false, payload: null });
          if (!pending) {
            return;
          }
          try {
            const saved = await saveInvoiceWithOptionalClient(pending, true);
            if (saved) {
              setInvoice(normalizeInvoiceFromApi(saved));
              showSuccess("Client overwritten and invoice updated.");
            }
          } catch (error) {
            showError(error.message);
          }
        }}
        onCancel={() => {
          setOverwriteModal({ open: false, payload: null });
          showInfo("Client save canceled. Invoice was not updated.");
        }}
      />
    </div>
  );
}
