// src/components/EnhancedSpreadsheet.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import CellInput from "./CellInput.jsx";
import "./EnhancedSpreadsheet.css";

export default function EnhancedSpreadsheet({ worksheet, setWorksheet, user }) {
  const [templateName, setTemplateName] = useState(worksheet?.name || "My Worksheet");
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize worksheet locally (once)
  useEffect(() => {
    if (!worksheet || initialized) return;

    setTemplateName(worksheet.name || "My Worksheet");

    const wsColumns =
      Array.isArray(worksheet.columns) && worksheet.columns.length
        ? worksheet.columns
        : [{ name: "Images", type: "image" }, ...Array(4).fill({ name: "", type: "text" })];

    const wsRows =
      worksheet.rows && worksheet.rows.length
        ? worksheet.rows.map((row) =>
            wsColumns.map((col, ci) =>
              row[ci] ? row[ci] : col.type === "image" ? { value: "", type: "image" } : { value: "", type: "text" }
            )
          )
        : Array(5)
            .fill(null)
            .map(() =>
              wsColumns.map((c) => (c.type === "image" ? { value: "", type: "image" } : { value: "", type: "text" } ))
            );

    setColumns(wsColumns);
    setRows(wsRows);
    setInitialized(true);
  }, [worksheet, initialized]);

  const createEmptyRow = () =>
    columns.map((c) => (c.type === "image" ? { value: "", type: "image" } : { value: "", type: "text" }));

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

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
        row.map((cell, ci) => (ri === r && ci === c ? { ...cell, value: previewUrl, type: "image" } : cell))
      )
    );

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${user?.id || "public"}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);
    if (uploadError) return alert("Image upload failed: " + uploadError.message);

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    setRows((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? { ...cell, value: publicUrl, type: "image" } : cell))
      )
    );
  };

  const saveWorksheet = async () => {
    if (!worksheet) return;
    const { error } = await supabase.from("worksheets").upsert({
      id: worksheet.id,
      name: templateName,
      columns,
      rows,
      user_id: user?.id,
    });
    if (error) alert("Error saving worksheet: " + error.message);
    else {
      alert("Worksheet saved successfully!");
      if (setWorksheet) setWorksheet({ ...worksheet, columns, rows, name: templateName });
    }
  };

  const newWorksheet = () => {
    if (!window.confirm("Create a new worksheet? Unsaved changes will be lost.")) return;
    const emptyColumns = [{ name: "Images", type: "image" }, ...Array(4).fill({ name: "", type: "text" })];
    setColumns(emptyColumns);
    setRows(
      Array(5)
        .fill(null)
        .map(() =>
          emptyColumns.map((c) => (c.type === "image" ? { value: "", type: "image" } : { value: "", type: "text" }))
        )
    );
    setTemplateName("New Worksheet");
  };

  const Cell = ({ r, c, cell }) => {
    if (c === 0) {
      return (
        <td className="cell">
          {cell.value && <img className="image-preview" src={cell.value} alt="" />}
          {r > 0 && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(r, c, e.target.files[0])}
            />
          )}
        </td>
      );
    }

    return (
      <td className={`cell ${r === 0 ? "field-data-placeholder" : ""}`}>
        <CellInput
          value={cell.value}
          onChange={(val) => {
            const newRows = [...rows];
            newRows[r][c] = { ...newRows[r][c], value: val };
            setRows(newRows);
          }}
          placeholder={r === 0 ? "Field Data" : ""}
        />
      </td>
    );
  };

  return (
    <div className="worksheet-container">
      <div className="toolbar">
        <div className="toolbar-left">
          <label>Template Name:</label>
          <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
          <button onClick={saveWorksheet}>Save</button>
          <button onClick={newWorksheet}>New Worksheet</button>
        </div>
        <div className="toolbar-right">
          <button onClick={addRow}>Add Row</button>
          <button onClick={addColumn}>Add Column</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowX: "auto", width: "100%" }}>
        <table className="worksheet-table">
          <thead>
            <tr>
              <th style={{ width: 90, backgroundColor: "#eee" }}></th>
              {columns.map((col, c) => (
                <th
                  key={c}
                  onClick={() => deleteColumn(c)}
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
                <td className="row-number" onClick={() => deleteRow(r)} title={r === 0 ? "" : "Click to delete row"}>
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
