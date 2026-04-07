import bcrypt from "bcryptjs";

export const generateDefaultPassword = (firstName: string): string =>
  `smaart${firstName.toLowerCase()}${new Date().getFullYear()}!`;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, 10);
