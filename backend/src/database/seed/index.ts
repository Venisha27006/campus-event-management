import 'dotenv/config';
import { PrismaClient, UserRole, EventType, EventMode, EventStatus, ApprovalStatus, Event } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSlug, generateCertificateId } from '../../utils/helpers';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Departments ─────────────────────────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({ where: { code: 'CSE' }, update: {}, create: { name: 'Computer Science & Engineering', code: 'CSE', headName: 'Dr. Rajesh Kumar' } }),
    prisma.department.upsert({ where: { code: 'ECE' }, update: {}, create: { name: 'Electronics & Communication', code: 'ECE', headName: 'Dr. Priya Sharma' } }),
    prisma.department.upsert({ where: { code: 'MECH' }, update: {}, create: { name: 'Mechanical Engineering', code: 'MECH', headName: 'Dr. Suresh Patel' } }),
    prisma.department.upsert({ where: { code: 'CIVIL' }, update: {}, create: { name: 'Civil Engineering', code: 'CIVIL', headName: 'Dr. Anita Rao' } }),
    prisma.department.upsert({ where: { code: 'MBA' }, update: {}, create: { name: 'Business Administration', code: 'MBA', headName: 'Dr. Vikram Singh' } }),
    prisma.department.upsert({ where: { code: 'MCA' }, update: {}, create: { name: 'Master of Computer Applications', code: 'MCA', headName: 'Dr. Meena Iyer' } }),
  ]);
  console.log('✅ Departments seeded');

  // ─── Categories ───────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.eventCategory.upsert({ where: { slug: 'technical' }, update: {}, create: { name: 'Technical', slug: 'technical', color: '#3B82F6', icon: 'code' } }),
    prisma.eventCategory.upsert({ where: { slug: 'workshop' }, update: {}, create: { name: 'Workshop', slug: 'workshop', color: '#10B981', icon: 'tool' } }),
    prisma.eventCategory.upsert({ where: { slug: 'seminar' }, update: {}, create: { name: 'Seminar', slug: 'seminar', color: '#8B5CF6', icon: 'presentation' } }),
    prisma.eventCategory.upsert({ where: { slug: 'hackathon' }, update: {}, create: { name: 'Hackathon', slug: 'hackathon', color: '#F59E0B', icon: 'zap' } }),
    prisma.eventCategory.upsert({ where: { slug: 'cultural' }, update: {}, create: { name: 'Cultural', slug: 'cultural', color: '#EC4899', icon: 'music' } }),
    prisma.eventCategory.upsert({ where: { slug: 'sports' }, update: {}, create: { name: 'Sports', slug: 'sports', color: '#EF4444', icon: 'trophy' } }),
    prisma.eventCategory.upsert({ where: { slug: 'placement' }, update: {}, create: { name: 'Placement', slug: 'placement', color: '#06B6D4', icon: 'briefcase' } }),
    prisma.eventCategory.upsert({ where: { slug: 'guest-lecture' }, update: {}, create: { name: 'Guest Lecture', slug: 'guest-lecture', color: '#84CC16', icon: 'user' } }),
  ]);
  console.log('✅ Categories seeded');

  // ─── Venues ───────────────────────────────────────────────────────────────────
  const venues = await Promise.all([
    prisma.venue.upsert({ where: { id: 'venue-1' }, update: {}, create: { id: 'venue-1', name: 'Main Auditorium', building: 'Admin Block', capacity: 500, facilities: ['Projector', 'AC', 'Sound System', 'Stage'] } }),
    prisma.venue.upsert({ where: { id: 'venue-2' }, update: {}, create: { id: 'venue-2', name: 'Seminar Hall A', building: 'CSE Block', floor: '2nd', room: '201', capacity: 150, facilities: ['Projector', 'AC', 'Whiteboard'] } }),
    prisma.venue.upsert({ where: { id: 'venue-3' }, update: {}, create: { id: 'venue-3', name: 'Computer Lab 1', building: 'CSE Block', floor: '1st', room: '101', capacity: 60, facilities: ['Computers', 'AC', 'Projector'] } }),
    prisma.venue.upsert({ where: { id: 'venue-4' }, update: {}, create: { id: 'venue-4', name: 'Sports Ground', building: 'Sports Complex', capacity: 1000, facilities: ['Open Ground', 'Floodlights'] } }),
    prisma.venue.upsert({ where: { id: 'venue-5' }, update: {}, create: { id: 'venue-5', name: 'Conference Room', building: 'Admin Block', floor: '3rd', room: '301', capacity: 50, facilities: ['Video Conferencing', 'AC', 'Whiteboard'] } }),
  ]);
  console.log('✅ Venues seeded');

  // ─── Users ────────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('Password@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@campus.edu' },
    update: {},
    create: { email: 'admin@campus.edu', passwordHash: hash, firstName: 'Super', lastName: 'Admin', role: UserRole.SUPER_ADMIN, isEmailVerified: true },
  });

  const eventAdmin = await prisma.user.upsert({
    where: { email: 'eventadmin@campus.edu' },
    update: {},
    create: { email: 'eventadmin@campus.edu', passwordHash: hash, firstName: 'Event', lastName: 'Administrator', role: UserRole.EVENT_ADMIN, isEmailVerified: true, departmentId: departments[0].id },
  });

  const faculty1 = await prisma.user.upsert({
    where: { email: 'faculty.cse@campus.edu' },
    update: {},
    create: { email: 'faculty.cse@campus.edu', passwordHash: hash, firstName: 'Dr. Kavitha', lastName: 'Nair', role: UserRole.FACULTY_COORDINATOR, isEmailVerified: true, departmentId: departments[0].id },
  });

  const faculty2 = await prisma.user.upsert({
    where: { email: 'faculty.ece@campus.edu' },
    update: {},
    create: { email: 'faculty.ece@campus.edu', passwordHash: hash, firstName: 'Dr. Ramesh', lastName: 'Babu', role: UserRole.FACULTY_COORDINATOR, isEmailVerified: true, departmentId: departments[1].id },
  });

  const organizer1 = await prisma.user.upsert({
    where: { email: 'organizer1@campus.edu' },
    update: {},
    create: { email: 'organizer1@campus.edu', passwordHash: hash, firstName: 'Arjun', lastName: 'Krishnan', role: UserRole.STUDENT_ORGANIZER, isEmailVerified: true, departmentId: departments[0].id, academicYear: 3, rollNumber: 'CSE21001' },
  });

  // Create 10 student users
  const students = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.user.upsert({
        where: { email: `student${i + 1}@campus.edu` },
        update: {},
        create: {
          email: `student${i + 1}@campus.edu`,
          passwordHash: hash,
          firstName: ['Venisha', 'Rahul', 'Priya', 'Arun', 'Sneha', 'Karthik', 'Divya', 'Vijay', 'Ananya', 'Suresh'][i],
          lastName: ['S', 'M', 'K', 'R', 'P', 'N', 'L', 'T', 'G', 'B'][i],
          role: UserRole.STUDENT,
          isEmailVerified: true,
          departmentId: departments[i % departments.length].id,
          academicYear: (i % 4) + 1,
          rollNumber: `STU2024${String(i + 1).padStart(3, '0')}`,
        },
      })
    )
  );
  console.log('✅ Users seeded');

  // ─── Events ───────────────────────────────────────────────────────────────────
  const now = new Date();
  const future = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const past = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const eventsData = [
    {
      title: 'National Hackathon 2026',
      description: 'A 24-hour hackathon where teams compete to build innovative solutions for real-world problems. Open to all engineering students.',
      shortDescription: '24-hour coding competition for innovative solutions',
      categoryId: categories[3].id,
      eventType: EventType.HACKATHON,
      eventMode: EventMode.OFFLINE,
      departmentId: departments[0].id,
      venueId: venues[0].id,
      maxCapacity: 200,
      startDate: future(15),
      endDate: future(16),
      registrationDeadline: future(10),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
      isFeatured: true,
    },
    {
      title: 'Web Development Bootcamp',
      description: 'Intensive 3-day workshop covering React, Node.js, and PostgreSQL. Build a full-stack application from scratch.',
      shortDescription: 'Full-stack web development with React & Node.js',
      categoryId: categories[1].id,
      eventType: EventType.WORKSHOP,
      eventMode: EventMode.OFFLINE,
      departmentId: departments[0].id,
      venueId: venues[2].id,
      maxCapacity: 60,
      startDate: future(7),
      endDate: future(9),
      registrationDeadline: future(5),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
      isFeatured: true,
    },
    {
      title: 'AI & Machine Learning Seminar',
      description: 'Expert speakers from top tech companies discuss the latest trends in AI, ML, and deep learning.',
      shortDescription: 'Latest trends in AI and Machine Learning',
      categoryId: categories[2].id,
      eventType: EventType.SEMINAR,
      eventMode: EventMode.HYBRID,
      departmentId: departments[0].id,
      venueId: venues[1].id,
      maxCapacity: 150,
      startDate: future(20),
      endDate: future(20),
      registrationDeadline: future(18),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
    },
    {
      title: 'Annual Cultural Fest - Utsav 2026',
      description: 'The biggest cultural event of the year featuring music, dance, drama, and art competitions.',
      shortDescription: 'Annual cultural extravaganza',
      categoryId: categories[4].id,
      eventType: EventType.CULTURAL,
      eventMode: EventMode.OFFLINE,
      venueId: venues[0].id,
      maxCapacity: 500,
      startDate: future(30),
      endDate: future(32),
      registrationDeadline: future(25),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
      isFeatured: true,
    },
    {
      title: 'Campus Placement Drive - TCS',
      description: 'TCS campus recruitment drive for final year students. Includes aptitude test, technical interview, and HR round.',
      shortDescription: 'TCS campus recruitment for final year students',
      categoryId: categories[6].id,
      eventType: EventType.PLACEMENT,
      eventMode: EventMode.OFFLINE,
      venueId: venues[1].id,
      maxCapacity: 100,
      startDate: future(12),
      endDate: future(12),
      registrationDeadline: future(8),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
      requiredYear: 4,
    },
    {
      title: 'Guest Lecture: Future of Cloud Computing',
      description: 'Industry expert from AWS discusses the future of cloud computing, serverless architecture, and DevOps practices.',
      shortDescription: 'Cloud computing trends by AWS expert',
      categoryId: categories[7].id,
      eventType: EventType.GUEST_LECTURE,
      eventMode: EventMode.OFFLINE,
      venueId: venues[1].id,
      maxCapacity: 150,
      startDate: future(5),
      endDate: future(5),
      registrationDeadline: future(3),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
    },
    {
      title: 'Inter-College Cricket Tournament',
      description: 'Annual inter-college cricket tournament. Teams from 10 colleges competing for the championship trophy.',
      shortDescription: 'Annual inter-college cricket championship',
      categoryId: categories[5].id,
      eventType: EventType.SPORTS,
      eventMode: EventMode.OFFLINE,
      venueId: venues[3].id,
      maxCapacity: 200,
      startDate: future(25),
      endDate: future(27),
      registrationDeadline: future(20),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
    },
    {
      title: 'Python for Data Science Workshop',
      description: 'Hands-on workshop on Python programming for data analysis, visualization, and machine learning basics.',
      shortDescription: 'Python programming for data analysis',
      categoryId: categories[1].id,
      eventType: EventType.WORKSHOP,
      eventMode: EventMode.OFFLINE,
      departmentId: departments[0].id,
      venueId: venues[2].id,
      maxCapacity: 60,
      startDate: future(3),
      endDate: future(4),
      registrationDeadline: future(1),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
    },
    // Completed event for feedback/certificate demo
    {
      title: 'React.js Advanced Workshop',
      description: 'Advanced React patterns, hooks, performance optimization, and state management with Redux Toolkit.',
      shortDescription: 'Advanced React patterns and performance',
      categoryId: categories[1].id,
      eventType: EventType.WORKSHOP,
      eventMode: EventMode.OFFLINE,
      departmentId: departments[0].id,
      venueId: venues[2].id,
      maxCapacity: 50,
      startDate: past(10),
      endDate: past(9),
      registrationDeadline: past(15),
      status: EventStatus.COMPLETED,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
    },
    {
      title: 'Entrepreneurship Summit 2026',
      description: 'Connect with successful entrepreneurs, investors, and startup founders. Pitch your ideas and win funding.',
      shortDescription: 'Connect with entrepreneurs and investors',
      categoryId: categories[2].id,
      eventType: EventType.CONFERENCE,
      eventMode: EventMode.OFFLINE,
      venueId: venues[0].id,
      maxCapacity: 300,
      startDate: future(45),
      endDate: future(46),
      registrationDeadline: future(40),
      status: EventStatus.REGISTRATION_OPEN,
      approvalStatus: ApprovalStatus.ADMIN_APPROVED,
    },
  ];

  const createdEvents: Event[] = [];
  for (const eventData of eventsData) {
    const { startDate, endDate, registrationDeadline, ...rest } = eventData;
    const event = await prisma.event.upsert({
      where: { slug: generateSlug(eventData.title).split('-').slice(0, -1).join('-') + '-seed' },
      update: {},
      create: {
        ...rest,
        slug: generateSlug(eventData.title).split('-').slice(0, -1).join('-') + '-seed',
        organizerId: organizer1.id,
        facultyCoordinatorId: faculty1.id,
        startDate,
        endDate,
        registrationDeadline,
        contactEmail: 'events@campus.edu',
        isPublic: true,
      },
    });
    createdEvents.push(event);
  }
  console.log('✅ Events seeded');

  // ─── Registrations & Attendance for completed event ──────────────────────────
  const completedEvent = createdEvents[8]; // React.js Advanced Workshop
  for (let i = 0; i < Math.min(students.length, 8); i++) {
    const reg = await prisma.registration.upsert({
      where: { eventId_userId: { eventId: completedEvent.id, userId: students[i].id } },
      update: {},
      create: {
        eventId: completedEvent.id,
        userId: students[i].id,
        qrCode: `QR-${completedEvent.id}-${students[i].id}`,
        status: 'CONFIRMED',
      },
    });

    // Mark attendance for first 6
    if (i < 6) {
      await prisma.attendance.upsert({
        where: { registrationId: reg.id },
        update: {},
        create: {
          eventId: completedEvent.id,
          registrationId: reg.id,
          userId: students[i].id,
          checkInTime: past(10),
          checkOutTime: past(9),
          method: 'QR_SCAN',
          markedById: organizer1.id,
        },
      });

      // Generate certificate
      const certId = generateCertificateId();
      await prisma.certificate.upsert({
        where: { registrationId: reg.id },
        update: {},
        create: {
          certificateId: certId,
          eventId: completedEvent.id,
          userId: students[i].id,
          registrationId: reg.id,
        },
      });

      // Add feedback
      await prisma.feedback.upsert({
        where: { eventId_userId: { eventId: completedEvent.id, userId: students[i].id } },
        update: {},
        create: {
          eventId: completedEvent.id,
          userId: students[i].id,
          overallRating: 4 + (i % 2),
          speakerRating: 4,
          organizationRating: 5,
          contentRating: 4 + (i % 2),
          comments: ['Excellent workshop!', 'Very informative', 'Great hands-on experience', 'Loved the content', 'Well organized', 'Highly recommended'][i],
        },
      });
    }
  }

  // ─── Registrations for upcoming events ───────────────────────────────────────
  for (let i = 0; i < Math.min(students.length, 5); i++) {
    await prisma.registration.upsert({
      where: { eventId_userId: { eventId: createdEvents[0].id, userId: students[i].id } },
      update: {},
      create: {
        eventId: createdEvents[0].id,
        userId: students[i].id,
        qrCode: `QR-${createdEvents[0].id}-${students[i].id}`,
        status: 'CONFIRMED',
      },
    });
  }

  // ─── Notifications ────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: students.slice(0, 3).map((s) => ({
      userId: s.id,
      eventId: createdEvents[0].id,
      type: 'REGISTRATION_CONFIRMED' as const,
      title: 'Registration Confirmed',
      message: `Your registration for "${createdEvents[0].title}" is confirmed!`,
    })),
    skipDuplicates: true,
  });

  console.log('✅ Registrations, attendance, certificates, feedback seeded');
  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Super Admin:  admin@campus.edu / Password@123');
  console.log('  Event Admin:  eventadmin@campus.edu / Password@123');
  console.log('  Faculty:      faculty.cse@campus.edu / Password@123');
  console.log('  Organizer:    organizer1@campus.edu / Password@123');
  console.log('  Student:      student1@campus.edu / Password@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
