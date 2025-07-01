import { db } from "../database"
import { table } from "../database/schema";
import { auth } from "../libs/auth/auth";

const defaultSuperAdmin = {
  email: process.env.SUPER_ADMIN_EMAIL || "superadmin@localhost.locals",
  name: process.env.SUPER_ADMIN_NAME || "Super Admin",
}

function generatePassword() {
  var length = 8,
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export const createSuperAdmin = async () => {
  const user = await db.select().from(table.user).limit(1);

  if (!user.length) {
    const user_password = process.env.SUPER_ADMIN_PASSWORD || generatePassword()
    await auth.api.signUpEmail({
      body: {
        ...defaultSuperAdmin,
        password: user_password
      }
    })
    console.log("Super Admin created successfully with email:", defaultSuperAdmin.email, "and password:", user_password);
  }
}