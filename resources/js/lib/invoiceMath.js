export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;

export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function recalcInvoice(items) {
  const normalizedItems = (items || []).map((item) => {
    const qty = toNumber(item.qty);
    const unitPrice = toNumber(item.unitPrice);
    const taxable = item.taxable !== false;
    const lineSubtotal = qty * unitPrice;
    const gst = taxable ? lineSubtotal * GST_RATE : 0;
    const qst = taxable ? lineSubtotal * QST_RATE : 0;
    return {
      ...item,
      qty,
      unitPrice,
      taxable,
      lineSubtotal,
      gst,
      qst,
      lineTotal: lineSubtotal + gst + qst,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const gst = normalizedItems.reduce((sum, item) => sum + item.gst, 0);
  const qst = normalizedItems.reduce((sum, item) => sum + item.qst, 0);
  return {
    items: normalizedItems,
    subtotal,
    gst,
    qst,
    total: subtotal + gst + qst,
  };
}

export function fmtCad(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount || 0);
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function emptyInvoice() {
  const issueDate = todayIsoDate();
  return {
    invoice_number: "",
    language: "en",
    issue_date: issueDate,
    due_date: addDays(issueDate, 30),
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    notes: "",
    terms: "",
    items: [{ description: "", qty: 1, unitPrice: 0, taxable: true }],
  };
}

export function normalizeInvoiceFromApi(invoice) {
  return {
    invoice_number: invoice.invoice_number || "",
    language: String(invoice.language || "en").toLowerCase() === "fr" ? "fr" : "en",
    issue_date: invoice.issue_date || todayIsoDate(),
    due_date: invoice.due_date || "",
    client_name: invoice.client_name || "",
    client_email: invoice.client_email || "",
    client_phone: invoice.client_phone || "",
    client_address: invoice.client_address || "",
    notes: invoice.notes || "",
    terms: invoice.terms || "",
    items: (invoice.items || []).map((item) => ({
      description: item.description || "",
      qty: toNumber(item.qty),
      unitPrice: toNumber(item.unitPrice),
      taxable: item.taxable !== false,
    })),
  };
}
