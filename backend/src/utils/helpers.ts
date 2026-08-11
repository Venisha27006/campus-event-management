import { v4 as uuidv4 } from 'uuid';

export const generateSlug = (title: string): string => {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() +
    '-' +
    Date.now().toString(36)
  );
};

export const generateCertificateId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `CERT-${year}-${random}`;
};

export const generateQrData = (registrationId: string): string => {
  return JSON.stringify({ registrationId, timestamp: Date.now() });
};

export const parseBoolean = (value?: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export const sanitizeUser = <
  T extends { passwordHash?: string | null; emailVerifyToken?: string | null; passwordResetToken?: string | null }
>(
  user: T
): Omit<T, 'passwordHash' | 'emailVerifyToken' | 'passwordResetToken'> => {
  const { passwordHash, emailVerifyToken, passwordResetToken, ...safe } = user;
  return safe;
};

export const generateToken = (): string => uuidv4().replace(/-/g, '');
