import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
};

export const signRefreshToken = (payload: Pick<JwtPayload, 'userId'>): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): Pick<JwtPayload, 'userId'> => {
  return jwt.verify(token, config.jwt.refreshSecret) as Pick<JwtPayload, 'userId'>;
};

export const getRefreshTokenExpiry = (): Date => {
  const days = parseInt(config.jwt.refreshExpiresIn.replace('d', ''), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
