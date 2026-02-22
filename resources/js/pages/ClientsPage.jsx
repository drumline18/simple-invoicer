import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import { archiveClient, listClients, restoreClient, saveClient, updateClient } from "../lib/api";

const EMPTY_CLIENT = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("Loading clients...");
  const [archiveModal, setArchiveModal] = useState({ open: false, client: null });

  async function loadClients(nextSearch = search, nextShowArchived = showArchived) {
    try {
      const rows = await listClients(nextSearch.trim(), nextShowArchived);
      setClients(rows);
      setNotice(rows.length ? "" : "No clients found.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadClients();
  }, [search, showArchived]);

  const activeClients = useMemo(
    () => clients.filter((client) => !client.is_archived),
    [clients]
  );

  const archivedClients = useMemo(
    () => clients.filter((client) => client.is_archived),
    [clients]
  );

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_CLIENT);
  }

  function startEdit(client) {
    setEditingId(client.id);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setNotice(`Editing ${client.name}.`);
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      };

      if (editingId) {
        await updateClient(editingId, payload);
        setNotice("Client updated.");
      } else {
        await saveClient({ ...payload, overwrite: false });
        setNotice("Client added.");
      }

      startNew();
      await loadClients();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleRestore(clientId) {
    try {
      await restoreClient(clientId);
      setNotice("Client restored.");
      await loadClients();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function confirmArchive() {
    const client = archiveModal.client;
    setArchiveModal({ open: false, client: null });
    if (!client) {
      return;
    }

    try {
      await archiveClient(client.id);
      setNotice("Client archived.");
      if (editingId === client.id) {
        startNew();
      }
      await loadClients();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <section className="panel">
      <h2>Clients</h2>

      <div className="panel-toolbar">
        <input
          type="search"
          value={search}
          placeholder="Search client name"
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="checkbox-row compact">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          <span>Show archived</span>
        </label>
      </div>

      <form onSubmit={submit} className="clients-form">
        <div className="form-grid two">
          <label>
            Client name
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
            />
          </label>
        </div>
        <div className="form-grid two">
          <label>
            Phone
            <input
              type="text"
              value={form.phone}
              onChange={(event) => updateForm("phone", event.target.value)}
            />
          </label>
          <label>
            Address
            <textarea
              rows="2"
              value={form.address}
              onChange={(event) => updateForm("address", event.target.value)}
            />
          </label>
        </div>
        <div className="row-actions">
          <button type="submit" className="primary">
            {editingId ? "Update Client" : "Add Client"}
          </button>
          {editingId ? (
            <button type="button" onClick={startNew}>Cancel Edit</button>
          ) : null}
        </div>
      </form>

      <h3>Active clients</h3>
      <ul className="client-list">
        {activeClients.map((client) => (
          <li key={client.id}>
            <div>
              <strong>{client.name}</strong>
              <div className="muted">{client.email || client.phone || "No contact info"}</div>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => startEdit(client)}>Edit</button>
              <button
                type="button"
                onClick={() => setArchiveModal({ open: true, client })}
              >
                Archive
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showArchived ? (
        <>
          <h3>Archived clients</h3>
          <ul className="client-list">
            {archivedClients.map((client) => (
              <li key={client.id}>
                <div>
                  <strong>{client.name}</strong>
                  <div className="muted">Archived</div>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => handleRestore(client.id)}>Restore</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="notice">{notice}</p>

      <ConfirmModal
        open={archiveModal.open}
        title="Archive client"
        message={`Archive "${archiveModal.client?.name || ""}"? It will be hidden from quick fill until restored.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmArchive}
        onCancel={() => setArchiveModal({ open: false, client: null })}
      />
    </section>
  );
}
