import React, { useEffect, useState } from "react";
import {
  linkSocial,
  listAccounts,
  unlinkAccount,
  useSession,
} from "../lib/auth";
import ChangeEmail from "./ChangeEmail";
import ChangePassword from "./ChangePassword";
import LinkSocialAccounts from "./LinkSocialAccounts";

interface LinkedAccounts {
  google: boolean;
  github: boolean;
  discord: boolean;
}

const UserSettingsPage: React.FC = () => {
  const [linked, setLinked] = useState<LinkedAccounts>({
    google: false,
    github: false,
    discord: false,
  });
  const [apiLoading, setLoading] = useState(true);
  const { isPending: authPending } = useSession();
  const loading = apiLoading || authPending;
  useEffect(() => {
    // Fetch linked accounts status from backend
    listAccounts()
      .then((data) => {
        if (!data.data) {
          setLoading(false);
          return;
        }
        const linkedAccounts: LinkedAccounts = {
          google: false,
          github: false,
          discord: false,
        };
        for (const account of data.data) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          /// @ts-ignore
          if (account.provider in linkedAccounts) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            /// @ts-ignore
            linkedAccounts[account.provider as keyof LinkedAccounts] = true;
          }
        }
        setLinked(linkedAccounts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLink = (providerKey: string) => {
    linkSocial({
      provider: providerKey,
      callbackURL: window.location.href,
    });
  };

  const handleUnlink = (providerKey: string) => {
    setLoading(true);
    unlinkAccount({
      providerId: providerKey,
    })
      .then(() => {
        setLinked((prevLinked) => ({
          ...prevLinked,
          [providerKey]: false,
        }));
      })
      .catch((error) => {
        console.error("Error unlinking account:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div
      className="shadow-anime font-anime"
      style={{
        maxWidth: 1100,
        margin: "2rem auto",
        padding: "2rem",
        background: "linear-gradient(135deg, #18122B 0%, #393053 100%)",
        borderRadius: 18,
        boxShadow: "0 6px 32px 0 rgba(168,139,250,0.25)",
        color: "#fff",
        position: "relative",
      }}>
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#a78bfa",
          marginBottom: 24,
          letterSpacing: 1,
        }}>
        User Settings
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 32,
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}>
        {/* Profile Settings Section */}
        <div
          style={{
            background: "rgba(39, 30, 60, 0.85)",
            boxShadow: "0 2px 12px 0 rgba(168,139,250,0.10)",
            borderRadius: 16,
            padding: 24,
            minWidth: 320,
            flex: 1,
            maxWidth: 420,
          }}>
          <h3
            style={{
              color: "#f472b6",
              fontWeight: 700,
              marginBottom: 18,
              fontSize: 20,
              textAlign: "left",
            }}>
            Profile Settings
          </h3>
          {/* Change Email Section */}
          <ChangeEmail />
        </div>
        {/* Change Password Section (center) */}
        <ChangePassword />
        {/* Link Social Accounts Section */}
        <LinkSocialAccounts
          linked={linked}
          loading={loading}
          handleLink={handleLink}
          handleUnlink={handleUnlink}
        />
      </div>
    </div>
  );
};

export default UserSettingsPage;
