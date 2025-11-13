// src/components/Toolbar.jsx
import React, { useState } from "react";
import { FaLayerGroup, FaPalette, FaMousePointer, FaCode } from "react-icons/fa";

export default function Toolbar({
  sidebarOpen,
  activeSection,
  setActiveSection,
  styles,
  updateStyle,
  handleSizePreset,
  getCardHTML,
}) {
  const [htmlCode, setHtmlCode] = useState("");

  const sidebarOptionStyle = (active) => ({
    padding: 6,
    cursor: "pointer",
    borderRadius: 4,
    background: active ? "#001f3f" : "#f4f4f4",
    color: active ? "#fff" : "#000",
    textAlign: "center",
    fontSize: 12,
  });

  const buttonStyle = {
    padding: "8px 12px",
    backgroundColor: "#001f3f",
    color: "#FFD700",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    borderRadius: 4,
    marginTop: 10,
    width: "100%",
  };

  // Tabs with icons
  const tabs = [
    { id: "layout", icon: <FaLayerGroup />, title: "Layout" },
    { id: "colors", icon: <FaPalette />, title: "Colours" },
    { id: "button", icon: <FaMousePointer />, title: "Button" },
    { id: "html", icon: <FaCode />, title: "HTML" },
  ];

  const tabButtonStyle = (active) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 12,
    cursor: "pointer",
    background: active ? "#001f3f" : "#f4f4f4",
    color: active ? "#FFD700" : "#000",
    border: "none",
    borderRadius: 4,
    fontWeight: 600,
  });

  const handleCopy = async () => {
    if (typeof getCardHTML !== "function") return;
    const html = getCardHTML() || "";
    setHtmlCode(html);

    try {
      await navigator.clipboard.writeText(html);
      alert("HTML copied to clipboard.");
    } catch (err) {
      console.warn("Copy to clipboard failed:", err);
      alert("HTML copied to textarea (manual copy may be required).");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* --- Tabs Grid 2x2 --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          padding: 8,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            style={tabButtonStyle(activeSection === tab.id)}
            title={tab.title}
          >
            {tab.icon}
            <span style={{ fontSize: 10 }}>{tab.title}</span>
          </button>
        ))}
      </div>

      {/* --- Section Content --- */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {/* Layout */}
        {activeSection === "layout" && (
          <div>
            <h4>Layout & Arrangement</h4>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["top-image", "left-image", "right-image"].map((opt) => (
                <div
                  key={opt}
                  onClick={() => updateStyle({ ...styles, layout: opt })}
                  style={sidebarOptionStyle(styles.layout === opt)}
                >
                  {opt.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["column", "row", "grid"].map((opt) => (
                <div
                  key={opt}
                  onClick={() => updateStyle({ ...styles, cardArrangement: opt })}
                  style={sidebarOptionStyle(styles.cardArrangement === opt)}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["small", "medium", "large"].map((p) => (
                <div
                  key={p}
                  onClick={() => handleSizePreset(p)}
                  style={sidebarOptionStyle(styles.sizePreset === p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Colours */}
        {activeSection === "colors" && (
          <div>
            <h4>Card & Colours</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>Font Family Primary</label>
              <select
                value={styles.fontFamilyPrimary}
                onChange={(e) => updateStyle({ ...styles, fontFamilyPrimary: e.target.value })}
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Inter, sans-serif">Inter</option>
              </select>

              <label>Font Family Secondary</label>
              <select
                value={styles.fontFamilySecondary}
                onChange={(e) => updateStyle({ ...styles, fontFamilySecondary: e.target.value })}
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Inter, sans-serif">Inter</option>
              </select>

              <label>Font Size Primary</label>
              <input
                type="number"
                value={styles.fontSizePrimary}
                onChange={(e) => updateStyle({ ...styles, fontSizePrimary: parseInt(e.target.value) })}
              />

              <label>Font Size Secondary</label>
              <input
                type="number"
                value={styles.fontSizeSecondary}
                onChange={(e) => updateStyle({ ...styles, fontSizeSecondary: parseInt(e.target.value) })}
              />

              <label>Text Color</label>
              <input
                type="color"
                value={styles.textColor}
                onChange={(e) => updateStyle({ ...styles, textColor: e.target.value })}
              />

              <label>Background Color</label>
              <input
                type="color"
                value={styles.backgroundColor}
                onChange={(e) => updateStyle({ ...styles, backgroundColor: e.target.value })}
              />

              <label>Border Color</label>
              <input
                type="color"
                value={styles.borderColor}
                onChange={(e) => updateStyle({ ...styles, borderColor: e.target.value })}
              />

              <label>Border Radius</label>
              <input
                type="range"
                min={0}
                max={50}
                value={styles.borderRadius}
                onChange={(e) => updateStyle({ ...styles, borderRadius: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}

        {/* Button */}
        {activeSection === "button" && (
          <div>
            <h4>Card Button</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>Button Text</label>
              <input
                type="text"
                value={styles.cardButtonText}
                onChange={(e) => updateStyle({ ...styles, cardButtonText: e.target.value })}
              />

              <label>Button URL</label>
              <input
                type="text"
                value={styles.cardButtonURL}
                onChange={(e) => updateStyle({ ...styles, cardButtonURL: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* HTML */}
        {activeSection === "html" && (
          <div>
            <h4>Card HTML Embed</h4>
            <textarea
              readOnly
              value={htmlCode || (getCardHTML ? getCardHTML() : "")}
              style={{ width: "100%", height: 300 }}
            />
            <button onClick={handleCopy} style={buttonStyle}>
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
