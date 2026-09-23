"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

function hourKey(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}`;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [feature, setFeature] = useState(null);
  const [posts, setPosts] = useState([]);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setMinutes(60, 0, 0);
      setSeconds(Math.max(0, Math.floor((next - now) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function load() {
      const key = hourKey();
      const { data: feat } = await supabase
        .from("hourly_features")
        .select("id, note, hour_key, post_id")
        .eq("hour_key", key)
        .maybeSingle();

      if (feat?.post_id) {
        const { data: post } = await supabase
          .from("posts")
          .select("id, title, body, created_at, user_id, is_public")
          .eq("id", feat.post_id)
          .maybeSingle();
        setFeature({ ...feat, post });
      } else {
        setFeature(feat);
      }

      const { data: list } = await supabase
        .from("posts")
        .select("id, title, body, created_at, user_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(18);
      setPosts(list || []);
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
        <div className="mark"><b>Hourglass</b> Desk</div>
        <div className="links">
          <Link href="/">Board</Link>
          <Link href="/studio">Studio</Link>
          {user ? (
            <button onClick={() => supabase.auth.signOut()}>Sign out</button>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </div>
      </nav>
      <header className="hero">
        <div>
          <div className="kicker">Living bulletin</div>
          <h1>What the hour chose to keep.</h1>
          <p className="lede">Write privately, publish when it feels finished. Anything marked public lands on the board. Every hour, one piece is pulled into the lamp.</p>
        </div>
        <div className="clock">
          <small>Until the next turn</small>
          <strong>{clock}</strong>
          <div style={{ opacity: 0.75, fontSize: 14 }}>{feature?.note || "Waiting for this hour’s dispatch."}</div>
        </div>
      </header>
      <section className="grid">
        <article className="card span-7">
          <div className="meta">This hour</div>
          {feature?.post ? (<><h2>{feature.post.title}</h2><p>{feature.post.body}</p></>) : (<p className="empty">No public slip has been chosen yet. Publish something and it can surface on the next turn.</p>)}
        </article>
        <aside className="card span-5">
          <div className="meta">How it works</div>
          <h3>A desk, not a feed.</h3>
          <p>Sign in, keep drafts in the studio, tick public when you want the room to see it. The hourly turn is automatic. Nothing here is meant to shout.</p>
        </aside>
        {posts.map((p, i) => (
          <article key={p.id} className={`card ${i % 5 === 0 ? "span-8" : "span-4"}`} style={{ animation: `rise 700ms ${80 + i * 40}ms ease both` }}>
            <div className="meta">{new Date(p.created_at).toLocaleString()}</div>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
