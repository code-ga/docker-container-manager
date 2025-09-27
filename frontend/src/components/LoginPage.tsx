import { useSession, signIn, signOut } from "../lib/auth";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Example anime background SVG (could be replaced with an image or more complex SVG)
const AnimeBackground = () => (
  <svg
    width="100%"
    height="100%"
    style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
    viewBox="0 0 1440 800"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="animeGradient" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#f7b2ff" />
        <stop offset="1" stopColor="#a0c4ff" />
      </linearGradient>
    </defs>
    <rect width="1440" height="800" fill="url(#animeGradient)" />
    <ellipse cx="1200" cy="200" rx="200" ry="80" fill="#ffd6e0" opacity="0.4" />
    <ellipse cx="300" cy="600" rx="250" ry="100" fill="#b5ead7" opacity="0.3" />
    <ellipse cx="700" cy="400" rx="180" ry="60" fill="#fff1c1" opacity="0.2" />
  </svg>
);
const callbackURL = import.meta.env.DEV
  ? "http://localhost:5173/dashboard"
  : "https://self-hosted-forum.vercel.app/dashboard";
const LoginPage: React.FC = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (session) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [session, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        fontFamily: "'Noto Sans JP', 'Roboto', 'Arial', sans-serif",
        overflow: "hidden",
        background: "linear-gradient(135deg, #f7b2ff 0%, #a0c4ff 100%)",
      }}
    >
      <AnimeBackground />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.85)",
            borderRadius: "32px",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
            padding: "48px 32px",
            maxWidth: "350px",
            width: "100%",
            textAlign: "center",
            border: "2px solid #f7b2ff",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            {/* Cute anime mascot emoji */}
            <span style={{ fontSize: 56, display: "block", marginBottom: 8 }}>
              🌸
            </span>
            <h1
              style={{
                fontFamily: "'Noto Sans JP', 'Roboto', sans-serif",
                fontWeight: 700,
                fontSize: 32,
                color: "#a259ff",
                margin: 0,
                letterSpacing: 1,
              }}
            >
              CMP (Container Manager Panel)
            </h1>
            <p
              style={{
                color: "#7c43bd",
                fontSize: 16,
                marginTop: 8,
                marginBottom: 0,
                fontWeight: 500,
              }}
            >
              Login to manage your containers securely.
            </p>
          </div>
          {session ? (
            <>
              <div
                style={{
                  marginBottom: 24,
                  color: "#5e35b1",
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                Welcome, {session.user?.name || "User"}!{" "}
                <span style={{ fontSize: 22 }}>👋</span>
              </div>
              {redirecting && (
                <div
                  style={{
                    color: "#5e35b1",
                    fontWeight: 600,
                    fontSize: 16,
                    marginBottom: 16,
                  }}
                >
                  Redirecting to dashboard in 3 seconds...
                </div>
              )}
              <button
                onClick={() => signOut()}
                style={{
                  background:
                    "linear-gradient(90deg, #f7b2ff 0%, #a0c4ff 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 24,
                  padding: "12px 32px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(160,196,255,0.2)",
                  transition: "background 0.2s",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  signIn.social({ callbackURL, provider: "google" })
                }
                style={{
                  background: "#fff",
                  color: "#4285F4",
                  border: "1px solid #4285F4",
                  borderRadius: 24,
                  padding: "12px 0",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                  alt="Google"
                  style={{ width: 22, height: 22 }}
                />
                Sign in with Google
              </button>
              <button
                onClick={() =>
                  signIn.social({
                    provider: "github",
                    callbackURL,
                  })
                }
                style={{
                  background: "#fff",
                  color: "#333",
                  border: "1px solid #333",
                  borderRadius: 24,
                  padding: "12px 0",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                  alt="GitHub"
                  style={{ width: 22, height: 22 }}
                />
                Sign in with GitHub
              </button>
              <button
                onClick={() =>
                  signIn.social({
                    provider: "discord",
                    callbackURL,
                  })
                }
                style={{
                  background: "#fff",
                  color: "#5865F2",
                  border: "1px solid #5865F2",
                  borderRadius: 24,
                  padding: "12px 0",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d80db9971f10a9757c99_Symbol.svg"
                    alt="Discord"
                    style={{ width: 22, height: 22 }}
                  />
                </span>
                Sign in with Discord
              </button>
              <div
                style={{ margin: "16px 0", color: "#b39ddb", fontWeight: 500 }}
              >
                or
              </div>
              <form
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = (e.currentTarget[0] as HTMLInputElement).value;
                  const password = (e.currentTarget[1] as HTMLInputElement)
                    .value;
                  await signIn.email({ email, password, callbackURL });
                }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 16,
                    border: "1px solid #a0c4ff",
                    fontSize: 15,
                  }}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 16,
                    border: "1px solid #a0c4ff",
                    fontSize: 15,
                  }}
                  required
                />
                <button
                  type="submit"
                  style={{
                    background:
                      "linear-gradient(90deg, #a0c4ff 0%, #f7b2ff 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 24,
                    padding: "12px 0",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Sign in with Email
                </button>
              </form>
            </>
          )}
          <div
            style={{
              marginTop: 24,
              fontSize: 13,
              color: "#b39ddb",
              fontStyle: "italic",
            }}
          >
            Powered by{" "}
            <span style={{ color: "#a259ff", fontWeight: 700 }}>CMP</span> ⚡
          </div>
        </div>
      </div>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');
        `}
      </style>
    </div>
  );
};

export default LoginPage;
