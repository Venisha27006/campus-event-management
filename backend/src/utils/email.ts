import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: { user: config.email.user, pass: config.email.pass },
});

const sendMail = async (to: string, subject: string, html: string) => {
  if (config.nodeEnv === 'test') return;
  try {
    await transporter.sendMail({ from: `"${config.appName}" <${config.email.from}>`, to, subject, html });
  } catch (err) {
    console.error('Email send failed:', err);
  }
};

export const sendVerificationEmail = (to: string, token: string) =>
  sendMail(
    to,
    'Verify your email',
    `<p>Click <a href="${config.appUrl}/api/auth/verify-email?token=${token}">here</a> to verify your email.</p>`
  );

export const sendPasswordResetEmail = (to: string, token: string) =>
  sendMail(
    to,
    'Reset your password',
    `<p>Click <a href="${config.frontendUrl}/reset-password?token=${token}">here</a> to reset your password. This link expires in 1 hour.</p>`
  );

export const sendEventNotificationEmail = (to: string, subject: string, message: string) =>
  sendMail(to, subject, `<p>${message}</p><br><p>— ${config.appName}</p>`);
