// src/components/SavedTemplates.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function SavedTemplates({ onLoadTemplate, onDeleteTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("worksheets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const loadTemplate = (template) => {
    if (window.confirm(`Load template "${template.name}"? This will replace your current sheet.`)) {
      onLoadTemplate(template);
    }
  };

  const deleteTemplate = async (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"? This cannot be undone.`)) return;

    const { error } = await supabase
      .from("worksheets")
      .delete()
      .eq("id", template.id);

    if (error) {
      alert("Failed to delete template: " + error.message);
    } else {
      alert(`Template "${template.name}" deleted successfully.`);
      if (onDeleteTemplate) onDeleteTemplate(template.id);
      fetchTemplates(); // refresh the list after deletion
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", padding: 20, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <h2 style={{ marginBottom: 20 }}>Saved Templates</h2>
      {loading ? (
        <p>Loading...</p>
      ) : templates.length === 0 ? (
        <p>No saved templates found.</p>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Created At</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id}>
                  <td style={{ ...tdStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.name}</td>
                  <td style={{ ...tdStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {new Date(tpl.created_at).toLocaleString()}
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => loadTemplate(tpl)} style={buttonStyle}>Load</button>
                    <button onClick={() => deleteTemplate(tpl)} style={{ ...buttonStyle, marginLeft: 6, backgroundColor: "#c00" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { border: "1px solid #ccc", padding: 6, backgroundColor: "#001f3f", color: "#FFD700", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const tdStyle = { border: "1px solid #ccc", padding: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const buttonStyle = { padding: "4px 8px", cursor: "pointer", backgroundColor: "#001f3f", color: "#FFD700", border: "none", borderRadius: 4 };
