import React from "react";
import { AUTH_URLS } from "../lib/constants";

interface LinkedAccounts {
  google: boolean;
  github: boolean;
  discord: boolean;
}

interface Props {
  linked: LinkedAccounts;
  loading: boolean;
  handleLink: (providerKey: string) => void;
  handleUnlink: (providerKey: string) => void;
}

const SOCIAL_PROVIDERS = [
  { name: "Google", key: "google", authUrl: AUTH_URLS.GOOGLE },
  { name: "GitHub", key: "github", authUrl: AUTH_URLS.GITHUB },
  { name: "Discord", key: "discord", authUrl: AUTH_URLS.DISCORD },
] as const;

const LinkSocialAccounts: React.FC<Props> = ({ linked, loading, handleLink, handleUnlink }) => {
  return (
    <div
      style={{
        background: "rgba(39, 30, 60, 0.85)",
        boxShadow: "0 2px 12px 0 rgba(168,139,250,0.10)",
        borderRadius: 16,
        padding: 24,
        minWidth: 320,
        flex: 1,
        maxWidth: 420,
      }}
    >
      <h3 style={{ color: '#f472b6', fontWeight: 700, marginBottom: 18, fontSize: 20, textAlign: 'right' }}>Link Social Accounts</h3>
      {loading ? (
        <p style={{ color: "#b39ddb", textAlign: 'right' }}>Loading...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {SOCIAL_PROVIDERS.map((provider) => (
            <li
              key={provider.key}
              style={{
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 600, color: "#fff" }}>{provider.name}</span>
              {linked[provider.key as keyof LinkedAccounts] ? (
                <button
                  style={{
                    background:
                      "linear-gradient(90deg, #a78bfa 0%, #f472b6 100%)",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem 1.2rem",
                    borderRadius: 12,
                    fontWeight: 700,
                    boxShadow: "0 2px 8px 0 rgba(244, 114, 182, 0.15)",
                    letterSpacing: 1,
                    transition: "background 0.2s, color 0.2s, transform 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => handleUnlink(provider.key)}
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => handleLink(provider.key)}
                  style={{
                    background:
                      "linear-gradient(90deg, #f472b6 0%, #a78bfa 100%)",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem 1.2rem",
                    borderRadius: 12,
                    fontWeight: 700,
                    boxShadow: "0 2px 8px 0 rgba(168, 139, 250, 0.15)",
                    letterSpacing: 1,
                    transition: "background 0.2s, color 0.2s, transform 0.2s",
                    cursor: "pointer",
                  }}
                >
                  Link
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LinkSocialAccounts;
