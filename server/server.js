require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Import Middlewares
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', 1);

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
const parseOrigins = () => {
  const list = [];
  if (process.env.CLIENT_URL) list.push(...process.env.CLIENT_URL.split(','));
  if (process.env.ALLOWED_ORIGINS) list.push(...process.env.ALLOWED_ORIGINS.split(','));
  return list.map(o => o.trim().replace(/\/+$/, '')).filter(Boolean);
};

const explicitOrigins = parseOrigins();

const isOriginAllowed = (origin) => {
  // Allow requests without Origin (e.g. curl, postman, server-side, local health checks)
  if (!origin) return true;

  const cleanOrigin = origin.trim().replace(/\/+$/, '');

  // In development, allow all origins
  if (process.env.NODE_ENV === 'development') return true;

  // Explicit wildcard
  if (explicitOrigins.includes('*')) return true;

  // Match explicitly allowed origins from .env
  if (explicitOrigins.includes(cleanOrigin)) return true;

  // Allow all localhost and 127.0.0.1 ports (Vite 5173, 5174, Next/React 3000, preview 4173, etc.)
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;

  // Allow all Vercel deployment URLs (production and preview branches)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(cleanOrigin)) return true;

  // Allow Render web service URLs
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*onrender\.com$/.test(cleanOrigin)) return true;

  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/dashboard', require('./routes/adminDashboardRoutes'));
app.use('/api/admin/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/admin/leaves', require('./routes/adminLeaveRoutes'));
app.use('/api/admin/reports', require('./routes/reportRoutes'));
app.use('/api/admin/departments', require('./routes/departmentRoutes'));
app.use('/api/admin/holidays', require('./routes/holidayRoutes'));
app.use('/api/admin/settings', require('./routes/settingsRoutes'));

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
