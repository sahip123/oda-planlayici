"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  };

  return (
    <div style={styles.page}>
      <div style={styles.blueprintPanel}>
        <div style={styles.blueprintGrid} aria-hidden="true" />
        <div style={styles.titleBlock}>
          <span style={styles.eyebrow}>ÖLÇEK 1:50 · PROJE NO. 001</span>
          <h1 style={styles.wordmark}>Oda Planlayıcı</h1>
          <p style={styles.tagline}>Odanı çiz. 3D&apos;de gez. Mobilyanı yerleştir.</p>
        </div>
        <BlueprintDrawing />
      </div>

      <div style={styles.formPanel}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Devam etmek için giriş yap</h2>
          <p style={styles.cardSub}>Projelerin hesabına kaydedilir, istediğin an geri dönersin.</p>

          <button style={styles.googleButton} onClick={signInWithGoogle}>
            <GoogleIcon />
            Google ile devam et
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>veya</span>
            <span style={styles.dividerLine} />
          </div>

          {status === "sent" ? (
            <div style={styles.sentBox}>
              <strong>E-postana bir bağlantı gönderdik.</strong>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-slate)" }}>
                {email} adresine gelen linke tıklayınca doğrudan içeri gireceksin.
              </p>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} style={styles.form}>
              <label style={styles.label} htmlFor="email">
                E-posta adresi
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@eposta.com"
                style={styles.input}
              />
              <button type="submit" style={styles.emailButton} disabled={status === "sending"}>
                {status === "sending" ? "Gönderiliyor..." : "Giriş bağlantısı gönder"}
              </button>
              {status === "error" && (
                <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{errorMsg}</p>
              )}
            </form>
          )}

          <p style={styles.footnote}>
            Şifre yok — Google hesabınla ya da e-postana gelen linkle giriş yaparsın.
          </p>
        </div>
      </div>
    </div>
  );
}

function BlueprintDrawing() {
  return (
    <svg
      viewBox="0 0 420 300"
      style={styles.svg}
      role="img"
      aria-label="Örnek oda taban planı çizimi"
    >
      <g
        fill="none"
        stroke="var(--blueprint-line)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="draw-path"
      >
        <path d="M40 260 L40 60 L220 60 L220 130 L380 130 L380 260 Z" />
        <path d="M220 60 L220 130 L380 130" opacity="0.6" />
      </g>
      <g stroke="var(--wood-accent)" strokeWidth="1.5" className="draw-path" opacity="0.85">
        <line x1="40" y1="40" x2="220" y2="40" />
        <line x1="40" y1="34" x2="40" y2="46" />
        <line x1="220" y1="34" x2="220" y2="46" />
        <line x1="400" y1="130" x2="400" y2="260" />
        <line x1="394" y1="130" x2="406" y2="130" />
        <line x1="394" y1="260" x2="406" y2="260" />
      </g>
      <g fill="var(--wood-accent)" fontFamily="var(--font-mono)" fontSize="11">
        <text x="130" y="30">3.60 m</text>
        <text x="404" y="198" transform="rotate(90 404 198)" textAnchor="middle">
          2.60 m
        </text>
      </g>
      <g fill="var(--blueprint-line)" opacity="0.5">
        <circle cx="40" cy="260" r="3" />
        <circle cx="40" cy="60" r="3" />
        <circle cx="220" cy="60" r="3" />
        <circle cx="220" cy="130" r="3" />
        <circle cx="380" cy="130" r="3" />
        <circle cx="380" cy="260" r="3" />
      </g>
      <style>{`
        .draw-path path, .draw-path line {
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: draw-in 1.6s ease-out forwards;
        }
        @keyframes draw-in {
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .draw-path path, .draw-path line {
            animation: none;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 27 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    flexWrap: "wrap",
  },
  blueprintPanel: {
    flex: "1 1 480px",
    minHeight: 360,
    background: "var(--ink-navy)",
    backgroundImage: "radial-gradient(circle at 20% 20%, var(--ink-navy-deep), var(--ink-navy) 70%)",
    color: "#eaf1f8",
    padding: "56px 48px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  blueprintGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(143,193,227,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(143,193,227,0.08) 1px, transparent 1px)",
    backgroundSize: "28px 28px",
    pointerEvents: "none",
  },
  titleBlock: { position: "relative", zIndex: 1 },
  eyebrow: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    letterSpacing: "0.12em",
    color: "var(--wood-accent)",
  },
  wordmark: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: 700,
    margin: "12px 0 8px",
    letterSpacing: "-0.01em",
  },
  tagline: {
    fontFamily: "var(--font-body)",
    fontSize: 15,
    color: "#b7c9dc",
    maxWidth: 360,
  },
  svg: { width: "100%", maxWidth: 420, position: "relative", zIndex: 1 },
  formPanel: {
    flex: "1 1 380px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--paper)",
    padding: "40px 24px",
  },
  card: { width: "100%", maxWidth: 380 },
  cardTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 14,
    color: "var(--ink-slate)",
    marginBottom: 24,
  },
  googleButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid var(--paper-dim)",
    background: "#ffffff",
    fontSize: 15,
    fontWeight: 500,
    color: "var(--ink-navy)",
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "22px 0",
  },
  dividerLine: { flex: 1, height: 1, background: "var(--paper-dim)" },
  dividerText: { fontSize: 12, color: "var(--ink-slate)" },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 500, color: "var(--ink-slate)" },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--paper-dim)",
    fontSize: 15,
    marginBottom: 10,
  },
  emailButton: {
    padding: "12px 16px",
    borderRadius: 8,
    border: "none",
    background: "var(--wood-accent-deep)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  sentBox: {
    background: "#eef6f3",
    border: "1px solid var(--teal-accent)",
    borderRadius: 8,
    padding: "14px 16px",
    fontSize: 14,
  },
  footnote: {
    marginTop: 20,
    fontSize: 12,
    color: "var(--ink-slate)",
  },
};
