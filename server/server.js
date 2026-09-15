require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initChatSocket } = require('./sockets/chatSocket');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'campus-chaos-server', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/messages', messageRoutes);

initChatSocket(io);

connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
