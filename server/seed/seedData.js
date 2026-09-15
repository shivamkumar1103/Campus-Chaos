require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const LostFoundItem = require('../models/LostFoundItem');

const team = [
  { name: 'Campus Admin', email: 'admin@nie.ac.in', password: 'admin123', role: 'admin', usn: 'ADMIN001', department: 'Admin' },
  { name: 'Demo Teacher', email: 'teacher@nie.ac.in', password: 'password123', role: 'teacher', usn: 'TCH001', department: 'CSE' },
  { name: 'Saaim Khan', email: '2024cs_saaimkhan_c@nie.ac.in', password: 'password123', role: 'student', usn: '4NI24CS180', department: 'CSE' },
  { name: 'Shivam Kumar', email: '2024cs_shivamkumar_c@nie.ac.in', password: 'password123', role: 'student', usn: '4NI24CS199', department: 'CSE' },
  { name: 'Shariq', email: '2024cs_shariq_c@nie.ac.in', password: 'password123', role: 'cr', usn: '4NI24CS191', department: 'CSE' },
  { name: 'Shreyas Shanbhogue', email: '2024cs_shreaysshanbhogueb_c@nie.ac.in', password: 'password123', role: 'student', usn: '4NI24CS206', department: 'CSE' },
];

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('Set MONGO_URI in .env first');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Seeding...');

  await User.deleteMany({});
  await LostFoundItem.deleteMany({});

  const users = [];
  for (const u of team) {
    users.push(await User.create(u));
  }

  await LostFoundItem.create([
    {
      title: 'Lost HP Laptop Charger in Room 302',
      description: 'Black HP 65W charger left near front bench after DBMS lab.',
      type: 'lost',
      category: 'electronics',
      location: 'Room 302',
      locationFound: 'Room 302',
      reportedBy: users[0]._id,
    },
    {
      title: 'Found: Blue Scientific Calculator',
      description: 'Found Casio fx-991ES in Lab 4. Claim with proof.',
      type: 'found',
      category: 'electronics',
      location: 'Lab 4',
      locationFound: 'Lab 4',
      reportedBy: users[2]._id,
    },
  ]);

  console.log('Seed done. Users:', users.map((u) => u.email).join(', '));
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
