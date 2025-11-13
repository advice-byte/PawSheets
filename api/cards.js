// pages/api/cards.js
import { supabase } from "../../supabaseClient.js";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Worksheet ID is required");

  try {
    // Fetch worksheet rows and styles
    const { data, error } = await supabase
      .from("worksheets")
      .select("rows, styles")
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).send("Worksheet not found");

    const rows = data.rows || [];
    const styles = data.styles || {};

    if (rows.length < 2) {
      res.setHeader("Content-Type", "text/html");
      return res.send("<div>No data available for cards</div>");
    }

    const headerRow = rows[0];
    const dataRows = rows.slice(1).filter(r => r.some(c => c?.value && String(c.value).trim() !== ""));

    // Generate HTML for each card
    const cardsHTML = dataRows.map(row => {
      const cells = row.map((cell, ci) => ({
        header: headerRow[ci]?.value || `Field ${ci}`,
        value: cell?.value || ""
      }));
      const imageCell = cells[0];
      const fields = cells.slice(1);

      const fieldsHTML = fields.map(f => `
        <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:baseline;">
          <span style="font-weight:700; font-size:${styles.fontSizeSecondary}px;">${f.header}:</span>
          <span style="font-size:${styles.fontSizePrimary}px;">${f.value}</span>
        </div>
      `).join("");

      const imageHTML = imageCell?.value ? `<img src="${imageCell.value}" style="width:${styles.layout === "top-image" ? "100%" : styles.imageWidth}px; height:${styles.imageHeight}px; object-fit:${styles.imageObjectFit}; border-radius:${styles.borderRadius}px; flex:0 0 auto;" />` : "";

      return `
        <div style="
          background-color:${styles.backgroundColor};
          border:${styles.borderWidth}px solid ${styles.borderColor};
          border-radius:${styles.borderRadius}px;
          padding:${styles.padding}px;
          box-shadow:${styles.cardShadow ? "0 6px 18px rgba(0,0,0,0.08)" : "none"};
          width:${styles.cardWidth}px;
          min-height:${styles.cardHeight}px;
          box-sizing:border-box;
          overflow:hidden;
          font-family:${styles.fontFamily};
          color:${styles.textColor};
          text-align:${styles.textAlign};
          display:flex;
          flex-direction:${styles.layout === "top-image" ? "column" : (styles.layout === "left-image" ? "row" : "row-reverse")};
          gap:${styles.gap}px;
          align-items:flex-start;
          flex-wrap:wrap;
        ">
          ${imageHTML}
          <div style="display:flex; flex-direction:column; gap:6px; flex:1;">
            ${fieldsHTML}
          </div>
        </div>
      `;
    }).join("");

    // Wrap all cards in a container
    const html = `<div style="display:${styles.cardArrangement === "grid" ? "grid" : "flex"}; flex-direction:${styles.cardArrangement === "row" ? "row" : "column"}; gap:${styles.gap}px; grid-template-columns:${styles.cardArrangement === "grid" ? `repeat(auto-fill, minmax(${styles.cardWidth}px, 1fr))` : "none"};">
      ${cardsHTML}
    </div>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}
