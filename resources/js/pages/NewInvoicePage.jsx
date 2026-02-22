import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import InvoiceEditor from "../components/InvoiceEditor";
import InvoicePdfPreview from "../components/InvoicePdfPreview";
import ToastNotice from "../components/ToastNotice";
import {
  createInvoice,
  getNextInvoiceNumber,
  getSettings,
  listClients,
  saveClient,
  updateInvoice,
} from "../lib/api";
import { emptyInvoice } from "../lib/invoiceMath";

export default function NewInvoicePage() {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(emptyInvoice());
  const [settings, setSettings] = useState({});
  const [clients, setClients] = useState([]);
  const [savedId, setSavedId] = useState(null);
  const [saveClientForQuickFill, setSaveClientForQuickFill] = useState(false);
  const [notice, setNotice] = useState("Ready.");
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
        const [nextSettings, nextClients] = await Promise.all([
          getSettings(),
          listClients(),
        ]);
        setSettings(nextSettings);
        setClients(nextClients);
        const nextNumber = await getNextInvoiceNumber(invoice.issue_date);
        setInvoice((prev) => ({
          ...prev,
          invoice_number: nextNumber,
          terms: prev.terms || nextSettings.default_terms || "",
        }));
      } catch (error) {
        showError(error.message);
      }
    }
    load();
  }, []);

  const preview = useMemo(() => {
    if (savedId) {
      return (
        <iframe
          title="Saved invoice preview"
          src={`/print/invoice/${savedId}`}
          className="preview-iframe"
        />
      );
    }

    return <InvoicePdfPreview invoice={invoice} settings={settings} />;
  }, [invoice, settings, savedId]);

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
    const nextClients = await listClients();
    setClients(nextClients);
  }

  async function saveInvoiceRecord(payload) {
    const saved = savedId
      ? await updateInvoice(savedId, payload)
      : await createInvoice(payload);
    setSavedId(saved.id);
    setInvoice((prev) => ({ ...prev, invoice_number: saved.invoice_number }));
    return saved;
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

    return saveInvoiceRecord(payload);
  }

  async function handleSave(payload) {
    try {
      const saved = await saveInvoiceWithOptionalClient(payload);
      if (!saved) {
        return;
      }
      showSuccess("Invoice saved.");
      navigate(`/invoices/${saved.id}/edit`, { replace: true });
    } catch (error) {
      showError(error.message);
    }
  }

  async function handleExport() {
    try {
      let currentId = savedId;
      if (!currentId) {
        const saved = await saveInvoiceWithOptionalClient(invoice);
        if (!saved) {
          return;
        }
        currentId = saved.id;
        setSavedId(saved.id);
        showSuccess("Invoice saved and opened for PDF export.");
        navigate(`/invoices/${saved.id}/edit`, { replace: true });
      }
      window.open(`/print/invoice/${currentId}?autoprint=1`, "_blank", "noopener");
    } catch (error) {
      showError(error.message);
    }
  }

  async function startFresh() {
    const fresh = emptyInvoice();
    const nextNumber = await getNextInvoiceNumber(fresh.issue_date).catch(() => "");
    setSavedId(null);
    setSaveClientForQuickFill(false);
    setInvoice({
      ...fresh,
      invoice_number: nextNumber,
      terms: settings.default_terms || "",
    });
    navigate("/invoices/new");
    showInfo("Started a new invoice.");
  }

  return (
    <div>
      <div className="page-tools">
        <button type="button" onClick={startFresh}>New Blank Invoice</button>
      </div>
      <InvoiceEditor
        invoice={invoice}
        onInvoiceChange={setInvoice}
        onSave={handleSave}
        onExport={handleExport}
        mode={savedId ? "edit" : "new"}
        modeLabel={savedId ? `Editing invoice #${invoice.invoice_number}` : "Creating a new invoice"}
        saveLabel={savedId ? "Update Invoice" : "Save Invoice"}
        notice={notice}
        noticeTone={noticeTone}
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
            if (!saved) {
              return;
            }
            showSuccess("Client overwritten and invoice saved.");
            navigate(`/invoices/${saved.id}/edit`, { replace: true });
          } catch (error) {
            showError(error.message);
          }
        }}
        onCancel={() => {
          setOverwriteModal({ open: false, payload: null });
          showInfo("Client save canceled. Invoice was not saved.");
        }}
      />
    </div>
  );
}
