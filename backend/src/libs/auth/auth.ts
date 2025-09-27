import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../database";
import { eq } from "drizzle-orm";
import { account, session, table, user, verification } from "../../database/schema";
import { config } from "../../config";
export const auth = betterAuth({
  database: drizzleAdapter(db, { // We're using Drizzle as our database
    provider: "pg",
    /*
    * Map your schema into a better-auth schema
    */
    schema: {
      user,
      session,
      verification,
      account,
    },
  }),
  emailAndPassword: { // we need to verify the email if use this
    enabled: config.allowPublicRegistration, // If you want to use email and password auth
    autoSignIn: false,
  },
  socialProviders: {
    /*
    * We're using Google and Github as our social provider, 
    * make sure you have set your environment variables
    */
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      disableSignUp: config.allowPublicRegistration
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      disableSignUp: config.allowPublicRegistration
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      disableSignUp: config.allowPublicRegistration
    },
  },
  trustedOrigins: ["http://localhost:3000/api/auth", "http://localhost:3000", "http://localhost:5173", "http://localhost:5173/auth/callback", "https://self-hosted-forum.vercel.app", "https://self-hosted-forum.vercel.app/", "https://self-hosted-forum.vercel.app/auth/callback"],
  advanced: {
    cookies: {
      session_token: {
        attributes: {
          // Set custom cookie attributes
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
        }
      },
    }
  },
  plugins: [
    openAPI(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Modify user data before creation
          const roleIds = await db.select({ id: table.roles.id }).from(table.roles).where(eq(table.roles.name, 'user'));
          return { data: { ...user, roleIds: roleIds.map(role => role.id) } };
        }
      },
    }
  },
  
});