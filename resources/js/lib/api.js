async function readJson(response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const validationMessages = data?.errors
      ? Object.values(data.errors).flat().filter(Boolean)
      : [];
    const message = data.error || data.message || validationMessages[0] || "Request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return response.json();
}

export async function getSettings() {
  const response = await fetch("/api/settings");
  return readJson(response);
}

export async function saveSettings(payload) {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response);
}

export async function listInvoices(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`/api/invoices${query}`);
  return readJson(response);
}

export async function getInvoice(id) {
  const response = await fetch(`/api/invoices/${id}`);
  return readJson(response);
}

export async function createInvoice(payload) {
  const response = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response);
}

export async function updateInvoice(id, payload) {
  const response = await fetch(`/api/invoices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response);
}

export async function deleteInvoice(id) {
  const response = await fetch(`/api/invoices/${id}`, {
    method: "DELETE",
  });
  return readJson(response);
}

export async function getNextInvoiceNumber(issueDate) {
  const response = await fetch(
    `/api/invoices/next-number?issueDate=${encodeURIComponent(issueDate)}`
  );
  const data = await readJson(response);
  return data.invoiceNumber;
}

export async function listClients(search = "", includeArchived = false) {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }
  if (includeArchived) {
    params.set("include_archived", "1");
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`/api/clients${query}`);
  return readJson(response);
}

export async function saveClient(payload) {
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response);
}

export async function updateClient(id, payload) {
  const response = await fetch(`/api/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response);
}

export async function archiveClient(id) {
  const response = await fetch(`/api/clients/${id}/archive`, {
    method: "POST",
  });
  return readJson(response);
}

export async function restoreClient(id) {
  const response = await fetch(`/api/clients/${id}/restore`, {
    method: "POST",
  });
  return readJson(response);
}
