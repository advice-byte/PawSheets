import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient.js";
import Auth from "./components/Auth.jsx";
import EnhancedSpreadsheet from "./components/EnhancedSpreadsheet.jsx";
import CardEditor from "./components/CardEditor.jsx";
import FeedbackForm from "./FeedbackForm.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [stage, setStage] = useState("spreadsheet");
  const [loading, setLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const saveTimeout = useRef(null);

  // ✅ Improved Auth handling (fewer re-renders)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ✅ Load worksheet (only runs when user changes AND worksheet not already loaded)
  useEffect(() => {
    if (!user || worksheet) return; // <-- Skip if already loaded
    setLoading(true);

    const loadWorksheet = async () => {
      try {
        const { data: worksheets } = await supabase
          .from("worksheets")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);

        let ws = worksheets?.[0];

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
                rows: Array(5)
                  .fill(null)
                  .map(() => Array(5).fill({ value: "", type: "text" })),
              },
            ])
            .select()
            .single();
          ws = newWs;
        }

        ws.columns = Array.isArray(ws.columns) ? ws.columns : JSON.parse(ws.columns || "[]");
        ws.rows = Array.isArray(ws.rows) ? ws.rows : JSON.parse(ws.rows || "[]");

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
  }, [user, worksheet]);

  // ✅ Debounced auto-save (improves performance)
  const debouncedSave = useCallback(
    (ws) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        if (!ws || !user) return;
        await supabase
          .from("worksheets")
          .upsert({
            id: ws.id,
            name: ws.name,
            columns: ws.columns,
            rows: ws.rows,
            user_id: user.id,
          });
      }, 2000);
    },
    [user]
  );

  useEffect(() => {
    if (worksheet) debouncedSave(worksheet);
  }, [worksheet, debouncedSave]);

  // ✅ Render Auth first if user not authenticated
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!user) return <Auth onAuth={(u) => setUser(u)} />;

  const renderStage = () => {
    switch (stage) {
      case "spreadsheet":
        return <EnhancedSpreadsheet worksheet={worksheet} setWorksheet={setWorksheet} user={user} />;
      case "cardEditor":
        return <CardEditor worksheet={worksheet} onBack={() => setStage("spreadsheet")} />;
      default:
        return null;
    }
  };

  // 🔵 Shared tech-style animated background
  const techGradient = {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(135deg, #001f3f 0%, #012d5a 50%, #001f3f 100%)",
    backgroundSize: "200% 200%",
    animation: "gradientShift 10s ease infinite",
    zIndex: 0,
    overflow: "hidden",
  };

  const techGrid = {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,215,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.08) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    zIndex: 0,
  };

  const gradientAnimation = `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <style>{gradientAnimation}</style>

      {/* Header with tech animation */}
      <header
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          color: "#FFD700",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        <div style={techGradient}></div>
        <div style={techGrid}></div>

        <div style={{ display: "flex", gap: "12px", position: "relative", zIndex: 1 }}>
          {["spreadsheet", "cardEditor"].map((tab) => (
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
              {tab === "spreadsheet" ? "Spreadsheet" : "Card Editor"}
            </div>
          ))}
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: 22,
            fontFamily: "'Orbitron', sans-serif",
            color: "#FFD700",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            textShadow: "0 0 8px rgba(255,215,0,0.3)",
          }}
        >
          Enso Digital Suite
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            position: "relative",
            zIndex: 1,
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

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", padding: 10 }}>{renderStage()}</div>

      {/* Footer with tech grid background */}
      <footer
        style={{
          position: "relative",
          backgroundColor: "#001f3f",
          color: "#FFD700",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          overflow: "hidden",
        }}
      >
        <div style={techGradient}></div>
        <div style={techGrid}></div>

        <div style={{ position: "relative", zIndex: 1 }}>
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
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>© {new Date().getFullYear()} Enso Digital Suite</div>
        <div style={{ position: "relative", zIndex: 1 }}>Version 0.0.1</div>
      </footer>

      {feedbackOpen && <FeedbackForm onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
