"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return setMsg(error.message);
      setMsg("Account created. If email confirmation is on, check your inbox. Then sign in.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    router.push("/studio");
  }

  return (
    <div className="wrap">
      <nav className="nav">
        <Link href="/" className="mark"><b>Hourglass</b> Desk</Link>
      </nav>
      <header className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <div className="kicker">Door</div>
          <h1>{mode === "signin" ? "Come back in." : "Take a desk."}</h1>
        </div>
      </header>
      <div className="grid">
        <form className="card span-7 form" onSubmit={submit}>
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="row">
            <button className="btn" type="submit">{mode === "signin" ? "Sign in" : "Create account"}</button>
            <button type="button" className="btn ghost" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "Need a desk?" : "I already have one"}
            </button>
          </div>
          {msg && <p>{msg}</p>}
        </form>
      </div>
    </div>
  );
}
