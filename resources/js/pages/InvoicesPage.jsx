import { useEffect, useState } from "react";
import { CirclePlus, Pencil, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { listInvoices } from "../lib/api";
import { fmtCad } from "../lib/invoiceMath";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [notice, setNotice] = useState("Loading invoices...");

  useEffect(() => {
    async function load() {
      try {
        const rows = await listInvoices(search.trim());
        setInvoices(rows);
        setNotice(rows.length ? "" : "No invoices found.");
      } catch (error) {
        setNotice(error.message);
      }
    }

    load();
  }, [search]);

  return (
    <div className="page-container">
    <section className="panel">
      <div className="panel-toolbar">
        <input
          type="search"
          value={search}
          placeholder="Search by number or client"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Link className="button-link with-icon" to="/invoices/new">
          <CirclePlus size={16} aria-hidden="true" />
          New Invoice
        </Link>
      </div>

      {notice ? <p className="notice">{notice}</p> : null}

      <ul className="invoice-listing">
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <div>
              <strong>{invoice.invoice_number}</strong>
              <div className="muted">{invoice.client_name || "Client not specified"}</div>
            </div>
            <div className="muted">{invoice.issue_date}</div>
            <div><strong>{fmtCad(Number(invoice.total))}</strong></div>
            <div className="row-actions">
              <Link className="button-link with-icon" to={`/invoices/${invoice.id}/edit`}>
                <Pencil size={16} aria-hidden="true" />
                Edit
              </Link>
              <button
                type="button"
                className="with-icon"
                onClick={() => window.open(`/print/invoice/${invoice.id}?autoprint=1`, "_blank", "noopener")}
              >
                <Printer size={16} aria-hidden="true" />
                Export PDF
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
    </div>
  );
}
