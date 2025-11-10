// src/App.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import Auth from "./components/Auth.jsx";
import EnhancedSpreadsheet from "./components/EnhancedSpreadsheet.jsx";
import CardEditor from "./components/CardEditor.jsx";
import CardEmbed from "./components/pages/CardEmbed.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [stage, setStage] = useState("spreadsheet"); // spreadsheet | cardEditor | embeddedCode
  const [loading, setLoading] = useState(true);

  // ---- Auth listener ----
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // ---- Worksheet loading ----
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const loadWorksheet = async () => {
      try {
        let { data: worksheets, error } = await supabase
          .from("worksheets")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);

        if (error) throw error;

        let ws = worksheets?.[0];

        if (!ws) {
          const { data: newWs, error: insertErr } = await supabase
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
                  .map(() =>
                    Array(5).fill({ value: "", type: "text" })
                  ),
              },
            ])
            .select()
            .single();
          if (insertErr) throw insertErr;
          ws = newWs;
        } else {
          try {
            ws.columns = Array.isArray(ws.columns)
              ? ws.columns
              : JSON.parse(ws.columns || "[]");
            ws.rows = Array.isArray(ws.rows)
              ? ws.rows
              : JSON.parse(ws.rows || "[]");
          } catch {
            ws.columns = ws.columns || [{ name: "Images", type: "image" }];
            ws.rows = ws.rows || [];
          }

          if (!ws.columns[0] || ws.columns[0].type !== "image") {
            ws.columns.unshift({ name: "Images", type: "image" });
            ws.rows = ws.rows.map(row => [{ value: "", type: "image" }, ...row]);
          }
        }

        setWorksheet(ws);
      } catch (err) {
        console.error("Error loading worksheet:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWorksheet();
  }, [user]);

  // ---- Save worksheet automatically on changes ----
  useEffect(() => {
    if (!worksheet || !user) return;

    const saveWorksheet = async () => {
      try {
        await supabase
          .from("worksheets")
          .update({
            name: worksheet.name,
            columns: worksheet.columns,
            rows: worksheet.rows,
          })
          .eq("id", worksheet.id);
      } catch (err) {
        console.error("Failed to save worksheet:", err);
      }
    };

    saveWorksheet();
  }, [worksheet, user]);

  // ---- Loading / Auth ----
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!user) return <Auth onAuth={setUser} />;
  if (!worksheet)
    return <div style={{ padding: 20 }}>⚠️ No worksheet loaded. Please refresh.</div>;

  // ---- Tab content ----
  const renderStage = () => {
    switch (stage) {
      case "spreadsheet":
        return (
          <EnhancedSpreadsheet
            worksheet={worksheet}
            setWorksheet={setWorksheet}
            user={user}
          />
        );
      case "cardEditor":
        return (
          <CardEditor
            worksheet={worksheet}
            onBack={() => setStage("spreadsheet")}
          />
        );
      case "embeddedCode":
        return <CardEmbed worksheet={worksheet} />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
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
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: Tabs */}
        <div style={{ display: "flex", gap: "12px", zIndex: 2 }}>
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
              {tab === "spreadsheet"
                ? "Spreadsheet"
                : tab === "cardEditor"
                ? "Card Editor"
                : "Embedded Code"}
            </div>
          ))}
        </div>

        {/* CENTER: Brand */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 0.5,
              marginBottom: 2,
              textDecoration: "underline",
              textDecorationColor: "#FFD700",
              textDecorationThickness: "2px",
            }}
          >
            Enso Advisory Group
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 0.5 }}>
            PawSheets
          </div>
        </div>

        {/* RIGHT: Logout */}
        <div style={{ zIndex: 2 }}>
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
              transition: "all 0.2s ease-in-out",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          width: "100%",
          overflowX: "auto",
          overflowY: "auto",
          padding: "10px",
          boxSizing: "border-box",
        }}
      >
        {renderStage()}
      </div>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#001f3f",
          color: "#FFD700",
          textAlign: "center",
          padding: "10px 20px",
          fontSize: 14,
        }}
      >
        © {new Date().getFullYear()} Enso Advisory Group
      </footer>
    </div>
  );
}
