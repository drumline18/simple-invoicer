const DEFAULT_TAX_1 = { label: "GST", ratePercent: 5, number: "" };
const DEFAULT_TAX_2 = { label: "QST", ratePercent: 9.975, number: "" };

export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function taxConfigFromSettings(settings = {}) {
  const tax1Label = String(settings.tax_1_label || DEFAULT_TAX_1.label).trim();
  const tax2Label = String(settings.tax_2_label || DEFAULT_TAX_2.label).trim();
  const tax1RatePercent = Math.max(0, toNumber(settings.tax_1_rate ?? DEFAULT_TAX_1.ratePercent));
  const tax2RatePercent = Math.max(0, toNumber(settings.tax_2_rate ?? DEFAULT_TAX_2.ratePercent));

  return {
    tax1: {
      label: tax1Label,
      ratePercent: tax1RatePercent,
      rateDecimal: tax1RatePercent / 100,
      number: String(settings.tax_1_number || settings.gst_number || DEFAULT_TAX_1.number || ""),
      enabled: Boolean(tax1Label) && tax1RatePercent > 0,
    },
    tax2: {
      label: tax2Label,
      ratePercent: tax2RatePercent,
      rateDecimal: tax2RatePercent / 100,
      number: String(settings.tax_2_number || settings.qst_number || DEFAULT_TAX_2.number || ""),
      enabled: Boolean(tax2Label) && tax2RatePercent > 0,
    },
  };
}

export function recalcInvoice(items, taxConfig = taxConfigFromSettings()) {
  const normalizedItems = (items || []).map((item) => {
    const qty = toNumber(item.qty);
    const unitPrice = toNumber(item.unitPrice);
    const taxable = item.taxable !== false;
    const lineSubtotal = qty * unitPrice;
    const gst = taxable && taxConfig.tax1.enabled ? lineSubtotal * taxConfig.tax1.rateDecimal : 0;
    const qst = taxable && taxConfig.tax2.enabled ? lineSubtotal * taxConfig.tax2.rateDecimal : 0;
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
    taxConfig,
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
