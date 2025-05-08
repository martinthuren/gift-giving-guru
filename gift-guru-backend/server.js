// FULL CODE SNIPPET: server.js (No Cloudinary - With Security Middleware & CORS Config)

const dotenv = require('dotenv');
dotenv.config(); // Load .env first

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const cloudinary = require('cloudinary').v2; // REMOVED Cloudinary require

// Security Packages
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
//const mongoSanitize = require('express-mongo-sanitize');
//const xss = require('xss-clean');

// Custom Error Handling & Routers
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const authRouter = require('./routes/authRoutes');
const peopleRouter = require('./routes/peopleRoutes');
const giftIdeaRouter = require('./routes/giftIdeaRoutes');
const eventRouter = require('./routes/eventRoutes');
const userRouter = require('./routes/userRoutes');
const giftHistoryRouter = require('./routes/giftHistoryRoutes');

// --- Cloudinary Config REMOVED ---

const app = express();

// --- GLOBAL MIDDLEWARES ---

// Set various security HTTP headers (should be early)
app.use(helmet());

// Configure CORS
const corsOptions = {
   origin: process.env.NODE_ENV === 'production'
       ? process.env.CORS_ORIGIN
       : '*', // Allow all for local development
   optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
console.log(`CORS configured for origin: ${corsOptions.origin}`);


// Limit repeated requests from same IP (apply to /api routes)
const limiter = rateLimit({
    max: 150,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP address, please try again in an hour.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body, limit payload size
app.use(express.json({ limit: '10kb' })); // Keep size limit reasonable

// Data sanitization against NoSQL query injection
//app.use(mongoSanitize());

// Data sanitization against XSS (Cross-Site Scripting) attacks
//app.use(xss());

// --- Routes ---
app.get('/', (req, res) => {
    res.send(`Gift Giving Guru API is running! Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Mount Routers
app.use('/api/auth', authRouter);
app.use('/api/people', peopleRouter);
app.use('/api/gift-ideas', giftIdeaRouter);
app.use('/api/events', eventRouter);
app.use('/api/users', userRouter);
app.use('/api/history', giftHistoryRouter);

// --- Handle Unhandled Routes ---
app.all(/.*/, (req, res, next) => { // <-- USE REGEX /.*/ INSTEAD OF '*'
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// --- Global Error Handling Middleware ---
app.use(globalErrorHandler);


// --- Database Connection ---
const DB = process.env.DATABASE_URI;
if (!DB) {
     console.error("FATAL ERROR: DATABASE_URI is not defined in environment variables.");
     process.exit(1);
}
mongoose.connect(DB, { /* No options needed for Mongoose 6+ */ })
  .then(() => console.log('DB connection successful!'))
  .catch(err => {
       console.error('DB Connection Error:', err.name, err.message);
       // Optionally exit if DB connection fails on startup in production
       // if (process.env.NODE_ENV === 'production') process.exit(1);
  });


// --- Start Server ---
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port} in ${process.env.NODE_ENV || 'development'} mode...`);
});

// --- Handle Unhandled Promise Rejections ---
process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// --- Handle SIGTERM ---
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

console.log("Server script finished initialization phase.");