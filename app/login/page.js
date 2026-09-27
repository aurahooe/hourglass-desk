"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    const fn = mode === "in" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn({ email, password });
    if (error) { setMsg(error.message); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        handle: email.split("@")[0].slice(0, 24),
        display_name: email.split("@")[0]
      });
    }
    router.push("/studio");
  }

  return (
    <div className="wrap">
      <nav className="nav">
        <Link className="mark" href="/">Hourglass <span>Desk</span></Link>
      </nav>
      <div className="card span-12" style={{ maxWidth: 420 }}>
        <div className="kicker">{mode === "in" ? "Return" : "Open a drawer"}</div>
        <h1 style={{ fontSize: 36 }}>{mode === "in" ? "Sign in" : "Create a desk"}</h1>
        <form className="form" onSubmit={submit}>
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="row">
            <button className="btn" type="submit">{mode === "in" ? "Enter" : "Create"}</button>
            <button className="btn ghost" type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Need a desk?" : "Already have one?"}
            </button>
          </div>
          {msg && <p className="empty">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
