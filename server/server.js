require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initChatSocket } = require('./sockets/chatSocket');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const messageRoutes = require('./routes/messageRoutes');
const roomRoutes = require('./routes/roomRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pollRoutes = require('./routes/pollRoutes');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
app.set('trust proxy', 1); // Trust reverse proxy (Render, Railway, Heroku) for secure cookies

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim().replace(/\/+$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = clientUrls.includes(origin);
    const isVercelDomain = origin.endsWith('.vercel.app');
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    if (isExplicitlyAllowed || isVercelDomain || isLocalhost) {
      return callback(null, true);
    }

    console.warn(`[CORS] Request blocked from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

app.set('io', io);

const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'campus-chaos-server', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/polls', pollRoutes);

// Unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

initChatSocket(io);

connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
