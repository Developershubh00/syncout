import bcrypt from "bcryptjs";

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

/** Admin credentials live in env so they can be rotated without a deploy. */
export function checkAdminCredentials(input: {
  username?: string;
  password?: string;
  authKey?: string;
}) {
  const U = process.env.ADMIN_USERNAME ?? "syncout.com";
  const P = process.env.ADMIN_PASSWORD ?? "ganeshSHIV";
  const K = process.env.ADMIN_AUTH_KEY ?? "ganeshSHIV@11";

  if (input.authKey && input.authKey === K) return "key" as const;
  if (input.username === U && input.password === P) return "password" as const;
  return null;
}
