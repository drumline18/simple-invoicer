import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../lib/api";

const INITIAL_SETTINGS = {
  business_name: "",
  business_email: "",
  business_phone: "",
  business_address: "",
  gst_number: "",
  qst_number: "",
  default_terms: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [notice, setNotice] = useState("Loading settings...");

  useEffect(() => {
    async function load() {
      try {
        const loaded = await getSettings();
        setSettings((prev) => ({ ...prev, ...loaded }));
        setNotice("Ready.");
      } catch (error) {
        setNotice(error.message);
      }
    }
    load();
  }, []);

  function updateField(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const saved = await saveSettings(settings);
      setSettings((prev) => ({ ...prev, ...saved }));
      setNotice("Settings saved.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <section className="panel settings-panel">
      <h2>Business settings</h2>
      <form onSubmit={onSubmit}>
        <label>
          Business name
          <input
            type="text"
            value={settings.business_name}
            onChange={(event) => updateField("business_name", event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={settings.business_email}
            onChange={(event) => updateField("business_email", event.target.value)}
          />
        </label>
        <label>
          Phone
          <input
            type="text"
            value={settings.business_phone}
            onChange={(event) => updateField("business_phone", event.target.value)}
          />
        </label>
        <label>
          Address
          <textarea
            rows="3"
            value={settings.business_address}
            onChange={(event) => updateField("business_address", event.target.value)}
          />
        </label>
        <div className="form-grid two">
          <label>
            GST number
            <input
              type="text"
              value={settings.gst_number}
              onChange={(event) => updateField("gst_number", event.target.value)}
            />
          </label>
          <label>
            QST number
            <input
              type="text"
              value={settings.qst_number}
              onChange={(event) => updateField("qst_number", event.target.value)}
            />
          </label>
        </div>
        <label>
          Default terms
          <textarea
            rows="3"
            value={settings.default_terms}
            onChange={(event) => updateField("default_terms", event.target.value)}
          />
        </label>
        <button type="submit" className="primary">Save Settings</button>
      </form>
      <p className="notice">{notice}</p>
    </section>
  );
}
