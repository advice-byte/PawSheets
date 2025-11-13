// src/components/pages/CardEmbed.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.js";

export default function CardEmbed({ worksheetId: propWorksheetId }) {
  const [cards, setCards] = useState([]);
  const [styles, setStyles] = useState({});
  const [loading, setLoading] = useState(true);
  const [htmlCode, setHtmlCode] = useState("");
  const [copied, setCopied] = useState(false);

  const worksheetId = propWorksheetId || "84a1e73f-1e0f-4fcd-8b5a-490876586115";

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("worksheets")
        .select("*")
        .eq("id", worksheetId)
        .single();

      if (error || !data) {
        console.error("Error fetching worksheet:", error);
        setLoading(false);
        return;
      }

      const rows = data.rows || [];
      const headerRow = rows[0] || [];
      const validRows = rows.slice(1).filter((r) =>
        r.some((cell) => cell?.value && String(cell.value).trim() !== "")
      );

      const cardData = validRows.map((row) =>
        (data.columns || []).map((col, ci) => ({
          header: headerRow[ci]?.value || `Field ${ci}`,
          value: row[ci]?.value,
        }))
      );

      setCards(cardData);
      setStyles(data.styles || {});
      setLoading(false);

      const html = generateHTML(cardData, data.styles || {});
      setHtmlCode(html);
    };

    fetchCards();
  }, [worksheetId]);

  const generateHTML = (cards, styles) => {
    const layout = styles.layout || "row";
    const cardWidth = styles.cardWidth || 250;
    const cardHeight = styles.cardHeight || 320;
    const gap = styles.gap || 12;

    return `
<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:${gap}px;padding:20px;">
${cards
  .map((cells) => {
    const imageCell = cells[0];
    const textFields = cells.slice(1);

    return `
  <div style="
    background-color:${styles.backgroundColor || "#fff"};
    border:${styles.borderWidth || 1}px solid ${styles.borderColor || "#ddd"};
    border-radius:${styles.borderRadius || 12}px;
    box-shadow:${styles.cardShadow ? "0 4px 12px rgba(0,0,0,0.1)" : "none"};
    width:${cardWidth}px;
    height:${cardHeight}px;
    overflow:hidden;
    display:flex;
    flex-direction:${
      layout === "top-image"
        ? "column"
        : layout === "left-image"
        ? "row"
        : layout === "right-image"
        ? "row-reverse"
        : "column"
    };
    text-align:${styles.textAlign || "left"};
    color:${styles.textColor || "#333"};
    font-family:${styles.fontFamily || "Inter, sans-serif"};
  ">
    ${
      imageCell?.value
        ? `<img src="${imageCell.value}" style="width:${
            layout === "top-image" ? "100%" : styles.imageWidth || "40%"
          };height:${
            layout === "top-image"
              ? styles.imageHeight || "150px"
              : styles.imageHeight || "100%"
          };object-fit:${styles.imageObjectFit || "cover"};"/>`
        : ""
    }
    <div style="padding:${styles.padding || 12}px;display:flex;flex-direction:column;justify-content:center;gap:4px;flex:1;">
      ${textFields
        .map(
          (f) => `
        <div style="font-size:${styles.fontSizePrimary || 14}px;">
          <strong style="font-size:${
            styles.fontSizeSecondary || 13
          }px;">${f.header}:</strong> ${f.value || ""}
        </div>`
        )
        .join("")}
    </div>
  </div>
`;
  })
  .join("")}
</div>`;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="text-center mt-10">Loading cards...</div>;
  if (!cards.length) return <div className="text-center mt-10">No cards available</div>;

  const layout = styles.layout || "row";
  const cardWidth = styles.cardWidth || 250;
  const cardHeight = styles.cardHeight || 320;
  const gap = styles.gap || 12;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ fontSize: "20px", margin: "20px 0" }}>Card Preview</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: `${gap}px`,
          padding: "20px",
        }}
      >
        {cards.map((cells, i) => {
          const imageCell = cells[0];
          const textFields = cells.slice(1);

          return (
            <div
              key={i}
              style={{
                backgroundColor: styles.backgroundColor || "#fff",
                border: `${styles.borderWidth || 1}px solid ${
                  styles.borderColor || "#ddd"
                }`,
                borderRadius: `${styles.borderRadius || 12}px`,
                boxShadow: styles.cardShadow
                  ? "0 4px 12px rgba(0,0,0,0.1)"
                  : "none",
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                overflow: "hidden",
                display: "flex",
                flexDirection:
                  layout === "top-image"
                    ? "column"
                    : layout === "left-image"
                    ? "row"
                    : layout === "right-image"
                    ? "row-reverse"
                    : "column",
                textAlign: styles.textAlign || "left",
                color: styles.textColor || "#333",
                fontFamily: styles.fontFamily || "Inter, sans-serif",
              }}
            >
              {imageCell?.value && (
                <img
                  src={imageCell.value}
                  alt=""
                  style={{
                    width:
                      layout === "top-image" ? "100%" : styles.imageWidth || "40%",
                    height:
                      layout === "top-image"
                        ? styles.imageHeight || "150px"
                        : styles.imageHeight || "100%",
                    objectFit: styles.imageObjectFit || "cover",
                  }}
                />
              )}
              <div
                style={{
                  padding: `${styles.padding || 12}px`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "4px",
                  flex: 1,
                }}
              >
                {textFields.map((f, fi) => (
                  <div
                    key={fi}
                    style={{ fontSize: `${styles.fontSizePrimary || 14}px` }}
                  >
                    <strong
                      style={{
                        fontSize: `${styles.fontSizeSecondary || 13}px`,
                      }}
                    >
                      {f.header}:
                    </strong>{" "}
                    {f.value}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* === HTML Generator Output === */}
      <div style={{ marginTop: "30px", textAlign: "left" }}>
        <h3 style={{ fontSize: "18px" }}>Embed HTML Code:</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={copyToClipboard}
            style={{
              padding: "8px 14px",
              background: copied ? "#4caf50" : "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "background 0.3s ease",
            }}
          >
            {copied ? "Copied!" : "Copy HTML"}
          </button>
          {copied && (
            <span style={{ color: "#4caf50", fontSize: "14px" }}>
              ✅ Code copied to clipboard
            </span>
          )}
        </div>

        <textarea
          readOnly
          value={htmlCode}
          style={{
            width: "100%",
            height: "300px",
            padding: "10px",
            fontFamily: "monospace",
            fontSize: "13px",
            background: "#f9f9f9",
            border: "1px solid #ccc",
            borderRadius: "6px",
            marginTop: "10px",
          }}
        />
      </div>
    </div>
  );
}
