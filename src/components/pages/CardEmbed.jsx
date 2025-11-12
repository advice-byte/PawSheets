// src/components/pages/CardEmbed.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.js";

export default function CardEmbed({ worksheetId, worksheet: passedWorksheet }) {
  const [worksheet, setWorksheet] = useState(passedWorksheet || null);
  const [styles, setStyles] = useState(null);
  const [htmlCode, setHtmlCode] = useState("");
  const [iframeCode, setIframeCode] = useState("");

  // ✅ Load worksheet from Supabase if not passed directly
  useEffect(() => {
    const id = worksheetId || passedWorksheet?.id;
    if (!id) return;

    const fetchWorksheet = async () => {
      const { data, error } = await supabase
        .from("worksheets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching worksheet:", error);
      } else if (data) {
        setWorksheet(data);
        setStyles(data.styles || {});
      }
    };

    if (!passedWorksheet) fetchWorksheet();
    else {
      setWorksheet(passedWorksheet);
      setStyles(passedWorksheet.styles || {});
    }

    // ✅ Subscribe to live updates from Supabase
    const channel = supabase
      .channel(`realtime:worksheet:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "worksheets",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log("🔄 Worksheet updated:", payload.new);
          setWorksheet(payload.new);
          setStyles(payload.new.styles || {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [worksheetId, passedWorksheet]);

  // ✅ Generate HTML + iframe code whenever worksheet or styles change
  useEffect(() => {
    if (!worksheet || !worksheet.rows || !styles) return;

    const validRows = (worksheet.rows || [])
      .slice(1)
      .filter((row) => row.some((cell) => cell?.value && String(cell.value).trim() !== ""));

    const html = `
<div style="
  display: ${styles.cardArrangement === "grid" ? "grid" : "flex"};
  ${
    styles.cardArrangement === "grid"
      ? `grid-template-columns: repeat(auto-fill, minmax(${styles.cardWidth}px, 1fr)); gap: ${styles.gap}px;`
      : `flex-direction: ${styles.cardArrangement === "row" ? "row" : "column"}; gap: ${styles.gap}px;`
  }
">
  ${validRows
    .map((row) => {
      const cells = (worksheet.columns || []).map((col, ci) => ({
        header: worksheet.rows[0][ci]?.value || `Field ${ci}`,
        value: row[ci]?.value,
        type: col?.type || "text",
      }));
      const imageCell = cells[0];
      const fields = cells.slice(1);

      return `
    <div style="
      background-color: ${styles.backgroundColor};
      border: ${styles.borderWidth}px solid ${styles.borderColor};
      border-radius: ${styles.borderRadius}px;
      padding: ${styles.padding}px;
      box-shadow: ${styles.cardShadow ? "0 6px 18px rgba(0,0,0,0.08)" : "none"};
      width: ${styles.cardWidth}px;
      min-height: ${styles.cardHeight}px;
      font-family: ${styles.fontFamily};
      color: ${styles.textColor};
      text-align: ${styles.textAlign};
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      flex-direction: ${
        styles.layout === "top-image"
          ? "column"
          : styles.layout === "left-image"
          ? "row"
          : "row-reverse"
      };
      gap: ${styles.gap}px;
      align-items: flex-start;
      flex-wrap: wrap;
    ">
      ${
        imageCell?.value
          ? `<img src="${imageCell.value}" style="width: ${
              styles.layout === "top-image" ? "100%" : styles.imageWidth
            }px; height: ${styles.imageHeight}px; object-fit: ${
              styles.imageObjectFit
            }; border-radius: ${styles.borderRadius}px;" />`
          : ""
      }
      <div style="display:flex; flex-direction: column; gap:6px; flex:1;">
        ${fields
          .map(
            (f) =>
              `<div style="display:flex; gap:4px; flex-wrap:wrap; align-items:baseline;">
                <span style="font-weight:700; font-size:${styles.fontSizeSecondary}px;">${f.header}:</span>
                <span style="font-size:${styles.fontSizePrimary}px;">${f.value}</span>
              </div>`
          )
          .join("")}
      </div>
    </div>`;
    })
    .join("")}
</div>`.trim();

    const iframe = `<iframe src="${window.location.origin}/embed/${worksheet.id}" style="border:none;width:100%;height:500px;"></iframe>`;

    setHtmlCode(html);
    setIframeCode(iframe);
  }, [worksheet, styles]);

  if (!worksheet || !styles) return <div>Loading...</div>;

  // ✅ Card preview renderer
  const renderCard = () => {
    const validRows = (worksheet.rows || [])
      .slice(1)
      .filter((row) => row.some((cell) => cell?.value && String(cell.value).trim() !== ""));
    if (!validRows.length) return <div>No data available for cards</div>;
    const headerRow = worksheet.rows[0];

    const gridStyle =
      styles.cardArrangement === "grid"
        ? {
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${styles.cardWidth}px, 1fr))`,
            gap: styles.gap,
          }
        : {
            display: "flex",
            flexDirection: styles.cardArrangement === "row" ? "row" : "column",
            gap: styles.gap,
          };

    return (
      <div style={gridStyle}>
        {validRows.map((row, rIndex) => {
          const cells = (worksheet.columns || []).map((col, ci) => ({
            header: headerRow[ci]?.value || `Field ${ci}`,
            value: row[ci]?.value,
            type: col?.type || "text",
          }));

          const imageCell = cells[0];
          const fields = cells.slice(1);

          const content = (
            <div
              style={{
                display: "flex",
                flexDirection:
                  styles.layout === "top-image"
                    ? "column"
                    : styles.layout === "left-image"
                    ? "row"
                    : "row-reverse",
                gap: styles.gap,
                alignItems: "flex-start",
                flexWrap: "wrap",
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
                    flex: "0 0 auto",
                  }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {fields.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: styles.fontSizeSecondary }}>
                      {f.header}:
                    </span>
                    <span style={{ fontSize: styles.fontSizePrimary }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );

          const containerStyle = {
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
          };

          return (
            <div key={rIndex} style={containerStyle}>
              {content}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3>Live Preview:</h3>
        {renderCard()}
      </div>

      <div>
        <h3>Embed HTML:</h3>
        <textarea
          readOnly
          value={htmlCode}
          style={{
            width: "100%",
            height: 300,
            background: "#f5f5f5",
            borderRadius: 10,
            border: "1px solid #ccc",
            padding: 10,
            fontFamily: "monospace",
            fontSize: 13,
          }}
          onClick={(e) => e.target.select()}
        />
      </div>

      <div>
        <h3>Embed IFrame:</h3>
        <textarea
          readOnly
          value={iframeCode}
          style={{
            width: "100%",
            height: 60,
            background: "#f5f5f5",
            borderRadius: 10,
            border: "1px solid #ccc",
            padding: 10,
            fontFamily: "monospace",
            fontSize: 13,
          }}
          onClick={(e) => e.target.select()}
        />
      </div>
    </div>
  );
}
