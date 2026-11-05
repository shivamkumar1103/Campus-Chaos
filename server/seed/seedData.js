require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const LostFoundItem = require('../models/LostFoundItem');
const Room = require('../models/Room');
const TimetableEntry = require('../models/TimetableEntry');
const RoomBooking = require('../models/RoomBooking');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('Set MONGO_URI in .env first');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB. Resetting collections...');

  await User.deleteMany({});
  await LostFoundItem.deleteMany({});
  await Room.deleteMany({});
  await TimetableEntry.deleteMany({});
  await RoomBooking.deleteMany({});
  await Poll.deleteMany({});
  await Vote.deleteMany({});

  // 1. Create Core Users (Admins, Students, CRs, Teachers)
  const userData = [
    // Admin
    { name: 'Campus Admin', email: 'admin@nie.ac.in', password: 'admin123', role: 'admin', usn: 'ADMIN001', department: 'Admin' },
    
    // Students (CSE-5A)
    { name: 'Saaim Khan', email: '2024cs_saaimkhan_c@nie.ac.in', password: 'password123', role: 'student', usn: '4NI24CS180', department: 'CSE', classKey: 'CSE-5A' },
    { name: 'Shivam Kumar', email: '2024cs_shivamkumar_c@nie.ac.in', password: 'password123', role: 'student', usn: '4NI24CS199', department: 'CSE', classKey: 'CSE-5A' },
    { name: 'Shreyas Shanbhogue', email: '2024cs_shreaysshanbhogueb_c@nie.ac.in', password: 'password123', role: 'student', usn: '4NI24CS206', department: 'CSE', classKey: 'CSE-5A' },
    
    // Class Representatives (CRs) for 5th Sem
    { name: 'CR CSE-5A', email: 'cr_cse5a@nie.ac.in', password: 'password123', role: 'cr', usn: '4NI22CS001', department: 'CSE', classKey: 'CSE-5A' },
    { name: 'CR CSE-5B', email: 'cr_cse5b@nie.ac.in', password: 'password123', role: 'cr', usn: '4NI22CS002', department: 'CSE', classKey: 'CSE-5B' },
    { name: 'CR CSE-5C', email: 'cr_cse5c@nie.ac.in', password: 'password123', role: 'cr', usn: '4NI22CS003', department: 'CSE', classKey: 'CSE-5C' },
    { name: 'CR CSE-5D', email: 'cr_cse5d@nie.ac.in', password: 'password123', role: 'cr', usn: '4NI22CS004', department: 'CSE', classKey: 'CSE-5D' },
    { name: 'CR AIML-5A', email: 'cr_aiml5a@nie.ac.in', password: 'password123', role: 'cr', usn: '4NI22AI001', department: 'AIML', classKey: 'AIML-5A' },
    { name: 'CR AIML-5B', email: 'cr_aiml5b@nie.ac.in', password: 'password123', role: 'cr', usn: '4NI22AI002', department: 'AIML', classKey: 'AIML-5B' },

    // Faculty
    { name: 'Dr. C Vidyaraj', email: 'cvidyaraj@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Dr. Shabana Sulthana', email: 'shabanasulthana@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Mrs. Usha K Patil', email: 'ushakpatil@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Mrs. Kavya M', email: 'kavyam@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Dr. B R Vatsala', email: 'brvatsala@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Dr. Narender', email: 'narender@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Ms. Spoorthi B N', email: 'spoorthibn@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Mr. Karthik Manguli', email: 'karthikmanguli@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Ms. Divyashree R', email: 'divyashreer@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Dr. Rashmi M R', email: 'rashmimr@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Mr. Mahesha A M', email: 'mahesham@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Mrs. Divyashree M S', email: 'divyashreems@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Ms. Bhuvana S', email: 'bhuvanas@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Mr. Sumanth C M', email: 'sumanthcm@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Dr. B M Nandini', email: 'bmnandini@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Ms. Spandana T', email: 'spandanat@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Dr. Annapurna V K', email: 'annapurnavk@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Dr. Anitha R', email: 'anithar@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Mr. Balaji V', email: 'balajiv@nie.ac.in', password: 'password123', role: 'teacher', department: 'AIML' },
    { name: 'Ms. Nanditha V', email: 'nandithav@nie.ac.in', password: 'password123', role: 'teacher', department: 'AIML' },
    { name: 'Mr. Nishanth R', email: 'nishanthr@nie.ac.in', password: 'password123', role: 'teacher', department: 'AIML' },
    { name: 'Dr. Naveen Pagad', email: 'naveenpagad@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
    { name: 'Mrs. Veena Mohan', email: 'veenamohan@nie.ac.in', password: 'password123', role: 'teacher', department: 'CSE' },
  ];

  const userMap = {};
  for (const u of userData) {
    const created = await User.create({ ...u, isVerified: true });
    userMap[u.name] = created;
    userMap[u.email] = created;
  }
  console.log(`Created ${Object.keys(userMap).length / 2} users.`);

  // 2. Seed Rooms across the 3 Campus Buildings:
  // - Ramanujacharya Bhavana (RB): All Classrooms (Ground, 1st, 2nd, 3rd Floor)
  // - Shankaracharya Bhavan (SB): Auditorium (Ground Floor) + All Labs (1st, 2nd, 3rd Floor)
  // - Madhwacharya Bhavana (MB): Ground Floor Classrooms (MB-01 to MB-05)
  const roomDefs = [
    // =========================================================
    // 1. Ramanujacharya Bhavana (RB) — Classrooms & Labs
    // =========================================================
    // Underground / Basement Floor (Floor -1): Chemistry Lab
    { name: 'Chemistry Lab', building: 'Ramanujacharya Bhavana (RB)', floor: -1, type: 'lab' },

    // Ground Floor (Floor 0)
    { name: '101', building: 'Ramanujacharya Bhavana (RB)', floor: 0, type: 'class' },
    { name: '106', building: 'Ramanujacharya Bhavana (RB)', floor: 0, type: 'class' },
    { name: '107', building: 'Ramanujacharya Bhavana (RB)', floor: 0, type: 'class' },
    { name: '108', building: 'Ramanujacharya Bhavana (RB)', floor: 0, type: 'class' },
    { name: '109', building: 'Ramanujacharya Bhavana (RB)', floor: 0, type: 'class' },

    // 1st Floor (Floor 1): 201 to 209 + Physics Lab
    ...Array.from({ length: 9 }, (_, i) => ({
      name: `${201 + i}`,
      building: 'Ramanujacharya Bhavana (RB)',
      floor: 1,
      type: 'class',
    })),
    { name: 'Physics Lab', building: 'Ramanujacharya Bhavana (RB)', floor: 1, type: 'lab' },

    // 2nd Floor (Floor 2): 301 to 310
    ...Array.from({ length: 10 }, (_, i) => ({
      name: `${301 + i}`,
      building: 'Ramanujacharya Bhavana (RB)',
      floor: 2,
      type: 'class',
    })),

    // 3rd Floor (Floor 3): 401 to 410
    ...Array.from({ length: 10 }, (_, i) => ({
      name: `${401 + i}`,
      building: 'Ramanujacharya Bhavana (RB)',
      floor: 3,
      type: 'class',
    })),

    // =========================================================
    // 2. Shankaracharya Bhavan (SB) — Auditorium & Labs Only
    // =========================================================
    // Ground Floor (Floor 0): Auditorium (Admin-Only Booking)
    { name: 'Auditorium', building: 'Shankaracharya Bhavan (SB)', floor: 0, type: 'auditorium' },

    // 1st Floor (Floor 1): AIML Labs 1-4 and MCA Labs 1-3
    ...Array.from({ length: 4 }, (_, i) => ({
      name: `AIML Lab ${i + 1}`,
      building: 'Shankaracharya Bhavan (SB)',
      floor: 1,
      type: 'lab',
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      name: `MCA Lab ${i + 1}`,
      building: 'Shankaracharya Bhavan (SB)',
      floor: 1,
      type: 'lab',
    })),

    // 2nd Floor (Floor 2): CS Labs 1-8
    ...Array.from({ length: 8 }, (_, i) => ({
      name: `CS Lab ${i + 1}`,
      building: 'Shankaracharya Bhavan (SB)',
      floor: 2,
      type: 'lab',
    })),

    // 3rd Floor (Floor 3): IS Labs 1-8
    ...Array.from({ length: 8 }, (_, i) => ({
      name: `IS Lab ${i + 1}`,
      building: 'Shankaracharya Bhavan (SB)',
      floor: 3,
      type: 'lab',
    })),

    // =========================================================
    // 3. Madhwacharya Bhavana (MB) — Ground Floor Classes & IDT Lab
    // =========================================================
    // Ground Floor (Floor 0): MB-01 to MB-05 + IDT Lab
    ...Array.from({ length: 5 }, (_, i) => ({
      name: `MB-0${i + 1}`,
      building: 'Madhwacharya Bhavana (MB)',
      floor: 0,
      type: 'class',
    })),
    { name: 'IDT Lab', building: 'Madhwacharya Bhavana (MB)', floor: 0, type: 'lab' },
  ];

  const roomMap = {};
  for (const r of roomDefs) {
    const created = await Room.create(r);
    roomMap[r.name] = created;
    // Map alternate formats for timetable lookups (e.g. "CS Lab-1" <-> "CS Lab 1")
    if (r.name.includes('Lab ')) {
      roomMap[r.name.replace('Lab ', 'Lab-')] = created;
    }
    if (r.name.includes('Lab-')) {
      roomMap[r.name.replace('Lab-', 'Lab ')] = created;
    }
    if (r.name === 'Chemistry Lab') {
      roomMap['CHE Lab'] = created;
      roomMap['CHE LAB'] = created;
      roomMap['CHE-Lab'] = created;
      roomMap['CHE LAB-1'] = created;
      roomMap['CHE LAB-2'] = created;
      roomMap['Chemistry Lab 1'] = created;
      roomMap['Chemistry Lab 2'] = created;
    }
    if (r.name === 'Physics Lab') {
      roomMap['PHY Lab'] = created;
      roomMap['PHY LAB'] = created;
      roomMap['PHY-Lab'] = created;
      roomMap['PHY LAB-1'] = created;
      roomMap['PHY LAB-2'] = created;
      roomMap['Physics Lab 1'] = created;
      roomMap['Physics Lab 2'] = created;
    }
    if (r.name === 'IDT Lab') {
      roomMap['IDT LAB'] = created;
      roomMap['IDT-Lab'] = created;
    }
    if (r.name.startsWith('MB-0')) {
      const num = r.name.slice(-1);
      roomMap[`MB 0${num}`] = created;
      roomMap[`MB-0${num}`] = created;
      roomMap[`MB0${num}`] = created;
    }
  }
  console.log(`Created ${roomDefs.length} rooms across RB, SB, and MB.`);

  // 3. Timetable Data (5th Sem CSE & AIML)
  const timetable = [
    // -------------------------------------------------------------
    // SECTION A (Room 101, classKey: "CSE-5A")
    // -------------------------------------------------------------
    // Mon
    { room: roomMap['101']._id, day: 'Monday', start: '09:00', end: '10:00', subject: 'FSD', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Monday', start: '10:00', end: '11:00', subject: 'ATC', teacherId: userMap['Mrs. Usha K Patil']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Monday', start: '11:30', end: '12:30', subject: 'CN', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Monday', start: '12:30', end: '13:30', subject: 'SEPM', teacherId: userMap['Dr. C Vidyaraj']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Monday', start: '14:30', end: '16:30', subject: 'Project Progress Review', teacherId: userMap['Dr. Naveen Pagad']._id, classKey: 'CSE-5A', semester: '5th' },
    // Tue
    { room: roomMap['101']._id, day: 'Tuesday', start: '09:00', end: '10:00', subject: 'SEPM', teacherId: userMap['Dr. C Vidyaraj']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Tuesday', start: '10:00', end: '11:00', subject: 'AI', teacherId: userMap['Dr. B R Vatsala']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Tuesday', start: '14:30', end: '16:30', subject: 'Proctor Interaction', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5A', semester: '5th' },
    // Wed
    { room: roomMap['101']._id, day: 'Wednesday', start: '11:30', end: '12:30', subject: 'CN', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Wednesday', start: '12:30', end: '13:30', subject: 'SEPM', teacherId: userMap['Dr. C Vidyaraj']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Wednesday', start: '14:30', end: '15:30', subject: 'ATC', teacherId: userMap['Mrs. Usha K Patil']._id, classKey: 'CSE-5A', semester: '5th' },
    // Thu
    { room: roomMap['101']._id, day: 'Thursday', start: '09:00', end: '10:00', subject: 'FSD', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Thursday', start: '10:00', end: '11:00', subject: 'AI', teacherId: userMap['Dr. B R Vatsala']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Thursday', start: '11:30', end: '12:30', subject: 'RM', teacherId: userMap['Dr. C Vidyaraj']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Thursday', start: '12:30', end: '13:30', subject: 'CN', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Thursday', start: '14:30', end: '16:30', subject: 'ATC Tutorial A', teacherId: userMap['Mrs. Usha K Patil']._id, classKey: 'CSE-5A', semester: '5th' },
    // Fri
    { room: roomMap['101']._id, day: 'Friday', start: '09:00', end: '10:00', subject: 'RM', teacherId: userMap['Dr. C Vidyaraj']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Friday', start: '10:00', end: '11:00', subject: 'FSD', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Friday', start: '11:30', end: '12:30', subject: 'ATC', teacherId: userMap['Mrs. Usha K Patil']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['101']._id, day: 'Friday', start: '12:30', end: '13:30', subject: 'AI', teacherId: userMap['Dr. B R Vatsala']._id, classKey: 'CSE-5A', semester: '5th' },

    // -------------------------------------------------------------
    // SECTION B (Room 107, classKey: "CSE-5B")
    // -------------------------------------------------------------
    // Mon
    { room: roomMap['107']._id, day: 'Monday', start: '11:30', end: '12:30', subject: 'FSD', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Monday', start: '12:30', end: '13:30', subject: 'SEPM', teacherId: userMap['Ms. Spoorthi B N']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Monday', start: '14:30', end: '16:30', subject: 'ATC Tutorial', teacherId: userMap['Mr. Karthik Manguli']._id, classKey: 'CSE-5B', semester: '5th' },
    // Tue
    { room: roomMap['107']._id, day: 'Tuesday', start: '09:00', end: '10:00', subject: 'FSD', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Tuesday', start: '10:00', end: '11:00', subject: 'AI', teacherId: userMap['Dr. Rashmi M R']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Tuesday', start: '11:30', end: '12:30', subject: 'ATC', teacherId: userMap['Mr. Karthik Manguli']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Tuesday', start: '12:30', end: '13:30', subject: 'CN', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5B', semester: '5th' },
    // Wed
    { room: roomMap['107']._id, day: 'Wednesday', start: '09:00', end: '10:00', subject: 'SEPM', teacherId: userMap['Ms. Spoorthi B N']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Wednesday', start: '10:00', end: '11:00', subject: 'ATC', teacherId: userMap['Mr. Karthik Manguli']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Wednesday', start: '14:30', end: '16:30', subject: 'Project Progress Review', teacherId: userMap['Dr. Naveen Pagad']._id, classKey: 'CSE-5B', semester: '5th' },
    // Thu
    { room: roomMap['107']._id, day: 'Thursday', start: '09:00', end: '10:00', subject: 'CN', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Thursday', start: '10:00', end: '11:00', subject: 'AI', teacherId: userMap['Dr. Rashmi M R']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Thursday', start: '11:30', end: '12:30', subject: 'RM', teacherId: userMap['Mr. Mahesha A M']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Thursday', start: '12:30', end: '13:30', subject: 'ATC', teacherId: userMap['Mr. Karthik Manguli']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Thursday', start: '14:30', end: '15:30', subject: 'SEPM', teacherId: userMap['Ms. Spoorthi B N']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Thursday', start: '15:30', end: '16:30', subject: 'Proctor Interaction', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5B', semester: '5th' },
    // Fri
    { room: roomMap['107']._id, day: 'Friday', start: '09:00', end: '10:00', subject: 'RM', teacherId: userMap['Mr. Mahesha A M']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Friday', start: '10:00', end: '11:00', subject: 'FSD', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Friday', start: '11:30', end: '12:30', subject: 'CN', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['107']._id, day: 'Friday', start: '12:30', end: '13:30', subject: 'AI', teacherId: userMap['Dr. Rashmi M R']._id, classKey: 'CSE-5B', semester: '5th' },

    // -------------------------------------------------------------
    // SECTION C (Room 108, classKey: "CSE-5C")
    // -------------------------------------------------------------
    // Mon
    { room: roomMap['108']._id, day: 'Monday', start: '09:00', end: '10:00', subject: 'CN', teacherId: userMap['Ms. Bhuvana S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Monday', start: '10:00', end: '11:00', subject: 'ATC', teacherId: userMap['Mr. Sumanth C M']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Monday', start: '14:30', end: '16:30', subject: 'Project Progress Review', teacherId: userMap['Dr. Naveen Pagad']._id, classKey: 'CSE-5C', semester: '5th' },
    // Tue
    { room: roomMap['108']._id, day: 'Tuesday', start: '11:30', end: '12:30', subject: 'RM', teacherId: userMap['Ms. Spandana T']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Tuesday', start: '12:30', end: '13:30', subject: 'AI', teacherId: userMap['Dr. B R Vatsala']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Tuesday', start: '14:30', end: '15:30', subject: 'FSD', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5C', semester: '5th' },
    // Wed
    { room: roomMap['108']._id, day: 'Wednesday', start: '09:00', end: '10:00', subject: 'SEPM', teacherId: userMap['Mrs. Divyashree M S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Wednesday', start: '10:00', end: '11:00', subject: 'CN', teacherId: userMap['Ms. Bhuvana S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Wednesday', start: '11:30', end: '12:30', subject: 'AI', teacherId: userMap['Dr. B R Vatsala']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Wednesday', start: '12:30', end: '13:30', subject: 'ATC', teacherId: userMap['Mr. Sumanth C M']._id, classKey: 'CSE-5C', semester: '5th' },
    // Thu
    { room: roomMap['108']._id, day: 'Thursday', start: '09:00', end: '10:00', subject: 'ATC', teacherId: userMap['Mr. Sumanth C M']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Thursday', start: '10:00', end: '11:00', subject: 'SEPM', teacherId: userMap['Mrs. Divyashree M S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Thursday', start: '11:30', end: '12:30', subject: 'CN', teacherId: userMap['Ms. Bhuvana S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Thursday', start: '12:30', end: '13:30', subject: 'FSD', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Thursday', start: '14:30', end: '16:30', subject: 'Proctor Interaction', teacherId: userMap['Mrs. Divyashree M S']._id, classKey: 'CSE-5C', semester: '5th' },
    // Fri
    { room: roomMap['108']._id, day: 'Friday', start: '09:00', end: '10:00', subject: 'AI', teacherId: userMap['Dr. B R Vatsala']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Friday', start: '10:00', end: '11:00', subject: 'RM', teacherId: userMap['Ms. Spandana T']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Friday', start: '11:30', end: '12:30', subject: 'SEPM', teacherId: userMap['Mrs. Divyashree M S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Friday', start: '12:30', end: '13:30', subject: 'FSD', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['108']._id, day: 'Friday', start: '14:30', end: '16:30', subject: 'ATC Tutorial C', teacherId: userMap['Mr. Sumanth C M']._id, classKey: 'CSE-5C', semester: '5th' },

    // -------------------------------------------------------------
    // SECTION D (Room 109, classKey: "CSE-5D")
    // -------------------------------------------------------------
    // Mon
    { room: roomMap['109']._id, day: 'Monday', start: '09:00', end: '10:00', subject: 'SEPM', teacherId: userMap['Mrs. Divyashree M S']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Monday', start: '10:00', end: '11:00', subject: 'RM', teacherId: userMap['Mr. Mahesha A M']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Monday', start: '11:30', end: '12:30', subject: 'ATC', teacherId: userMap['Mr. Karthik Manguli']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Monday', start: '12:30', end: '13:30', subject: 'CN', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'CSE-5D', semester: '5th' },
    // Tue
    { room: roomMap['109']._id, day: 'Tuesday', start: '09:00', end: '10:00', subject: 'CN', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Tuesday', start: '10:00', end: '11:00', subject: 'SEPM', teacherId: userMap['Mrs. Divyashree M S']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Tuesday', start: '11:30', end: '12:30', subject: 'FSD', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Tuesday', start: '12:30', end: '13:30', subject: 'AI', teacherId: userMap['Dr. Rashmi M R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Tuesday', start: '14:30', end: '16:30', subject: 'ATC Tutorial D', teacherId: userMap['Mr. Karthik Manguli']._id, classKey: 'CSE-5D', semester: '5th' },
    // Wed
    { room: roomMap['109']._id, day: 'Wednesday', start: '09:00', end: '10:00', subject: 'RM', teacherId: userMap['Mr. Mahesha A M']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Wednesday', start: '10:00', end: '11:00', subject: 'FSD', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Wednesday', start: '11:30', end: '12:30', subject: 'AI', teacherId: userMap['Dr. Rashmi M R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Wednesday', start: '12:30', end: '13:30', subject: 'SEPM', teacherId: userMap['Mrs. Divyashree M S']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Wednesday', start: '14:30', end: '15:30', subject: 'ATC', teacherId: userMap['Mr. Karthik Manguli']._id, classKey: 'CSE-5D', semester: '5th' },
    // Thu
    { room: roomMap['109']._id, day: 'Thursday', start: '11:30', end: '12:30', subject: 'CN', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Thursday', start: '12:30', end: '13:30', subject: 'FSD', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Thursday', start: '14:30', end: '16:30', subject: 'Proctor Interaction', teacherId: userMap['Mrs. Divyashree M S']._id, classKey: 'CSE-5D', semester: '5th' },
    // Fri
    { room: roomMap['109']._id, day: 'Friday', start: '09:00', end: '10:00', subject: 'AI', teacherId: userMap['Dr. Rashmi M R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Friday', start: '10:00', end: '11:00', subject: 'ATC', teacherId: userMap['Mr. Karthik Manguli']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['109']._id, day: 'Friday', start: '14:30', end: '16:30', subject: 'Project Progress Review', teacherId: userMap['Dr. Naveen Pagad']._id, classKey: 'CSE-5D', semester: '5th' },

    // -------------------------------------------------------------
    // SECTION E (Room MB 01, classKey: "AIML-5A")
    // -------------------------------------------------------------
    // Mon
    { room: roomMap['MB 01']._id, day: 'Monday', start: '09:00', end: '10:00', subject: 'ML', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Monday', start: '10:00', end: '11:00', subject: 'SEPM', teacherId: userMap['Dr. C Vidyaraj']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Monday', start: '11:30', end: '12:30', subject: 'RM', teacherId: userMap['Mr. Mahesha A M']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Monday', start: '12:30', end: '13:30', subject: 'ATC', teacherId: userMap['Dr. Anitha R']._id, classKey: 'AIML-5A', semester: '5th' },
    // Tue
    { room: roomMap['MB 01']._id, day: 'Tuesday', start: '09:00', end: '10:00', subject: 'RM', teacherId: userMap['Mr. Mahesha A M']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Tuesday', start: '10:00', end: '11:00', subject: 'CV', teacherId: userMap['Ms. Nanditha V']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Tuesday', start: '11:30', end: '12:30', subject: 'ATC', teacherId: userMap['Dr. Anitha R']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Tuesday', start: '12:30', end: '13:30', subject: 'ML', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Tuesday', start: '14:30', end: '15:30', subject: 'SEPM', teacherId: userMap['Dr. C Vidyaraj']._id, classKey: 'AIML-5A', semester: '5th' },
    // Wed
    { room: roomMap['MB 01']._id, day: 'Wednesday', start: '09:00', end: '10:00', subject: 'CN', teacherId: userMap['Mr. Nishanth R']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Wednesday', start: '10:00', end: '11:00', subject: 'SEPM', teacherId: userMap['Dr. C Vidyaraj']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Wednesday', start: '11:30', end: '12:30', subject: 'ATC', teacherId: userMap['Dr. Anitha R']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Wednesday', start: '12:30', end: '13:30', subject: 'ML', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Wednesday', start: '14:30', end: '16:30', subject: 'Project Progress Review', teacherId: userMap['Dr. Naveen Pagad']._id, classKey: 'AIML-5A', semester: '5th' },
    // Thu
    { room: roomMap['MB 01']._id, day: 'Thursday', start: '09:00', end: '10:00', subject: 'CV', teacherId: userMap['Ms. Nanditha V']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Thursday', start: '10:00', end: '11:00', subject: 'CN', teacherId: userMap['Mr. Nishanth R']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Thursday', start: '14:30', end: '16:30', subject: 'ATC Tutorial E', teacherId: userMap['Dr. Anitha R']._id, classKey: 'AIML-5A', semester: '5th' },
    // Fri
    { room: roomMap['MB 01']._id, day: 'Friday', start: '11:30', end: '12:30', subject: 'CN', teacherId: userMap['Mr. Nishanth R']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Friday', start: '12:30', end: '13:30', subject: 'CV', teacherId: userMap['Ms. Nanditha V']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['MB 01']._id, day: 'Friday', start: '14:30', end: '16:30', subject: 'Proctor Interaction', teacherId: userMap['Dr. Anitha R']._id, classKey: 'AIML-5A', semester: '5th' },

    // -------------------------------------------------------------
    // SECTION F (Room MB 03, classKey: "AIML-5B")
    // -------------------------------------------------------------
    // Mon
    { room: roomMap['MB 03']._id, day: 'Monday', start: '09:00', end: '10:00', subject: 'CN', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Monday', start: '10:00', end: '11:00', subject: 'SEPM', teacherId: userMap['Ms. Spoorthi B N']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Monday', start: '14:30', end: '16:30', subject: 'Project Progress Review', teacherId: userMap['Dr. Naveen Pagad']._id, classKey: 'AIML-5B', semester: '5th' },
    // Tue
    { room: roomMap['MB 03']._id, day: 'Tuesday', start: '09:00', end: '10:00', subject: 'RM', teacherId: userMap['Mr. Mahesha A M']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Tuesday', start: '10:00', end: '11:00', subject: 'ML', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Tuesday', start: '11:30', end: '12:30', subject: 'ATC', teacherId: userMap['Mrs. Usha K Patil']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Tuesday', start: '12:30', end: '13:30', subject: 'CV', teacherId: userMap['Ms. Nanditha V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Tuesday', start: '14:30', end: '16:30', subject: 'ATC Tutorial F', teacherId: userMap['Mrs. Usha K Patil']._id, classKey: 'AIML-5B', semester: '5th' },
    // Wed
    { room: roomMap['MB 03']._id, day: 'Wednesday', start: '11:30', end: '12:30', subject: 'CV', teacherId: userMap['Ms. Nanditha V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Wednesday', start: '12:30', end: '13:30', subject: 'CN', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Wednesday', start: '14:30', end: '16:30', subject: 'Proctor Interaction', teacherId: userMap['Ms. Spoorthi B N']._id, classKey: 'AIML-5B', semester: '5th' },
    // Thu
    { room: roomMap['MB 03']._id, day: 'Thursday', start: '09:00', end: '10:00', subject: 'ML', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Thursday', start: '10:00', end: '11:00', subject: 'ATC', teacherId: userMap['Mrs. Usha K Patil']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Thursday', start: '11:30', end: '12:30', subject: 'RM', teacherId: userMap['Mr. Mahesha A M']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Thursday', start: '12:30', end: '13:30', subject: 'SEPM', teacherId: userMap['Ms. Spoorthi B N']._id, classKey: 'AIML-5B', semester: '5th' },
    // Fri
    { room: roomMap['MB 03']._id, day: 'Friday', start: '09:00', end: '10:00', subject: 'CV', teacherId: userMap['Ms. Nanditha V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Friday', start: '10:00', end: '11:00', subject: 'ATC', teacherId: userMap['Mrs. Usha K Patil']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Friday', start: '11:30', end: '12:30', subject: 'ML', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Friday', start: '12:30', end: '13:30', subject: 'CN', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['MB 03']._id, day: 'Friday', start: '14:30', end: '15:30', subject: 'SEPM', teacherId: userMap['Ms. Spoorthi B N']._id, classKey: 'AIML-5B', semester: '5th' },

    // -------------------------------------------------------------
    // LABS (CS Lab-1, CS Lab-8, AIML Lab-1, AIML Lab-3)
    // -------------------------------------------------------------
    // CS Lab-1 (CN Lab for CSE)
    { room: roomMap['CS Lab-1']._id, day: 'Monday', start: '09:00', end: '11:00', subject: 'B1 CN Lab', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Monday', start: '11:30', end: '13:30', subject: 'C1 CN Lab', teacherId: userMap['Ms. Bhuvana S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Monday', start: '14:30', end: '16:30', subject: 'D3 CN Lab', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Tuesday', start: '09:00', end: '11:00', subject: 'C2 CN Lab', teacherId: userMap['Ms. Bhuvana S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Tuesday', start: '11:30', end: '13:30', subject: 'A2 CN Lab', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Tuesday', start: '14:30', end: '16:30', subject: 'B2 CN Lab', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Wednesday', start: '09:00', end: '11:00', subject: 'A3 CN Lab', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Wednesday', start: '11:30', end: '13:30', subject: 'B3 CN Lab', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Wednesday', start: '14:30', end: '16:30', subject: 'C3 CN Lab', teacherId: userMap['Ms. Bhuvana S']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Thursday', start: '09:00', end: '11:00', subject: 'D1 CN Lab', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Thursday', start: '11:30', end: '13:30', subject: 'E1 CN Lab', teacherId: userMap['Mr. Nishanth R']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Friday', start: '09:00', end: '11:00', subject: 'E2 CN Lab', teacherId: userMap['Mr. Nishanth R']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Friday', start: '11:30', end: '13:30', subject: 'D2 CN Lab', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['CS Lab-1']._id, day: 'Friday', start: '14:30', end: '16:30', subject: 'A1 CN Lab', teacherId: userMap['Dr. Shabana Sulthana']._id, classKey: 'CSE-5A', semester: '5th' },

    // AIML Lab-1 (FSD Lab for CSE)
    { room: roomMap['AIML Lab-1']._id, day: 'Monday', start: '09:00', end: '11:00', subject: 'B2 FSD Lab', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Monday', start: '11:30', end: '13:30', subject: 'C2 FSD Lab', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Monday', start: '14:30', end: '16:30', subject: 'D1 FSD Lab', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Tuesday', start: '09:00', end: '11:00', subject: 'C3 FSD Lab', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Tuesday', start: '11:30', end: '13:30', subject: 'A3 FSD Lab', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Tuesday', start: '14:30', end: '16:30', subject: 'B3 FSD Lab', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Wednesday', start: '09:00', end: '11:00', subject: 'A1 FSD Lab', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5A', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Wednesday', start: '11:30', end: '13:30', subject: 'B1 FSD Lab', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5B', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Wednesday', start: '14:30', end: '16:30', subject: 'C1 FSD Lab', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5C', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Thursday', start: '09:00', end: '11:00', subject: 'D2 FSD Lab', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Friday', start: '11:30', end: '13:30', subject: 'D3 FSD Lab', teacherId: userMap['Ms. Divyashree R']._id, classKey: 'CSE-5D', semester: '5th' },
    { room: roomMap['AIML Lab-1']._id, day: 'Friday', start: '14:30', end: '16:30', subject: 'A2 FSD Lab', teacherId: userMap['Mrs. Kavya M']._id, classKey: 'CSE-5A', semester: '5th' },

    // CS Lab-8 (CN Lab for AIML)
    { room: roomMap['CS Lab-8']._id, day: 'Monday', start: '11:30', end: '13:30', subject: 'F2 CN Lab', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['CS Lab-8']._id, day: 'Monday', start: '14:30', end: '16:30', subject: 'E3 CN Lab', teacherId: userMap['Mr. Nishanth R']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['CS Lab-8']._id, day: 'Wednesday', start: '09:00', end: '11:00', subject: 'F1 CN Lab', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['CS Lab-8']._id, day: 'Thursday', start: '14:30', end: '16:30', subject: 'F3 CN Lab', teacherId: userMap['Dr. Annapurna V K']._id, classKey: 'AIML-5B', semester: '5th' },

    // AIML Lab-3 (ML Lab for AIML)
    { room: roomMap['AIML Lab-3']._id, day: 'Monday', start: '11:30', end: '13:30', subject: 'F1 ML Lab', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['AIML Lab-3']._id, day: 'Monday', start: '14:30', end: '16:30', subject: 'E1 ML Lab', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['AIML Lab-3']._id, day: 'Wednesday', start: '09:00', end: '11:00', subject: 'F3 ML Lab', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['AIML Lab-3']._id, day: 'Thursday', start: '11:30', end: '13:30', subject: 'E2 ML Lab', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5A', semester: '5th' },
    { room: roomMap['AIML Lab-3']._id, day: 'Thursday', start: '14:30', end: '16:30', subject: 'F2 ML Lab', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5B', semester: '5th' },
    { room: roomMap['AIML Lab-3']._id, day: 'Friday', start: '09:00', end: '11:00', subject: 'E3 ML Lab', teacherId: userMap['Mr. Balaji V']._id, classKey: 'AIML-5A', semester: '5th' },
  ];

  await TimetableEntry.insertMany(timetable);
  console.log(`Inserted ${timetable.length} Timetable entries for 5th Sem CSE & AIML.`);

  // 3b. Import 1st and 3rd Sem Timetables from CSV
  const parseAndInsertCsvTimetable = async (csvFileName) => {
    const filePath = path.resolve(__dirname, '../../timetables', csvFileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return 0;
    }
    const content = fs.readFileSync(filePath, 'utf8').trim();
    const rows = content.split('\n').slice(1);
    const docs = [];
    for (const row of rows) {
      if (!row.trim()) continue;
      const parts = row.split(',').map(s => s.trim());
      if (parts.length < 8) continue;
      const [roomStr, day, start, end, subject, teacherStr, classKey, semester] = parts;
      
      let roomId = null;
      if (roomStr) {
        if (roomMap[roomStr]) {
          roomId = roomMap[roomStr]._id;
        } else {
          const normalized = roomStr.replace(/\s+/g, ' ');
          if (roomMap[normalized]) {
            roomId = roomMap[normalized]._id;
          }
        }
      }

      let teacherId = null;
      if (teacherStr && userMap[teacherStr]) {
        teacherId = userMap[teacherStr]._id;
      }

      docs.push({
        room: roomId,
        day,
        start,
        end,
        subject,
        teacherId,
        classKey,
        semester
      });
    }

    if (docs.length > 0) {
      await TimetableEntry.insertMany(docs);
      console.log(`Imported ${docs.length} entries from ${csvFileName}`);
    }
    return docs.length;
  };

  await parseAndInsertCsvTimetable('1st_sem_timetable_complete.csv');
  await parseAndInsertCsvTimetable('3rd_sem_timetable_complete.csv');

  // 4. Seed Interactive Polls (CR Election + Campus Flash Poll)
  const adminUser = userMap['Campus Admin'];
  const saaim = userMap['Saaim Khan'];
  const shivam = userMap['Shivam Kumar'];
  const shreyas = userMap['Shreyas Shanbhogue'];

  const electionExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 3 days
  const flashExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

  const pollsToInsert = [
    {
      title: "5th Sem CSE-5A Class Representative (CR) Election",
      description: "Official section-wide election for CSE-5A student leadership. Restricted to verified CSE-5A cadets.",
      type: "election",
      targetScope: "class",
      classKey: "CSE-5A",
      department: "CSE",
      createdBy: adminUser._id,
      expiresAt: electionExpiry,
      status: "active",
      isAnonymous: true,
      options: [
        { text: "Saaim Khan (4NI24CS180)", candidateId: saaim._id, votesCount: 0 },
        { text: "Shivam Kumar (4NI24CS199)", candidateId: shivam._id, votesCount: 0 },
        { text: "Shreyas Shanbhogue (4NI24CS206)", candidateId: shreyas._id, votesCount: 0 },
      ],
      totalVotes: 0,
    },
    {
      title: "Saturday Mysore Hackfest — Pick the Night Fuel Food Drop!",
      description: "Campus-wide student vote to decide the midnight canteen delivery sponsored for hackathon hackers.",
      type: "flash",
      targetScope: "campus",
      department: "",
      classKey: "",
      createdBy: adminUser._id,
      expiresAt: flashExpiry,
      status: "active",
      isAnonymous: true,
      options: [
        { text: "Spicy Mysore Masala Dosa + Filter Coffee ☕", votesCount: 0 },
        { text: "Paneer Tikka Rolls + Iced Caramel Latte 🌯", votesCount: 0 },
        { text: "Crispy Cheese Vada Pav + Cold Bournvita ⚡", votesCount: 0 },
      ],
      totalVotes: 0,
    },
  ];

  await Poll.insertMany(pollsToInsert);
  console.log(`Seeded ${pollsToInsert.length} Interactive Polls & CR Elections.`);

  console.log('\n--- SEED COMPLETE ---');
  console.log('Total Rooms:', Object.keys(roomMap).length);
  const totalEntries = await TimetableEntry.countDocuments();
  console.log('Total Timetable Entries:', totalEntries);
  console.log('Total Polls:', pollsToInsert.length);
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
