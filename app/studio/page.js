"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Studio() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      setProfile(prof);
      setDisplayName(prof?.display_name || "");
      setBio(prof?.bio || "");
      const { data: mine } = await supabase.from("posts").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false });
      setPosts(mine || []);
    });
  }, [router]);

  async function saveProfile(e) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      handle: profile?.handle || user.email.split("@")[0],
      display_name: displayName || "New voice",
      bio,
    });
    setMsg(error ? error.message : "Profile saved.");
  }

  async function publish(e) {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase.from("posts").insert({
      user_id: user.id,
      title,
      body,
      is_public: isPublic,
    }).select().single();
    if (error) return setMsg(error.message);
    setPosts([data, ...posts]);
    setTitle(""); setBody(""); setIsPublic(false);
    setMsg(isPublic ? "On the public board." : "Saved privately.");
  }

  async function togglePublic(post) {
    const { data, error } = await supabase.from("posts").update({ is_public: !post.is_public }).eq("id", post.id).select().single();
    if (error) return setMsg(error.message);
    setPosts(posts.map((p) => (p.id === post.id ? data : p)));
  }

  if (!user) return null;

  return (
    <div className="wrap">
      <nav className="nav">
        <Link href="/" className="mark"><b>Hourglass</b> Desk</Link>
        <div className="links">
          <Link href="/">Board</Link>
          <button onClick={() => supabase.auth.signOut().then(() => router.push("/"))}>Sign out</button>
        </div>
      </nav>
      <header className="hero">
        <div>
          <div className="kicker">Studio</div>
          <h1>Write it down. Decide later who sees it.</h1>
        </div>
      </header>
      <section className="grid">
        <form className="card span-7 form" onSubmit={publish}>
          <div className="meta">New slip</div>
          <input required maxLength={120} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea required maxLength={8000} placeholder="The thing itself" value={body} onChange={(e) => setBody(e.target.value)} />
          <label className="check">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Mark public — show on the board
          </label>
          <button className="btn" type="submit">Save</button>
        </form>
        <form className="card span-5 form" onSubmit={saveProfile}>
          <div className="meta">Your name in the room</div>
          <input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <textarea placeholder="A short bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          <button className="btn ghost" type="submit">Update profile</button>
        </form>
        {msg && <div className="card span-12"><p>{msg}</p></div>}
        {posts.map((p) => (
          <article key={p.id} className="card span-4">
            <div className="meta">{p.is_public ? "Public" : "Private"} · {new Date(p.created_at).toLocaleString()}</div>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn ghost" onClick={() => togglePublic(p)}>{p.is_public ? "Make private" : "Make public"}</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
