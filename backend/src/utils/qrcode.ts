import QRCode from 'qrcode';
import { config } from '../config';

export const generateQRCodeBase64 = async (data: string): Promise<string> => {
  return QRCode.toDataURL(data, { errorCorrectionLevel: 'H', width: 300 });
};

export const generateRegistrationQRData = (registrationId: string): string => {
  return JSON.stringify({ type: 'REGISTRATION', id: registrationId, ts: Date.now() });
};

export const generateCertificateQRData = (verifyToken: string): string => {
  return `${config.frontendUrl}/verify-certificate/${verifyToken}`;
};
