import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getSettings, saveSettings } from "../lib/api";

const TAX_PRESETS = {
  AB: {
    tax_1_label: "GST",
    tax_1_rate: 5,
    tax_2_label: "",
    tax_2_rate: 0,
  },
  BC: {
    tax_1_label: "GST",
    tax_1_rate: 5,
    tax_2_label: "PST",
    tax_2_rate: 7,
  },
  MB: {
    tax_1_label: "GST",
    tax_1_rate: 5,
    tax_2_label: "RST",
    tax_2_rate: 7,
  },
  NB: {
    tax_1_label: "HST",
    tax_1_rate: 15,
    tax_2_label: "",
    tax_2_rate: 0,
  },
  NL: {
    tax_1_label: "HST",
    tax_1_rate: 15,
    tax_2_label: "",
    tax_2_rate: 0,
  },
  NS: {
    tax_1_label: "HST",
    tax_1_rate: 15,
    tax_2_label: "",
    tax_2_rate: 0,
  },
  ON: {
    tax_1_label: "HST",
    tax_1_rate: 13,
    tax_2_label: "",
    tax_2_rate: 0,
  },
  PE: {
    tax_1_label: "HST",
    tax_1_rate: 15,
    tax_2_label: "",
    tax_2_rate: 0,
  },
  QC: {
    tax_1_label: "GST",
    tax_1_rate: 5,
    tax_2_label: "QST",
    tax_2_rate: 9.975,
  },
  SK: {
    tax_1_label: "GST",
    tax_1_rate: 5,
    tax_2_label: "PST",
    tax_2_rate: 6,
  },
};

const INITIAL_SETTINGS = {
  business_name: "",
  business_email: "",
  business_phone: "",
  business_address: "",
  timezone: "America/Toronto",
  gst_number: "",
  qst_number: "",
  tax_1_label: "GST",
  tax_1_rate: 5,
  tax_1_number: "",
  tax_2_label: "QST",
  tax_2_rate: 9.975,
  tax_2_number: "",
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

  function applyTaxPreset(code) {
    const preset = TAX_PRESETS[code];
    if (!preset) {
      return;
    }
    setSettings((prev) => ({
      ...prev,
      tax_1_label: preset.tax_1_label,
      tax_1_rate: preset.tax_1_rate,
      tax_2_label: preset.tax_2_label,
      tax_2_rate: preset.tax_2_rate,
    }));
    setNotice(`Applied ${code} tax preset. You can still edit manually.`);
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
        <label>
          Business timezone
          <select
            value={settings.timezone || "America/Toronto"}
            onChange={(event) => updateField("timezone", event.target.value)}
          >
            <option value="America/St_Johns">Newfoundland (America/St_Johns)</option>
            <option value="America/Halifax">Atlantic (America/Halifax)</option>
            <option value="America/Toronto">Eastern (America/Toronto)</option>
            <option value="America/Winnipeg">Central (America/Winnipeg)</option>
            <option value="America/Edmonton">Mountain (America/Edmonton)</option>
            <option value="America/Vancouver">Pacific (America/Vancouver)</option>
            <option value="America/Whitehorse">Yukon (America/Whitehorse)</option>
            <option value="America/Yellowknife">Northwest Territories (America/Yellowknife)</option>
            <option value="America/Iqaluit">Nunavut (America/Iqaluit)</option>
          </select>
        </label>
        <fieldset className="form-section">
          <legend>Tax settings</legend>
          <label>
            Province preset
            <select defaultValue="" onChange={(event) => applyTaxPreset(event.target.value)}>
              <option value="" disabled>Select province preset</option>
              <option value="AB">Alberta</option>
              <option value="BC">British Columbia</option>
              <option value="MB">Manitoba</option>
              <option value="NB">New Brunswick</option>
              <option value="NL">Newfoundland and Labrador</option>
              <option value="NS">Nova Scotia</option>
              <option value="ON">Ontario</option>
              <option value="PE">Prince Edward Island</option>
              <option value="QC">Quebec</option>
              <option value="SK">Saskatchewan</option>
            </select>
          </label>

          <div className="form-grid two">
            <label>
              Tax 1 label
              <input
                type="text"
                value={settings.tax_1_label}
                onChange={(event) => updateField("tax_1_label", event.target.value)}
              />
            </label>
            <label>
              Tax 1 rate (%)
              <input
                type="number"
                min="0"
                step="0.001"
                value={settings.tax_1_rate}
                onChange={(event) => updateField("tax_1_rate", event.target.value)}
              />
            </label>
          </div>

          <label>
            Tax 1 registration number
            <input
              type="text"
              value={settings.tax_1_number}
              onChange={(event) => updateField("tax_1_number", event.target.value)}
            />
          </label>

          <div className="form-grid two">
            <label>
              Tax 2 label
              <input
                type="text"
                value={settings.tax_2_label}
                onChange={(event) => updateField("tax_2_label", event.target.value)}
              />
            </label>
            <label>
              Tax 2 rate (%)
              <input
                type="number"
                min="0"
                step="0.001"
                value={settings.tax_2_rate}
                onChange={(event) => updateField("tax_2_rate", event.target.value)}
              />
            </label>
          </div>

          <label>
            Tax 2 registration number
            <input
              type="text"
              value={settings.tax_2_number}
              onChange={(event) => updateField("tax_2_number", event.target.value)}
            />
          </label>
        </fieldset>
        <label>
          Default terms
          <textarea
            rows="3"
            value={settings.default_terms}
            onChange={(event) => updateField("default_terms", event.target.value)}
          />
        </label>
        <button type="submit" className="primary with-icon">
          <Save size={16} aria-hidden="true" />
          Save Settings
        </button>
      </form>
      <p className="notice">{notice}</p>
    </section>
  );
}
