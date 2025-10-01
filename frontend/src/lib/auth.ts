import { createAuthClient } from 'better-auth/react';
import { API_BASE_URL, API_ENDPOINTS } from './constants';

const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}${API_ENDPOINTS.AUTH_BASE}`,
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
