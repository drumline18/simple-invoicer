import * as invoiceMath from "../lib/invoiceMath";

function taxConfigFallback(settings = {}) {
  const tax1Label = String(settings.tax_1_label || "GST").trim();
  const tax2Label = String(settings.tax_2_label || "QST").trim();
  const tax1RatePercent = Math.max(0, Number(settings.tax_1_rate ?? 5) || 0);
  const tax2RatePercent = Math.max(0, Number(settings.tax_2_rate ?? 9.975) || 0);

  return {
    tax1: {
      label: tax1Label,
      ratePercent: tax1RatePercent,
      rateDecimal: tax1RatePercent / 100,
      number: String(settings.tax_1_number || settings.gst_number || ""),
      enabled: Boolean(tax1Label) && tax1RatePercent > 0,
    },
    tax2: {
      label: tax2Label,
      ratePercent: tax2RatePercent,
      rateDecimal: tax2RatePercent / 100,
      number: String(settings.tax_2_number || settings.qst_number || ""),
      enabled: Boolean(tax2Label) && tax2RatePercent > 0,
    },
  };
}

function centsFromNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function moneyFromCents(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function recalcLikeServer(items, taxConfig) {
  const normalizedItems = (items || []).map((item) => {
    const qty = Number(item.qty || 0);
    const unitPriceCents = centsFromNumber(item.unitPrice);
    const taxable = item.taxable !== false;
    const lineSubtotalCents = Math.round(qty * unitPriceCents);
    const gstCents = taxable && taxConfig.tax1.enabled
      ? Math.round(lineSubtotalCents * taxConfig.tax1.rateDecimal)
      : 0;
    const qstCents = taxable && taxConfig.tax2.enabled
      ? Math.round(lineSubtotalCents * taxConfig.tax2.rateDecimal)
      : 0;
    return {
      description: item.description || "",
      qty,
      unitPriceCents,
      lineTotalCents: lineSubtotalCents + gstCents + qstCents,
      lineSubtotalCents,
      gstCents,
      qstCents,
    };
  });

  const subtotalCents = normalizedItems.reduce((sum, item) => sum + item.lineSubtotalCents, 0);
  const gstCents = normalizedItems.reduce((sum, item) => sum + item.gstCents, 0);
  const qstCents = normalizedItems.reduce((sum, item) => sum + item.qstCents, 0);

  return {
    items: normalizedItems,
    subtotalCents,
    gstCents,
    qstCents,
    totalCents: subtotalCents + gstCents + qstCents,
  };
}

function line(text) {
  return text || "\u00a0";
}

function labelsForLanguage(language, taxConfig) {
  const tax1Label = `${taxConfig.tax1.label} (${taxConfig.tax1.ratePercent}%)`;
  const tax2Label = `${taxConfig.tax2.label} (${taxConfig.tax2.ratePercent}%)`;
  if (String(language || "").toLowerCase() === "fr") {
    return {
      invoice: "Facture",
      issueDate: "Date d'emission",
      dueDate: "Date d'echeance",
      from: "De",
      billTo: "Facture a",
      description: "Description",
      qty: "Qte",
      unitCad: "Unite (CAD)",
      lineTotal: "Total ligne",
      subtotal: "Sous-total",
      gst: tax1Label,
      qst: tax2Label,
      total: "Total",
      notes: "Notes",
      terms: "Modalites",
    };
  }

  return {
    invoice: "Invoice",
    issueDate: "Issue date",
    dueDate: "Due date",
    from: "From",
    billTo: "Bill to",
    description: "Description",
    qty: "Qty",
    unitCad: "Unit (CAD)",
    lineTotal: "Line total",
    subtotal: "Subtotal",
    gst: tax1Label,
    qst: tax2Label,
    total: "Total",
    notes: "Notes",
    terms: "Terms",
  };
}

export default function InvoicePdfPreview({ invoice, settings }) {
  const taxConfig = invoiceMath.taxConfigFromSettings
    ? invoiceMath.taxConfigFromSettings(settings)
    : taxConfigFallback(settings);
  const totals = recalcLikeServer(invoice.items, taxConfig);
  const hasNotes = Boolean((invoice.notes || "").trim());
  const hasTerms = Boolean((invoice.terms || "").trim());
  const labels = labelsForLanguage(invoice.language, taxConfig);

  return (
    <div className="preview-sheet">
      <h1>{labels.invoice} {line(invoice.invoice_number)}</h1>
      <div className="preview-meta">
        <div>{labels.issueDate}: {line(invoice.issue_date)}</div>
        <div>{labels.dueDate}: {line(invoice.due_date)}</div>
      </div>

      <div className="preview-top">
        <section className="preview-card">
          <h2>{labels.from}</h2>
          <p>{line(settings.business_name)}</p>
          <p>{line(settings.business_address)}</p>
          <p>{line(settings.business_email)}</p>
          <p>{line(settings.business_phone)}</p>
          {taxConfig.tax1.enabled ? (
            <p className="preview-small">{taxConfig.tax1.label}: {line(taxConfig.tax1.number)}</p>
          ) : null}
          {taxConfig.tax2.enabled ? (
            <p className="preview-small">{taxConfig.tax2.label}: {line(taxConfig.tax2.number)}</p>
          ) : null}
        </section>
        <section className="preview-card">
          <h2>{labels.billTo}</h2>
          <p>{line(invoice.client_name)}</p>
          <p>{line(invoice.client_address)}</p>
          <p>{line(invoice.client_email)}</p>
          <p>{line(invoice.client_phone)}</p>
        </section>
      </div>

      <table className="preview-table">
        <thead>
          <tr>
              <th>{labels.description}</th>
              <th className="num">{labels.qty}</th>
              <th className="num">{labels.unitCad}</th>
              <th className="num">{labels.lineTotal}</th>
          </tr>
        </thead>
        <tbody>
          {totals.items.map((item, index) => (
            <tr key={`${item.description}-${index}`}>
              <td>{line(item.description)}</td>
              <td className="num">{item.qty}</td>
              <td className="num">{moneyFromCents(item.unitPriceCents)}</td>
              <td className="num">{moneyFromCents(item.lineSubtotalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="preview-totals">
        <div className="preview-totals-row"><span>{labels.subtotal}</span><span>{moneyFromCents(totals.subtotalCents)}</span></div>
        {taxConfig.tax1.enabled ? (
          <div className="preview-totals-row"><span>{labels.gst}</span><span>{moneyFromCents(totals.gstCents)}</span></div>
        ) : null}
        {taxConfig.tax2.enabled ? (
          <div className="preview-totals-row"><span>{labels.qst}</span><span>{moneyFromCents(totals.qstCents)}</span></div>
        ) : null}
        <div className="preview-totals-row grand"><span>{labels.total}</span><span>{moneyFromCents(totals.totalCents)}</span></div>
      </div>

      {hasNotes || hasTerms ? (
        <div className="preview-notes">
          {hasNotes ? (
            <>
              <p><strong>{labels.notes}</strong></p>
              <p>{invoice.notes}</p>
            </>
          ) : null}
          {hasTerms ? (
            <>
              <p><strong>{labels.terms}</strong></p>
              <p>{invoice.terms}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
