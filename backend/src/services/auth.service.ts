import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { AppError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { sanitizeUser, generateToken } from '../utils/helpers';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { UserRole } from '@prisma/client';

const SALT_ROUNDS = 12;

export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    departmentId?: string;
    academicYear?: number;
    rollNumber?: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered', 409);

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const emailVerifyToken = generateToken();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || UserRole.STUDENT,
        departmentId: data.departmentId,
        academicYear: data.academicYear,
        rollNumber: data.rollNumber,
        emailVerifyToken,
      },
    });

    await sendVerificationEmail(user.email, emailVerifyToken);
    return sanitizeUser(user);
  },

  async login(email: string, password: string, deviceInfo?: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        deviceInfo,
        ipAddress,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return { accessToken, refreshToken, user: sanitizeUser(user) };
  },

  async refreshToken(token: string) {
    const session = await prisma.userSession.findUnique({ where: { refreshToken: token } });
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.userSession.delete({ where: { id: session.id } });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.isActive) throw new UnauthorizedError('User not found');

    // Rotate refresh token
    const newRefreshToken = signRefreshToken({ userId: user.id });
    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });

    await prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, expiresAt: getRefreshTokenExpiry() },
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    await prisma.userSession.deleteMany({ where: { refreshToken } });
  },

  async logoutAll(userId: string) {
    await prisma.userSession.deleteMany({ where: { userId } });
  },

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) throw new AppError('Invalid verification token', 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal if email exists

    const token = generateToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    await sendPasswordResetEmail(email, token);
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
    });

    await prisma.userSession.deleteMany({ where: { userId: user.id } });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await prisma.userSession.deleteMany({ where: { userId } });
  },

  async getSessions(userId: string) {
    return prisma.userSession.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, deviceInfo: true, ipAddress: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },
};
