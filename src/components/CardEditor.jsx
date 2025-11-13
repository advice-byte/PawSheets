// src/components/CardEditor.jsx
import React, { useEffect, useState, useRef } from "react";
import Toolbar from "./Toolbar";
import { supabase } from "../supabaseClient.js";

export default function CardEditor({ worksheet, onBack }) {
  const [localWorksheet, setLocalWorksheet] = useState(worksheet || null);
  const [styles, setStyles] = useState(worksheet?.styles || {});
  const [activeSection, setActiveSection] = useState("themes");
  const saveTimeout = useRef(null);

  useEffect(() => {
    if (!worksheet?.id) return;
    const fetchLatestStyles = async () => {
      const { data, error } = await supabase
        .from("worksheets")
        .select("styles")
        .eq("id", worksheet.id)
        .single();
      if (!error && data?.styles) setStyles(data.styles);
    };
    fetchLatestStyles();
  }, [worksheet]);

  const updateStyle = (newStyles) => {
    setStyles(newStyles);
    setLocalWorksheet((prev) => ({ ...prev, styles: newStyles }));
  };

  const handleSizePreset = (preset) => {
    const sizes = {
      small: { cardWidth: 240, cardHeight: 300, imageWidth: 80, imageHeight: 80, gap: 6 },
      medium: { cardWidth: 320, cardHeight: 400, imageWidth: 120, imageHeight: 120, gap: 8 },
      large: { cardWidth: 400, cardHeight: 500, imageWidth: 160, imageHeight: 160, gap: 10 },
    };
    updateStyle({ ...styles, ...sizes[preset], sizePreset: preset });
  };

  const renderCard = () => {
    if (!localWorksheet) return null;
    const allRows = localWorksheet.rows || [];
    if (allRows.length < 2) return <div>No data available for cards</div>;
    const headerRow = allRows[0];
    const dataRows = allRows.slice(1);
    const validRows = dataRows.filter((row) => row.some((cell) => cell?.value && String(cell.value).trim() !== ""));
    if (!validRows.length) return <div>No data available for cards</div>;

    const containerStyle =
      styles.cardArrangement === "grid"
        ? { display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${styles.cardWidth}px, 1fr))`, gap: styles.gap }
        : { display: "flex", flexDirection: styles.cardArrangement === "row" ? "row" : "column", gap: styles.gap };

    return (
      <div style={containerStyle}>
        {validRows.map((row, rIndex) => {
          const cells = (localWorksheet.columns || []).map((col, ci) => ({
            header: headerRow[ci]?.value || `Field ${ci}`,
            value: row[ci]?.value,
          }));
          const imageCell = cells[0],
            fields = cells.slice(1);

          return (
            <div
              key={rIndex}
              style={{
                backgroundColor: styles.backgroundColor,
                border: `${styles.borderWidth}px solid ${styles.borderColor}`,
                borderRadius: styles.borderRadius,
                padding: styles.padding,
                boxShadow: styles.cardShadow ? "0 6px 18px rgba(0,0,0,0.08)" : "none",
                width: styles.cardWidth,
                minHeight: styles.cardHeight,
                boxSizing: "border-box",
                overflow: "hidden",
                fontFamily: styles.fontFamilyPrimary,
                color: styles.textColor,
                textAlign: styles.textAlign,
                transition: "transform 0.15s, box-shadow 0.15s",
                display: "flex",
                flexDirection: styles.layout === "top-image" ? "column" : styles.layout === "left-image" ? "row" : "row-reverse",
                gap: styles.gap,
              }}
            >
              {imageCell?.value && (
                <img
                  src={imageCell.value}
                  alt=""
                  style={{
                    width: styles.layout === "top-image" ? "100%" : styles.imageWidth,
                    height: styles.imageHeight,
                    objectFit: styles.imageObjectFit,
                    borderRadius: styles.borderRadius,
                  }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {fields.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 4, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: styles.fontSizeSecondary }}>{f.header}:</span>
                    <span style={{ fontSize: styles.fontSizePrimary }}>{f.value}</span>
                  </div>
                ))}
                {styles.cardButtonText && (
                  <a
                    href={styles.cardButtonURL || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      backgroundColor: "#001f3f",
                      color: "#fff",
                      textDecoration: "none",
                      borderRadius: 4,
                      marginTop: "auto",
                      textAlign: "center",
                      fontSize: 14,
                    }}
                  >
                    {styles.cardButtonText}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getCardHTML = () => {
    if (!localWorksheet) return "";
    const allRows = localWorksheet.rows || [];
    if (allRows.length < 2) return "<div>No data available</div>";
    const headerRow = allRows[0];
    const dataRows = allRows.slice(1);
    const validRows = dataRows.filter((row) => row.some((cell) => cell?.value && String(cell.value).trim() !== ""));
    if (!validRows.length) return "<div>No data available</div>";

    const cardsHTML = validRows
      .map((row) => {
        const cells = (localWorksheet.columns || []).map((col, ci) => ({
          header: headerRow[ci]?.value || `Field ${ci}`,
          value: row[ci]?.value,
        }));
        const imageCell = cells[0],
          fields = cells.slice(1);

        const fieldsHTML = fields
          .map((f) => `<div style="display:flex; gap:4px; flex-wrap:wrap; align-items:baseline;"><span style="font-weight:700; font-size:${styles.fontSizeSecondary}px;">${f.header}:</span><span style="font-size:${styles.fontSizePrimary}px;">${f.value}</span></div>`)
          .join("");

        const buttonHTML = styles.cardButtonText
          ? `<a href="${styles.cardButtonURL || "#"}" style="display:inline-block; padding:6px 12px; background-color:#001f3f; color:#fff; text-decoration:none; border-radius:4px; margin-top:auto; text-align:center; font-size:14px;">${styles.cardButtonText}</a>`
          : "";

        return `<div style="
          background-color:${styles.backgroundColor};
          border:${styles.borderWidth}px solid ${styles.borderColor};
          border-radius:${styles.borderRadius}px;
          padding:${styles.padding}px;
          box-shadow:${styles.cardShadow ? "0 6px 18px rgba(0,0,0,0.08)" : "none"};
          width:${styles.cardWidth}px;
          display:flex;
          flex-direction:${styles.layout === "top-image" ? "column" : styles.layout === "left-image" ? "row" : "row-reverse"};
          gap:${styles.gap}px;
          font-family:${styles.fontFamilyPrimary};
          color:${styles.textColor};
          text-align:${styles.textAlign};
          box-sizing:border-box;
        ">
          ${imageCell?.value ? `<img src="${imageCell.value}" style="width:${styles.layout === "top-image" ? "100%" : styles.imageWidth}px; height:${styles.imageHeight}px; object-fit:${styles.imageObjectFit}; border-radius:${styles.borderRadius}px;">` : ""}
          <div style="display:flex; flex-direction:column; gap:6px; flex:1;">
            ${fieldsHTML}
            ${buttonHTML}
          </div>
        </div>`;
      })
      .join("");

    return `
      <div style="display:flex; flex-wrap:wrap; gap:${styles.gap}px;" class="card-container">
        ${cardsHTML}
      </div>
      <script>
        (function() {
          const cards = document.querySelectorAll('.card-container > div');
          let maxHeight = 0;
          cards.forEach(card => {
            card.style.minHeight = 'auto';
            maxHeight = Math.max(maxHeight, card.offsetHeight);
          });
          cards.forEach(card => {
            card.style.minHeight = maxHeight + 'px';
          });
        })();
      </script>
    `;
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>
      <div style={{ width: 300, background: "#f9f9f9", borderRight: "1px solid #ececec" }}>
        <Toolbar
          sidebarOpen={true}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          styles={styles}
          updateStyle={updateStyle}
          handleSizePreset={handleSizePreset}
          getCardHTML={getCardHTML}
        />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        <button onClick={onBack} style={{ marginBottom: 12 }}>← Back</button>
        {renderCard()}
      </div>
    </div>
  );
}
