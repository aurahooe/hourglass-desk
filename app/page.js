"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { nextHour, slotStart } from "../lib/time";

export default function Home() {
  const [user, setUser] = useState(null);
  const [hour, setHour] = useState(null);
  const [notes, setNotes] = useState([]);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.floor((nextHour() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function load() {
      const slot = slotStart();
      const { data: h } = await supabase.from("hours").select("headline, editorial, featured_note_id, slot").eq("slot", slot).maybeSingle();
      let featured = null;
      if (h?.featured_note_id) {
        const { data: n } = await supabase.from("notes").select("id, title, body, created_at").eq("id", h.featured_note_id).maybeSingle();
        featured = n;
      }
      setHour({ ...h, featured });
      const { data: list } = await supabase.from("notes").select("id, title, body, created_at").eq("is_public", true).order("created_at", { ascending: false }).limit(16);
      setNotes(list || []);
    }
    load();
  }, []);

  const clock = useMemo(() => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [seconds]);

  return (
    <div className="wrap">
      <nav className="nav">
        <div className="mark">Hourglass <span>Desk</span></div>
        <div className="links">
          <Link href="/">Board</Link>
          <Link href="/studio">Studio</Link>
          {user ? <button onClick={() => supabase.auth.signOut()}>Sign out</button> : <Link href="/login">Sign in</Link>}
        </div>
      </nav>
      <header className="hero">
        <div>
          <div className="kicker">Living bulletin</div>
          <h1>What the hour decided to keep.</h1>
          <p className="lede">Write in private. Flip a slip public when it is ready. The board only shows what people chose to share. Every hour the lamp turns and one piece is pulled forward.</p>
        </div>
        <div className="clock">
          <small>Until the next turn</small>
          <strong>{clock}</strong>
          <div style={{ color: "#6e6458", fontSize: 14 }}>{hour?.headline || "Waiting on this hour’s dispatch."}</div>
        </div>
      </header>
      <section className="grid">
        <article className="card span-7">
          <div className="meta">This hour</div>
          {hour?.featured ? (
            <>
              <h2>{hour.featured.title}</h2>
              <p>{hour.featured.body}</p>
            </>
          ) : (
            <>
              <h2>{hour?.headline || "The lamp is empty."}</h2>
              <p>{hour?.editorial || "Publish a public slip and it can surface on the next turn."}</p>
            </>
          )}
        </article>
        <aside className="card span-5">
          <div className="meta">House rules</div>
          <h3>A desk, not a feed.</h3>
          <p>Sign in. Keep drafts in the studio. Mark public only when you want the room to see it. Private notes stay private. That is the whole contract.</p>
        </aside>
        {notes.map((n, i) => (
          <article key={n.id} className={`card ${i % 5 === 0 ? "span-8" : "span-4"}`} style={{ animation: `rise 700ms ${60 + i * 35}ms ease both` }}>
            <div className="meta">{new Date(n.created_at).toLocaleString()}</div>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
