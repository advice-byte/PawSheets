import { supabase } from "../supabaseClient";

export default function SaveWorksheet({ worksheet, setWorksheet, user }) {
  const saveWorksheet = async () => {
    if (!worksheet || !user) return;

    const { error, data } = await supabase
      .from("worksheets")
      .upsert({
        id: worksheet.id,
        name: worksheet.name,
        columns: worksheet.columns,
        rows: worksheet.rows,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      alert("Error saving worksheet: " + error.message);
      console.error(error);
    } else {
      setWorksheet(data);
      alert("Worksheet Saved Successfully!");
    }
  };

  return <button onClick={saveWorksheet} className="save-button">Save</button>;
}
