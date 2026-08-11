import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma';
import { AppError, NotFoundError } from '../utils/errors';
import { generateCertificateId } from '../utils/helpers';
import { generateCertificateQRData, generateQRCodeBase64 } from '../utils/qrcode';
import { config } from '../config';
import { notificationService } from './notification.service';

export const certificateService = {
  async generate(eventId: string, userId: string) {
    const [registration, attendance] = await Promise.all([
      prisma.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
        include: {
          event: { select: { title: true, startDate: true, endDate: true, organizer: { select: { firstName: true, lastName: true } } } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.attendance.findFirst({ where: { eventId, userId } }),
    ]);

    if (!registration) throw new NotFoundError('Registration');
    if (!attendance?.checkInTime) throw new AppError('Attendance required for certificate generation');

    // Check if already generated
    const existing = await prisma.certificate.findUnique({ where: { registrationId: registration.id } });
    if (existing) return existing;

    const certId = generateCertificateId();
    const verifyToken = require('uuid').v4();

    const cert = await prisma.certificate.create({
      data: {
        certificateId: certId,
        eventId,
        userId,
        registrationId: registration.id,
        verifyToken,
      },
    });

    // Generate PDF
    const pdfPath = await generateCertificatePDF({
      certificateId: certId,
      participantName: `${registration.user.firstName} ${registration.user.lastName}`,
      eventName: registration.event.title,
      eventDate: registration.event.startDate,
      organizerName: `${registration.event.organizer.firstName} ${registration.event.organizer.lastName}`,
      verifyToken,
    });

    await prisma.certificate.update({ where: { id: cert.id }, data: { pdfUrl: pdfPath } });

    await notificationService.create({
      userId,
      eventId,
      type: 'CERTIFICATE_AVAILABLE',
      title: 'Certificate Available',
      message: `Your certificate for "${registration.event.title}" is ready to download!`,
    });

    return { ...cert, pdfUrl: pdfPath };
  },

  async generateBulk(eventId: string, adminId: string) {
    const attendees = await prisma.attendance.findMany({
      where: { eventId, checkInTime: { not: null } },
      select: { userId: true },
    });

    const results = await Promise.allSettled(
      attendees.map((a) => certificateService.generate(eventId, a.userId))
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { generated: success, failed, total: attendees.length };
  },

  async verify(verifyToken: string, ipAddress?: string) {
    const cert = await prisma.certificate.findUnique({
      where: { verifyToken },
      include: {
        user: { select: { firstName: true, lastName: true } },
        event: { select: { title: true, startDate: true } },
      },
    });

    if (!cert) return { valid: false, message: 'Certificate not found' };

    await prisma.certificateVerification.create({
      data: { certificateId: cert.id, ipAddress },
    });

    return {
      valid: cert.isValid,
      certificateId: cert.certificateId,
      participantName: `${cert.user.firstName} ${cert.user.lastName}`,
      eventName: cert.event.title,
      eventDate: cert.event.startDate,
      issuedAt: cert.issuedAt,
    };
  },

  async getUserCertificates(userId: string) {
    return prisma.certificate.findMany({
      where: { userId },
      include: { event: { select: { title: true, startDate: true, category: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  },
};

// ─── PDF Generation ───────────────────────────────────────────────────────────

const generateCertificatePDF = async (data: {
  certificateId: string;
  participantName: string;
  eventName: string;
  eventDate: Date;
  organizerName: string;
  verifyToken: string;
}): Promise<string> => {
  const dir = path.join(config.upload.dir, 'certificates');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${data.certificateId}.pdf`;
  const filepath = path.join(dir, filename);

  const qrDataUrl = await generateQRCodeBase64(generateCertificateQRData(data.verifyToken));
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#1a56db');

    // Header
    doc.fillColor('#1a56db').fontSize(28).font('Helvetica-Bold')
      .text(config.appName, 0, 60, { align: 'center' });

    doc.fillColor('#333').fontSize(20).font('Helvetica')
      .text('CERTIFICATE OF PARTICIPATION', 0, 100, { align: 'center' });

    doc.moveTo(100, 135).lineTo(doc.page.width - 100, 135).stroke('#1a56db');

    // Body
    doc.fillColor('#555').fontSize(14).font('Helvetica')
      .text('This is to certify that', 0, 155, { align: 'center' });

    doc.fillColor('#1a56db').fontSize(26).font('Helvetica-Bold')
      .text(data.participantName, 0, 180, { align: 'center' });

    doc.fillColor('#555').fontSize(14).font('Helvetica')
      .text('has successfully participated in', 0, 220, { align: 'center' });

    doc.fillColor('#333').fontSize(20).font('Helvetica-Bold')
      .text(data.eventName, 0, 245, { align: 'center' });

    doc.fillColor('#555').fontSize(12).font('Helvetica')
      .text(`held on ${data.eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 0, 280, { align: 'center' });

    // Footer
    doc.moveTo(100, 330).lineTo(doc.page.width - 100, 330).stroke('#ccc');

    doc.fillColor('#333').fontSize(11).font('Helvetica')
      .text(`Certificate ID: ${data.certificateId}`, 60, 345)
      .text(`Organizer: ${data.organizerName}`, 60, 360);

    // QR Code
    doc.image(qrBuffer, doc.page.width - 130, 330, { width: 80, height: 80 });
    doc.fillColor('#999').fontSize(8).text('Scan to verify', doc.page.width - 130, 415, { width: 80, align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(`/uploads/certificates/${filename}`));
    stream.on('error', reject);
  });
};
