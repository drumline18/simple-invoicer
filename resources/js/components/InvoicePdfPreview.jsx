const GST_RATE = 0.05;
const QST_RATE = 0.09975;

function centsFromNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function moneyFromCents(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function recalcLikeServer(items) {
  const normalizedItems = (items || []).map((item) => {
    const qty = Number(item.qty || 0);
    const unitPriceCents = centsFromNumber(item.unitPrice);
    const taxable = item.taxable !== false;
    const lineSubtotalCents = Math.round(qty * unitPriceCents);
    const gstCents = taxable ? Math.round(lineSubtotalCents * GST_RATE) : 0;
    const qstCents = taxable ? Math.round(lineSubtotalCents * QST_RATE) : 0;
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

function labelsForLanguage(language) {
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
      gst: "TPS (5%)",
      qst: "TVQ (9.975%)",
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
    gst: "GST (5%)",
    qst: "QST (9.975%)",
    total: "Total",
    notes: "Notes",
    terms: "Terms",
  };
}

export default function InvoicePdfPreview({ invoice, settings }) {
  const totals = recalcLikeServer(invoice.items);
  const hasNotes = Boolean((invoice.notes || "").trim());
  const hasTerms = Boolean((invoice.terms || "").trim());
  const labels = labelsForLanguage(invoice.language);

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
          <p className="preview-small">GST: {line(settings.gst_number)}</p>
          <p className="preview-small">QST: {line(settings.qst_number)}</p>
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
              <td className="num">{moneyFromCents(item.lineTotalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="preview-totals">
        <div className="preview-totals-row"><span>{labels.subtotal}</span><span>{moneyFromCents(totals.subtotalCents)}</span></div>
        <div className="preview-totals-row"><span>{labels.gst}</span><span>{moneyFromCents(totals.gstCents)}</span></div>
        <div className="preview-totals-row"><span>{labels.qst}</span><span>{moneyFromCents(totals.qstCents)}</span></div>
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
