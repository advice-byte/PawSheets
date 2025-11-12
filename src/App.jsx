// src/App.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import Auth from "./components/Auth.jsx";
import EnhancedSpreadsheet from "./components/EnhancedSpreadsheet.jsx";
import CardEditor from "./components/CardEditor.jsx";
import CardEmbed from "./components/pages/CardEmbed.jsx";
import FeedbackForm from "./FeedbackForm.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [stage, setStage] = useState("spreadsheet");
  const [loading, setLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Auth listener
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Load worksheet for the user
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const loadWorksheet = async () => {
      try {
        const { data: worksheets } = await supabase
          .from("worksheets")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);

        let ws = worksheets?.[0];

        // If no worksheet exists, create a new one
        if (!ws) {
          const { data: newWs } = await supabase
            .from("worksheets")
            .insert([
              {
                user_id: user.id,
                name: "My Worksheet",
                columns: [
                  { name: "Images", type: "image" },
                  ...Array(4).fill({ name: "", type: "text" }),
                ],
                rows: Array(5).fill(null).map(() => Array(5).fill({ value: "", type: "text" })),
              },
            ])
            .select()
            .single();
          ws = newWs;
        }

        // Ensure columns and rows are arrays
        ws.columns = Array.isArray(ws.columns) ? ws.columns : JSON.parse(ws.columns || "[]");
        ws.rows = Array.isArray(ws.rows) ? ws.rows : JSON.parse(ws.rows || "[]");

        // Ensure first column is always Images
        if (!ws.columns[0] || ws.columns[0].type !== "image") {
          ws.columns.unshift({ name: "Images", type: "image" });
          ws.rows = ws.rows.map((row) => [{ value: "", type: "image" }, ...row]);
        }

        setWorksheet(ws);
      } finally {
        setLoading(false);
      }
    };

    loadWorksheet();
  }, [user]);

  // Auto-save whenever worksheet changes
  useEffect(() => {
    if (!worksheet || !user) return;
    const timeout = setTimeout(async () => {
      await supabase
        .from("worksheets")
        .upsert({
          id: worksheet.id,
          name: worksheet.name,
          columns: worksheet.columns,
          rows: worksheet.rows,
          user_id: user.id,
        });
    }, 2000); // save 2s after changes

    return () => clearTimeout(timeout);
  }, [worksheet, user]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!user) return <Auth onAuth={(u) => setUser(u)} />;

  const renderStage = () => {
    switch (stage) {
      case "spreadsheet":
        return <EnhancedSpreadsheet worksheet={worksheet} setWorksheet={setWorksheet} user={user} />;
      case "cardEditor":
        return <CardEditor worksheet={worksheet} onBack={() => setStage("spreadsheet")} />;
      case "embeddedCode":
        return <CardEmbed worksheet={worksheet} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          backgroundColor: "#001f3f",
          color: "#FFD700",
          position: "relative",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          {["spreadsheet", "cardEditor", "embeddedCode"].map((tab) => (
            <div
              key={tab}
              onClick={() => setStage(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                backgroundColor: stage === tab ? "#FFD700" : "transparent",
                color: stage === tab ? "#001f3f" : "#FFD700",
                transition: "all 0.2s ease-in-out",
              }}
            >
              {tab === "spreadsheet" ? "Spreadsheet" : tab === "cardEditor" ? "Card Editor" : "Embedded Code"}
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 700, fontSize: 20, color: "#FFD700" }}>Enso Digital Suite</div>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            backgroundColor: "#FFD700",
            color: "#001f3f",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ flex: 1, overflow: "auto", padding: 10 }}>{renderStage()}</div>

      <footer
        style={{
          backgroundColor: "#001f3f",
          color: "#FFD700",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
        }}
      >
        <button
          style={{
            backgroundColor: "#FFD700",
            color: "#001f3f",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={() => setFeedbackOpen(true)}
        >
          Feedback
        </button>

        <div>© {new Date().getFullYear()} Enso Digital Suite</div>
        <div>Version 0.0.1</div>
      </footer>

      {feedbackOpen && <FeedbackForm onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
