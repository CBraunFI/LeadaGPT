import jwt, { SignOptions } from 'jsonwebtoken';

const ADMIN_JWT_SECRET: string = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin-secret-key';
const ADMIN_JWT_EXPIRY: string = process.env.ADMIN_JWT_EXPIRY || '8h'; // Shorter expiry for admins

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: string;
}

export const generateAdminToken = (payload: AdminJwtPayload): string => {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: ADMIN_JWT_EXPIRY } as SignOptions);
};

export const verifyAdminToken = (token: string): AdminJwtPayload => {
  return jwt.verify(token, ADMIN_JWT_SECRET) as AdminJwtPayload;
};
