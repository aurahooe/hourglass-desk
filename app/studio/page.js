"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Studio() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else {
        setUser(data.user);
        load(data.user.id);
      }
    });
  }, [router]);

  async function load(id) {
    const { data } = await supabase.from("notes").select("*").eq("user_id", id).order("created_at", { ascending: false });
    setNotes(data || []);
  }

  async function save(e) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    await supabase.from("profiles").upsert({
      id: user.id,
      handle: (user.email || "guest").split("@")[0].slice(0, 24),
      display_name: (user.email || "guest").split("@")[0]
    });
    const { error } = await supabase.from("notes").insert({ user_id: user.id, title, body, is_public: isPublic });
    setBusy(false);
    if (error) { alert(error.message); return; }
    setTitle(""); setBody(""); setIsPublic(false);
    load(user.id);
  }

  async function toggle(note) {
    await supabase.from("notes").update({ is_public: !note.is_public, updated_at: new Date().toISOString() }).eq("id", note.id);
    load(user.id);
  }

  async function remove(note) {
    await supabase.from("notes").delete().eq("id", note.id);
    load(user.id);
  }

  if (!user) return null;

  return (
    <div className="wrap">
      <nav className="nav">
        <Link className="mark" href="/">Hourglass <span>Desk</span></Link>
        <div className="links">
          <Link href="/">Board</Link>
          <button onClick={() => supabase.auth.signOut().then(() => router.push("/"))}>Sign out</button>
        </div>
      </nav>
      <section className="grid">
        <article className="card span-7">
          <div className="meta">New slip</div>
          <h2>Write it down.</h2>
          <form className="form" onSubmit={save}>
            <input required maxLength={120} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea required maxLength={8000} placeholder="The note itself" value={body} onChange={(e) => setBody(e.target.value)} />
            <label className="toggle">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Mark public — it will appear on the board
            </label>
            <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save slip"}</button>
          </form>
        </article>
        <aside className="card span-5">
          <div className="meta">Your drawer</div>
          <div className="list">
            {notes.length === 0 && <p className="empty">Nothing filed yet.</p>}
            {notes.map((n) => (
              <div className="slip" key={n.id}>
                <strong>{n.title}</strong>
                <p style={{ margin: "6px 0", color: "#3a332c" }}>{n.body.slice(0, 140)}</p>
                <div className="row">
                  <button className="btn ghost" onClick={() => toggle(n)}>{n.is_public ? "Make private" : "Make public"}</button>
                  <button className="btn ghost" onClick={() => remove(n)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
