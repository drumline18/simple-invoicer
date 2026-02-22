import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import ClientsPage from "./pages/ClientsPage";
import EditInvoicePage from "./pages/EditInvoicePage";
import InvoicesPage from "./pages/InvoicesPage";
import NewInvoicePage from "./pages/NewInvoicePage";
import SettingsPage from "./pages/SettingsPage";

function RouteFrame({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div>
      <header className="app-header">
        <div>
          <h1>Simple Invoicer</h1>
          <p>Local-only invoices in CAD with GST/QST.</p>
        </div>
        <nav>
          <NavLink to="/" end className="nav-link-with-icon">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M8 3a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 8 3Z" />
            </svg>
            <span>New Invoice</span>
          </NavLink>
          <NavLink to="/invoices">Invoices</NavLink>
          <NavLink to="/clients">Clients</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <RouteFrame>
                  <NewInvoicePage />
                </RouteFrame>
              }
            />
            <Route
              path="/invoices/new"
              element={
                <RouteFrame>
                  <NewInvoicePage />
                </RouteFrame>
              }
            />
            <Route
              path="/invoices"
              element={
                <RouteFrame>
                  <InvoicesPage />
                </RouteFrame>
              }
            />
            <Route
              path="/invoices/:id/edit"
              element={
                <RouteFrame>
                  <EditInvoicePage />
                </RouteFrame>
              }
            />
            <Route
              path="/clients"
              element={
                <RouteFrame>
                  <ClientsPage />
                </RouteFrame>
              }
            />
            <Route
              path="/settings"
              element={
                <RouteFrame>
                  <SettingsPage />
                </RouteFrame>
              }
            />
            <Route
              path="*"
              element={
                <RouteFrame>
                  <section className="panel">Page not found.</section>
                </RouteFrame>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
