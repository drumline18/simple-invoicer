import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CirclePlus, FileText, Moon, Settings, Sun, Users } from "lucide-react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import ClientsPage from "./pages/ClientsPage";
import EditInvoicePage from "./pages/EditInvoicePage";
import InvoicesPage from "./pages/InvoicesPage";
import NewInvoicePage from "./pages/NewInvoicePage";
import SettingsPage from "./pages/SettingsPage";

const THEME_KEY = "simple-invoicer-theme";

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
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
      }
    } catch {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage failures
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <div>
      <header className="app-header">
        <div className="brand-block">
          <Link to="/" className="brand-link" aria-label="Simple Invoicer home">
            <span className="sr-only">Simple Invoicer</span>
            <img
              className="brand-image"
              src="/brand/SimpleInvoicer.svg"
              alt="Simple Invoicer"
            />
          </Link>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="with-icon theme-toggle-compact"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          </button>
          <nav>
            <NavLink to="/" end className="with-icon">
              <CirclePlus size={16} aria-hidden="true" />
              <span>New Invoice</span>
            </NavLink>
            <NavLink to="/invoices" className="with-icon">
              <FileText size={16} aria-hidden="true" />
              <span>Invoices</span>
            </NavLink>
            <NavLink to="/clients" className="with-icon">
              <Users size={16} aria-hidden="true" />
              <span>Clients</span>
            </NavLink>
            <NavLink to="/settings" className="with-icon">
              <Settings size={16} aria-hidden="true" />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
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
