// src/components/CardEditor.jsx
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient.js";
import { FaPalette, FaLayerGroup, FaShapes } from "react-icons/fa"; // icons for Themes/Layout/Colors

export default function CardEditor({ worksheet, onBack, onWorksheetChange }) { // <- added onWorksheetChange
  const [localWorksheet, setLocalWorksheet] = useState(worksheet || null);
  const [styles, setStyles] = useState({
    backgroundColor: "#ffffff",
    textColor: "#000000",
    borderColor: "#cccccc",
    borderWidth: 1,
    fontFamily: "Arial, sans-serif",
    fontSizePrimary: 16,
    fontSizeSecondary: 14,
    fontWeight: 400,
    textAlign: "left",
    cardWidth: 320,
    cardHeight: 400,
    imageWidth: 120,
    imageHeight: 120,
    imageObjectFit: "contain",
    layout: "top-image",
    sizePreset: "medium",
    imageSizePreset: "medium",
    cardShadow: true,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    cardArrangement: "column",
  });

  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("themes"); // themes / layout / colors

  const saveTimeout = useRef(null);

  const presetThemes = [
    { id: "preset-1", name: "Enso Classic", styles: { backgroundColor: "#ffffff", textColor: "#1A1A1A", borderColor: "#D6D6D6", fontFamily: "Inter, sans-serif" } },
    { id: "preset-2", name: "Warm Shelter", styles: { backgroundColor: "#FFF8F2", textColor: "#5A3E36", borderColor: "#E6C7A9", fontFamily: "Georgia, serif" } },
    { id: "preset-3", name: "Modern Rescue", styles: { backgroundColor: "#F4F7FC", textColor: "#22324D", borderColor: "#cccccc", fontFamily: "Arial, sans-serif" } },
    { id: "preset-4", name: "Bold Adoption", styles: { backgroundColor: "#1A1A1A", textColor: "#ffffff", borderColor: "#000000", fontFamily: "Arial, sans-serif" } },
  ];

  useEffect(() => {
    const fetchLatestStyles = async () => {
      if (!worksheet?.id) return;
      try {
        const { data, error } = await supabase
          .from("worksheets")
          .select("styles")
          .eq("id", worksheet.id)
          .single();
        if (error) throw error;
        if (data?.styles) setStyles(data.styles);
      } catch (err) {
        console.error("Error fetching latest styles:", err);
      }
    };
    fetchLatestStyles();
    if (worksheet) setLocalWorksheet(worksheet);
  }, [worksheet]);

  useEffect(() => { fetchThemes(); }, []);

  async function getCurrentUserId() {
    try {
      const res = await supabase.auth.getUser();
      return res?.data?.user?.id ?? null;
    } catch (err) { console.error("Error getting user", err); return null; }
  }

  async function fetchThemes() {
    const userId = await getCurrentUserId();
    if (!userId) { setThemes([]); return; }
    try {
      const { data, error } = await supabase
        .from("themes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setThemes(data || []);
    } catch (err) { console.error("Error loading themes", err); }
  }

  const updateStyle = (newStyles) => {
    const sanitized = { ...newStyles };
    if (sanitized.borderColor === "transparent") sanitized.borderColor = "#cccccc";
    setStyles(sanitized);

    const updatedWorksheet = { ...localWorksheet, styles: sanitized };
    setLocalWorksheet(updatedWorksheet);

    // --- NEW: Notify parent of update for live preview in CardEmbed ---
    if (onWorksheetChange) onWorksheetChange(updatedWorksheet);
  };

  const applyTheme = (theme) => {
    if (!theme?.styles) return;
    const newStyles = { ...styles, ...theme.styles };
    setSelectedThemeId(theme.id);
    updateStyle(newStyles);
  };

  const handleSizePreset = (preset) => {
    const sizes = {
      small: { cardWidth: 240, cardHeight: 300, imageWidth: 80, imageHeight: 80, gap: 6 },
      medium: { cardWidth: 320, cardHeight: 400, imageWidth: 120, imageHeight: 120, gap: 8 },
      large: { cardWidth: 400, cardHeight: 500, imageWidth: 160, imageHeight: 160, gap: 10 },
    };
    updateStyle({ ...styles, ...sizes[preset], sizePreset: preset });
  };

  const handleSave = async () => {
    if (!worksheet?.id) return;
    try {
      const { error } = await supabase
        .from("worksheets")
        .update({ styles })
        .eq("id", worksheet.id);
      if (error) throw error;
      setSaveMessage("Styles saved successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (err) {
      console.error("Error saving styles:", err);
      setSaveMessage("Error saving styles.");
      setTimeout(() => setSaveMessage(""), 2000);
    }
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const sidebarWidth = sidebarOpen ? 300 : 60;

  // --- Card Renderer ---
  const renderCard = () => {
    if (!localWorksheet) return null;
    const allRows = localWorksheet.rows || [];
    if (allRows.length < 2) return <div>No data available for cards</div>;
    const headerRow = allRows[0];
    const dataRows = allRows.slice(1);
    const validRows = dataRows.filter((row) => row.some((cell) => cell?.value && String(cell.value).trim() !== ""));
    if (!validRows.length) return <div>No data available for cards</div>;

    const containerStyle = styles.cardArrangement === "grid"
      ? { display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${styles.cardWidth}px, 1fr))`, gap: styles.gap }
      : { display: "flex", flexDirection: styles.cardArrangement === "row" ? "row" : "column", gap: styles.gap };

    return (
      <div style={containerStyle}>
        {validRows.map((row, rIndex) => {
          const cells = (localWorksheet.columns || []).map((col, ci) => ({
            header: headerRow[ci]?.value || `Field ${ci}`,
            value: row[ci]?.value,
            type: col?.type || "text",
          }));
          const imageCell = cells[0], fields = cells.slice(1);
          const content = (
            <div style={{
              display: "flex",
              flexDirection: styles.layout === "top-image" ? "column" : (styles.layout === "left-image" ? "row" : "row-reverse"),
              gap: styles.gap, alignItems: "flex-start", flexWrap: "wrap"
            }}>
              {imageCell?.value && <img src={imageCell.value} alt="" style={{
                width: styles.layout === "top-image" ? "100%" : styles.imageWidth,
                height: styles.imageHeight,
                objectFit: styles.imageObjectFit,
                borderRadius: styles.borderRadius,
                flex: "0 0 auto"
              }} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {fields.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: styles.fontSizeSecondary }}>{f.header}:</span>
                    <span style={{ fontSize: styles.fontSizePrimary }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );

          const cardStyle = {
            backgroundColor: styles.backgroundColor,
            border: `${styles.borderWidth}px solid ${styles.borderColor}`,
            borderRadius: styles.borderRadius,
            padding: styles.padding,
            boxShadow: styles.cardShadow ? "0 6px 18px rgba(0,0,0,0.08)" : "none",
            width: styles.cardWidth,
            minHeight: styles.cardHeight,
            boxSizing: "border-box",
            overflow: "hidden",
            fontFamily: styles.fontFamily,
            color: styles.textColor,
            textAlign: styles.textAlign,
            transition: "transform 0.15s, box-shadow 0.15s",
          };

          return <div key={rIndex} style={cardStyle} className="card-hover">{content}</div>;
        })}
      </div>
    );
  };

  const ThemePreviewMini = ({ theme }) => {
    const t = theme?.styles || {};
    const previewStyles = {
      backgroundColor: t.backgroundColor || "#fff",
      color: t.textColor || "#000",
      border: `${t.borderWidth || 1}px solid ${t.borderColor || "#ccc"}`,
      borderRadius: t.borderRadius ?? 8,
      boxShadow: t.cardShadow ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
      width: 140,
      padding: 8,
      fontFamily: t.fontFamily || "Arial, sans-serif",
    };
    return (
      <div style={previewStyles}>
        <div style={{ width: "100%", height: 64, backgroundColor: "#f4f4f4", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 48, height: 36, backgroundColor: "#ddd", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.textColor || "#000" }}>{theme.name}</div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>
      {/* --- Sidebar --- */}
      <div style={{
        width: sidebarWidth,
        transition: "width 0.3s",
        overflow: "hidden",
        background: "#f9f9f9",
        borderRight: "1px solid #ececec",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Toggle */}
        <button
          onClick={toggleSidebar}
          style={{
            width: "100%",
            padding: "10px",
            cursor: "pointer",
            background: "#001f3f",
            color: "#FFD700",
            border: "none",
            fontWeight: 700,
          }}
        >
          {sidebarOpen ? "← Collapse" : "→"}
        </button>

        {/* Tabs */}
        <div style={{ display: "flex", flexDirection: sidebarOpen ? "row" : "column", justifyContent: "space-around", margin: 8 }}>
          <button onClick={() => setActiveSection("themes")} style={tabButtonStyle(activeSection === "themes", sidebarOpen)} title="Themes">
            <FaPalette />
            {sidebarOpen && "Themes"}
          </button>
          <button onClick={() => setActiveSection("layout")} style={tabButtonStyle(activeSection === "layout", sidebarOpen)} title="Layout">
            <FaLayerGroup />
            {sidebarOpen && "Layout"}
          </button>
          <button onClick={() => setActiveSection("colors")} style={tabButtonStyle(activeSection === "colors", sidebarOpen)} title="Colors">
            <FaShapes />
            {sidebarOpen && "Colors"}
          </button>
        </div>

        {/* Section Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {/* --- Themes --- */}
          {sidebarOpen && activeSection === "themes" && (
            <div>
              <h4>Themes</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-start" }}>
                {presetThemes.map((t) => (
                  <div key={t.id} onClick={() => applyTheme(t)} style={{ cursor: "pointer" }}>
                    <ThemePreviewMini theme={t} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- Layout --- */}
          {sidebarOpen && activeSection === "layout" && (
            <div>
              <h4>Layout & Arrangement</h4>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["top-image", "left-image", "right-image"].map((opt) => (
                  <div key={opt} onClick={() => updateStyle({ ...styles, layout: opt })} style={sidebarOptionStyle(styles.layout === opt)}>
                    {opt.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["column", "row", "grid"].map((opt) => (
                  <div key={opt} onClick={() => updateStyle({ ...styles, cardArrangement: opt })} style={sidebarOptionStyle(styles.cardArrangement === opt)}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </div>
                ))}
              </div>

              {/* Card Size */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["small", "medium", "large"].map((p) => (
                  <div key={p} onClick={() => handleSizePreset(p)} style={sidebarOptionStyle(styles.sizePreset === p)}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </div>
                ))}
              </div>

              {/* Image Size */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["small", "medium", "large"].map((s) => (
                  <div key={s} onClick={() => updateStyle({
                    ...styles,
                    imageWidth: s === "small" ? 80 : s === "medium" ? 120 : 160,
                    imageHeight: s === "small" ? 80 : s === "medium" ? 120 : 160,
                    imageSizePreset: s
                  })} style={sidebarOptionStyle(styles.imageSizePreset === s)}>
                    Image {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>

              <button onClick={handleSave} style={{ ...buttonStyle, width: "100%", marginTop: 10 }}>
                {saveMessage || "Save Changes"}
              </button>
            </div>
          )}

          {/* --- Colors --- */}
          {sidebarOpen && activeSection === "colors" && (
            <div>
              <h4>Card & Colors</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontWeight: 600 }}>Font Family</label>
                <select value={styles.fontFamily} onChange={(e) => updateStyle({ ...styles, fontFamily: e.target.value })}>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Inter, sans-serif">Inter</option>
                </select>

                <label style={{ fontWeight: 600 }}>Font Size Primary</label>
                <input type="number" value={styles.fontSizePrimary} onChange={(e) => updateStyle({ ...styles, fontSizePrimary: Number(e.target.value) })} />

                <label style={{ fontWeight: 600 }}>Font Size Secondary</label>
                <input type="number" value={styles.fontSizeSecondary} onChange={(e) => updateStyle({ ...styles, fontSizeSecondary: Number(e.target.value) })} />

                <label style={{ fontWeight: 600 }}>Text Color</label>
                <input type="color" value={styles.textColor} onChange={(e) => updateStyle({ ...styles, textColor: e.target.value })} />

                <label style={{ fontWeight: 600 }}>Card Color</label>
                <input type="color" value={styles.backgroundColor} onChange={(e) => updateStyle({ ...styles, backgroundColor: e.target.value })} />

                <label style={{ fontWeight: 600 }}>Border Color</label>
                <input type="color" value={styles.borderColor} onChange={(e) => updateStyle({ ...styles, borderColor: e.target.value })} />

                <label style={{ fontWeight: 600 }}>Border Width</label>
                <input type="number" value={styles.borderWidth} onChange={(e) => updateStyle({ ...styles, borderWidth: Number(e.target.value) })} />

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label style={{ fontWeight: 600 }}>Card Shadow</label>
                  <input type="checkbox" checked={!!styles.cardShadow} onChange={(e) => updateStyle({ ...styles, cardShadow: e.target.checked })} />
                </div>

                <label style={{ fontWeight: 600 }}>Border Radius</label>
                <input type="number" value={styles.borderRadius} onChange={(e) => updateStyle({ ...styles, borderRadius: Number(e.target.value) })} />
              </div>
              <button onClick={handleSave} style={{ ...buttonStyle, width: "100%", marginTop: 12 }}>
                {saveMessage || "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Card Preview Area --- */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, background: "#f4f4f4" }}>
        <button onClick={onBack} style={{ marginBottom: 12 }}>← Back</button>
        {renderCard()}
      </div>
    </div>
  );
}

// --- Helper Styles ---
const sidebarOptionStyle = (selected) => ({
  padding: "6px 12px",
  cursor: "pointer",
  background: selected ? "#001f3f" : "#fff",
  color: selected ? "#FFD700" : "#333",
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: 12,
  textAlign: "center",
});

const buttonStyle = {
  padding: "8px 12px",
  background: "#001f3f",
  color: "#FFD700",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: 600,
};

const tabButtonStyle = (active, sidebarOpen) => ({
  padding: 6,
  cursor: "pointer",
  background: active ? "#001f3f" : "transparent",
  color: active ? "#FFD700" : "#333",
  border: "none",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  gap: sidebarOpen ? 4 : 0,
  fontSize: 14,
});
