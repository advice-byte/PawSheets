// src/components/EnhancedSpreadsheet.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

export default function EnhancedSpreadsheet({ worksheet, setWorksheet, user }) {
  const [templateName, setTemplateName] = useState(worksheet?.name || "My Worksheet");

  const [columns, setColumns] = useState(
    Array.isArray(worksheet?.columns) && worksheet.columns.length
      ? worksheet.columns
      : [{ name: "Images", type: "image" }, ...Array(4).fill({ name: "", type: "text" })]
  );

  const [rows, setRows] = useState([]);
  const inputCache = useRef({});

  const createEmptyRows = (numRows = 5, cols = columns) =>
    Array(numRows)
      .fill(0)
      .map(() =>
        cols.map((col) =>
          col.type === "image"
            ? { value: "", type: "image" }
            : { value: "", type: "text" }
        )
      );

  useEffect(() => {
    if (!worksheet) return;

    if (worksheet.rows && worksheet.rows.length) {
      setRows(
        worksheet.rows.map((row) =>
          columns.map((col, ci) =>
            row[ci]
              ? row[ci]
              : col.type === "image"
              ? { value: "", type: "image" }
              : { value: "", type: "text" }
          )
        )
      );
    } else {
      setRows(createEmptyRows());
    }
  }, [worksheet]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setWorksheet({ ...worksheet, columns, rows, name: templateName });
    }, 300);
    return () => clearTimeout(handler);
  }, [rows, columns, templateName]);

  const addRow = () =>
    setRows((prev) => [...prev, columns.map((c) => ({ value: "", type: c.type }))]);

  const addColumn = () => {
    setColumns((prev) => [...prev, { name: "", type: "text" }]);
    setRows((prev) => prev.map((row) => [...row, { value: "", type: "text" }]));
  };

  const deleteRow = (rIndex) => {
    if (rIndex === 0) return alert("The first row is used for field names and cannot be deleted.");
    if (!window.confirm(`Delete row ${rIndex + 1}?`)) return;
    setRows((prev) => prev.filter((_, i) => i !== rIndex));
  };

  const deleteColumn = (cIndex) => {
    if (cIndex === 0) return alert("Column A is reserved for images and cannot be deleted.");
    if (!window.confirm(`Delete column ${columnToLetter(cIndex)}?`)) return;
    setColumns((prev) => prev.filter((_, i) => i !== cIndex));
    setRows((prev) => prev.map((row) => row.filter((_, i) => i !== cIndex)));
  };

  const columnToLetter = (num) => {
    let letter = "";
    while (num >= 0) {
      letter = String.fromCharCode((num % 26) + 65) + letter;
      num = Math.floor(num / 26) - 1;
    }
    return letter;
  };

  const handleImageUpload = async (r, c, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);

    setRows((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) =>
          ri === r && ci === c ? { ...cell, value: previewUrl, type: "image" } : cell
        )
      )
    );

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${user?.id || "public"}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) return alert("Image upload failed: " + uploadError.message);

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    setRows((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) =>
          ri === r && ci === c ? { ...cell, value: publicUrl, type: "image" } : cell
        )
      )
    );
  };

  const saveWorksheet = async () => {
    const { error } = await supabase.from("worksheets").upsert({
      id: worksheet?.id || undefined,
      name: templateName,
      columns,
      rows,
      user_id: user?.id,
    });

    if (error) alert("Error saving worksheet: " + error.message);
    else alert("Worksheet saved successfully!");
  };

  const newWorksheet = () => {
    if (!window.confirm("Create a new worksheet? Unsaved changes will be lost.")) return;
    setRows(createEmptyRows());
    setColumns([{ name: "Images", type: "image" }, ...Array(4).fill({ name: "", type: "text" })]);
    setTemplateName("New Worksheet");
  };

  const Cell = ({ r, c, cell }) => {
    if (c === 0) {
      return (
        <td style={{ ...cellStyle, position: "relative" }}>
          {cell.value && (
            <div style={{ position: "relative" }}>
              <img
                src={cell.value}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 120,
                  objectFit: "contain",
                  display: "block",
                  margin: "auto",
                  borderRadius: 4,
                }}
              />
              {r > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Delete this image?")) {
                      setRows((prevRows) =>
                        prevRows.map((row, ri) =>
                          row.map((cCell, ci) =>
                            ri === r && ci === 0 ? { ...cCell, value: "" } : cCell
                          )
                        )
                      );
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    cursor: "pointer",
                    fontWeight: "bold",
                    lineHeight: 1,
                    textAlign: "center",
                    padding: 0,
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  className="delete-image-btn"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {r > 0 && !cell.value && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(r, c, e.target.files[0])}
              style={{ width: "100%", marginTop: 4 }}
            />
          )}

          <style>{`td:hover .delete-image-btn { opacity: 1; }`}</style>
        </td>
      );
    }

    return (
      <td style={cellStyle}>
        <input
          type="text"
          value={inputCache.current[`${r}-${c}`] ?? cell.value}
          onChange={(e) => {
            const val = e.target.value;
            inputCache.current[`${r}-${c}`] = val;
            setRows((prev) =>
              prev.map((row, ri) =>
                row.map((cCell, ci) =>
                  ri === r && ci === c ? { ...cCell, value: val } : cCell
                )
              )
            );
          }}
          style={{
            width: "100%",
            border: "none",
            padding: 4,
            fontSize: 14,
            boxSizing: "border-box",
            fontWeight: r === 0 ? "bold" : "normal",
          }}
        />
      </td>
    );
  };

  const cellStyle = {
    border: "1px solid #ccc",
    minWidth: 100,
    padding: 0,
  };

  const rowNumberStyle = {
    border: "1px solid #001f3f",
    textAlign: "center",
    backgroundColor: "#eee",
    fontWeight: "bold",
    fontSize: 12,
    width: 90,
  };

  const buttonStyle = {
    background: "#001f3f",
    color: "#FFD700",
    border: "none",
    padding: "6px 12px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 15,
        padding: 15,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontWeight: "bold" }}>Template Name:</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{
              padding: "6px 10px",
              fontSize: 14,
              borderRadius: 6,
              border: "1px solid #ccc",
              minWidth: 200,
              maxWidth: "100%",
            }}
          />

          <button onClick={saveWorksheet} style={buttonStyle}>Save</button>
          <button onClick={newWorksheet} style={buttonStyle}>New Worksheet</button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={addRow} style={buttonStyle}>Add Row</button>
          <button onClick={addColumn} style={buttonStyle}>Add Column</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowX: "auto", width: "100%" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: 90, border: "1px solid #001f3f", backgroundColor: "#eee" }}></th>
              {columns.map((col, c) => (
                <th
                  key={c}
                  onClick={() => deleteColumn(c)}
                  style={{
                    border: "1px solid #001f3f",
                    backgroundColor: "#001f3f",
                    color: "#FFD700",
                    textAlign: "center",
                    padding: 6,
                    cursor: c === 0 ? "default" : "pointer",
                  }}
                  title={c === 0 ? "Image column cannot be deleted" : "Click to delete column"}
                >
                  {c === 0 ? "Images" : columnToLetter(c)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <td
                  style={rowNumberStyle}
                  onClick={() => deleteRow(r)}
                  title={r === 0 ? "" : "Click to delete row"}
                >
                  {r === 0 ? "Field Data" : r + 1}
                </td>

                {row.map((cell, c) => (
                  <Cell key={`cell-${r}-${c}`} r={r} c={c} cell={cell} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
