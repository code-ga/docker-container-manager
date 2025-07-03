import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  baseURL: 'http://localhost:3000/api/auth',
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  forgetPassword,
  linkSocial,
  unlinkAccount,
  listAccounts,
  updateUser,
  changePassword,
  resetPassword,
} = authClient;


export default authClient;
