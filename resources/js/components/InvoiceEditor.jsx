import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Printer, Save, Trash2 } from "lucide-react";
import { fmtCad, recalcInvoice, toNumber } from "../lib/invoiceMath";

function ItemRow({ item, index, onItemChange, onRemoveItem }) {
  return (
    <tr>
      <td>
        <input
          type="text"
          value={item.description}
          onChange={(event) => onItemChange(index, "description", event.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.qty}
          onChange={(event) => onItemChange(index, "qty", event.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(event) => onItemChange(index, "unitPrice", event.target.value)}
        />
      </td>
      <td className="center-cell">
        <input
          type="checkbox"
          checked={item.taxable !== false}
          onChange={(event) => onItemChange(index, "taxable", event.target.checked)}
        />
      </td>
      <td>
        <button type="button" className="danger with-icon" onClick={() => onRemoveItem(index)}>
          <Trash2 size={16} aria-hidden="true" />
          Remove
        </button>
      </td>
    </tr>
  );
}

export default function InvoiceEditor({
  invoice,
  onInvoiceChange,
  onSave,
  onExport,
  mode,
  modeLabel,
  saveLabel,
  notice,
  noticeTone,
  preview,
  clients,
  saveClientForQuickFill,
  onSaveClientForQuickFillChange,
}) {
  const isEditMode = String(mode || "").toLowerCase() === "edit";
  const totals = recalcInvoice(invoice.items);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const suggestionWrapRef = useRef(null);

  const filteredClients = useMemo(() => {
    const source = Array.isArray(clients) ? clients : [];
    const query = String(invoice.client_name || "").trim().toLowerCase();
    const matched = query
      ? source.filter((client) => String(client.name || "").toLowerCase().includes(query))
      : source;
    return matched.slice(0, 8);
  }, [clients, invoice.client_name]);

  useEffect(() => {
    function onDocumentMouseDown(event) {
      if (!suggestionWrapRef.current) {
        return;
      }
      if (!suggestionWrapRef.current.contains(event.target)) {
        setIsSuggestionOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, []);

  function updateField(field, value) {
    onInvoiceChange({ ...invoice, [field]: value });
  }

  function onItemChange(index, field, value) {
    const nextItems = invoice.items.map((item, i) => {
      if (i !== index) {
        return item;
      }
      return {
        ...item,
        [field]: value,
      };
    });
    onInvoiceChange({ ...invoice, items: nextItems });
  }

  function addItem() {
    onInvoiceChange({
      ...invoice,
      items: [...invoice.items, { description: "", qty: 1, unitPrice: 0, taxable: true }],
    });
  }

  function removeItem(index) {
    const nextItems = invoice.items.filter((_, i) => i !== index);
    onInvoiceChange({
      ...invoice,
      items: nextItems.length
        ? nextItems
        : [{ description: "", qty: 1, unitPrice: 0, taxable: true }],
    });
  }

  function submit(event) {
    event.preventDefault();
    const payload = {
      ...invoice,
      items: invoice.items.map((item) => ({
        ...item,
        qty: toNumber(item.qty),
        unitPrice: toNumber(item.unitPrice),
      })),
    };
    onSave(payload);
  }

  function applyClientSuggestion(client) {
    if (!client) {
      return;
    }

    onInvoiceChange({
      ...invoice,
      client_name: client.name || "",
      client_email: client.email || "",
      client_phone: client.phone || "",
      client_address: client.address || "",
    });
    setIsSuggestionOpen(false);
    setActiveSuggestionIndex(-1);
  }

  function onClientNameChange(value) {
    updateField("client_name", value);
    setIsSuggestionOpen(true);
    setActiveSuggestionIndex(-1);
  }

  function onClientNameKeyDown(event) {
    if (!isSuggestionOpen || !filteredClients.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % filteredClients.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => {
        if (prev <= 0) {
          return filteredClients.length - 1;
        }
        return prev - 1;
      });
      return;
    }

    if (event.key === "Enter") {
      if (activeSuggestionIndex >= 0 && filteredClients[activeSuggestionIndex]) {
        event.preventDefault();
        applyClientSuggestion(filteredClients[activeSuggestionIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsSuggestionOpen(false);
      setActiveSuggestionIndex(-1);
    }
  }

  return (
    <div className="editor-layout">
      <section className="panel editor-panel">
        <div className={`editor-mode ${isEditMode ? "edit" : "new"}`}>
          <strong>{isEditMode ? "EDIT" : "NEW"}</strong>
          <span>{modeLabel || (isEditMode ? "Editing Invoice" : "New Invoice")}</span>
        </div>
        <div className="panel-toolbar">
          <button type="submit" className="primary with-icon" form="invoice-editor-form">
            <Save size={16} aria-hidden="true" />
            {saveLabel || "Save Invoice"}
          </button>
          <button type="button" onClick={onExport} className="with-icon">
            <Printer size={16} aria-hidden="true" />
            Export PDF
          </button>
        </div>

        <form id="invoice-editor-form" onSubmit={submit}>
          <fieldset className="form-section">
            <legend>Invoice Details</legend>
            <div className="form-grid two">
              <label>
                Invoice number
                <input
                  type="text"
                  value={invoice.invoice_number}
                  onChange={(event) => updateField("invoice_number", event.target.value)}
                  required
                />
              </label>
              <label>
                Issue date
                <input
                  type="date"
                  value={invoice.issue_date}
                  onChange={(event) => updateField("issue_date", event.target.value)}
                  required
                />
              </label>
            </div>
            <div className="form-grid two">
              <label>
                Due date
                <input
                  type="date"
                  value={invoice.due_date || ""}
                  onChange={(event) => updateField("due_date", event.target.value)}
                />
              </label>
              <label>
                Export language
                <select
                  value={invoice.language || "en"}
                  onChange={(event) => updateField("language", event.target.value)}
                >
                  <option value="en">English</option>
                  <option value="fr">Francais</option>
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Client Info</legend>
            <div className="form-grid two">
              <label>
                Client name
                <div className="client-name-autocomplete" ref={suggestionWrapRef}>
                  <input
                    type="text"
                    value={invoice.client_name}
                    onFocus={() => setIsSuggestionOpen(true)}
                    onChange={(event) => onClientNameChange(event.target.value)}
                    onKeyDown={onClientNameKeyDown}
                    autoComplete="off"
                  />
                  {isSuggestionOpen && filteredClients.length ? (
                    <ul className="client-suggestions" role="listbox">
                      {filteredClients.map((client, index) => (
                        <li key={client.id}>
                          <button
                            type="button"
                            className={index === activeSuggestionIndex ? "active" : ""}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyClientSuggestion(client)}
                          >
                            <span>{client.name}</span>
                            <small>{client.email || client.phone || "Saved client"}</small>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </label>
              <label>
                Client email
                <input
                  type="email"
                  value={invoice.client_email}
                  onChange={(event) => updateField("client_email", event.target.value)}
                />
              </label>
            </div>
            <div className="form-grid two">
              <label>
                Client phone
                <input
                  type="text"
                  value={invoice.client_phone}
                  onChange={(event) => updateField("client_phone", event.target.value)}
                />
              </label>
              <label>
                Client address
                <textarea
                  rows="2"
                  value={invoice.client_address}
                  onChange={(event) => updateField("client_address", event.target.value)}
                />
              </label>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={saveClientForQuickFill === true}
                onChange={(event) => onSaveClientForQuickFillChange(event.target.checked)}
              />
              <span>Save this client for quick fill</span>
            </label>
          </fieldset>

          <h3>Line items</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit (CAD)</th>
                <th>Taxable</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <ItemRow
                  key={`item-${index}`}
                  item={item}
                  index={index}
                  onItemChange={onItemChange}
                  onRemoveItem={removeItem}
                />
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addItem} className="with-icon">
            <Plus size={16} aria-hidden="true" />
            Add item
          </button>

          <div className="totals-box">
            <div><span>Subtotal</span><strong>{fmtCad(totals.subtotal)}</strong></div>
            <div><span>GST (5%)</span><strong>{fmtCad(totals.gst)}</strong></div>
            <div><span>QST (9.975%)</span><strong>{fmtCad(totals.qst)}</strong></div>
            <div className="grand"><span>Total</span><strong>{fmtCad(totals.total)}</strong></div>
          </div>

          <label>
            Notes
            <textarea
              rows="3"
              value={invoice.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </label>

          <label>
            Terms
            <textarea
              rows="3"
              value={invoice.terms}
              onChange={(event) => updateField("terms", event.target.value)}
            />
          </label>
        </form>
        {notice ? (
          <p className={`notice-pill ${noticeTone || "info"}`}>{notice}</p>
        ) : null}
      </section>

      <section className="panel preview-panel">
        <h2>PDF Preview</h2>
        <div className="preview-page-frame">
          {preview}
        </div>
      </section>
    </div>
  );
}
