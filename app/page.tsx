"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import FloorPlanEditor from "./components/FloorPlanEditor";
import LoginScreen from "./components/LoginScreen";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body)" }}>
        <p>Yükleniyor...</p>
      </main>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <main style={{ padding: "16px", fontFamily: "var(--font-body)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px, 4vw, 28px)", margin: 0 }}>
          Oda Planlayıcı — Faz 1: 2D Taban Planı
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, flexWrap: "wrap" }}>
          <span style={{ color: "var(--ink-slate)" }}>{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()}>Çıkış yap</button>
        </div>
      </div>
      <FloorPlanEditor userId={session.user.id} />
    </main>
  );
}
