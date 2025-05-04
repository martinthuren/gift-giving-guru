// FULL CODE SNIPPET: server.js (After Debugging Catch-All Route)

const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- Security Imports (add later as needed) ---
// const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');

// Error Handling and Router Imports (Adjusted for debugging)
const AppError = require('./utils/appError'); // Keep this - needed for catch-all
const globalErrorHandler = require('./controllers/errorController'); // Keep this
const authRouter = require('./routes/authRoutes'); // Keep this - we're testing it next
const peopleRouter = require('./routes/peopleRoutes'); // Keep commented out
const giftIdeaRouter = require('./routes/giftIdeaRoutes'); // Keep commented out
const eventRouter = require('./routes/eventRoutes'); // <-- ADD THIS LINE
const userRouter = require('./routes/userRoutes'); // <-- ADD THIS LINE


const app = express();

// --- Middlewares ---
app.use(cors()); // Allow requests from your frontend domain in production

// Set security HTTP headers (basic)
// app.use(helmet());

// Limit requests from same API (basic)
// const limiter = rateLimit({
//  max: 100, // Limit each IP to 100 requests per windowMs
//  windowMs: 60 * 60 * 1000, // 1 hour
//  message: 'Too many requests from this IP, please try again in an hour!'
// });
// app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // Limit body payload

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize());

// Data sanitization against XSS
// app.use(xss());

// --- Routes ---
app.get('/', (req, res) => {
    res.send('Gift Giving Guru API is running!');
});

// Use only the auth router for now
app.use('/api/auth', authRouter);
app.use('/api/people', peopleRouter);       // Keep commented out
app.use('/api/gift-ideas', giftIdeaRouter);  // Keep commented out
app.use('/api/events', eventRouter);       // Keep commented out
app.use('/api/users', userRouter);       // Keep commented out
// --- Handle Unhandled Routes ---
// Use the corrected RegEx version
app.all(/.*/, (req, res, next) => {
   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// --- Global Error Handling Middleware ---
// Must be defined AFTER all other app.use() and routes calls
app.use(globalErrorHandler);


// --- Database Connection ---
const DB = process.env.DATABASE_URI;
mongoose.connect(DB, {
    useNewUrlParser: true, // Deprecated but harmless for now
    useUnifiedTopology: true, // Deprecated but harmless for now
    // useCreateIndex: true, // No longer needed in Mongoose 6+
    // useFindAndModify: false // No longer needed in Mongoose 6+
}).then(() => console.log('DB connection successful!'))
  .catch(err => console.error('DB Connection Error:', err));


// --- Start Server ---
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

// --- Handle Unhandled Rejections ---
process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    // Gracefully close server before exiting
    server.close(() => {
        process.exit(1); // 0 = success, 1 = uncaught exception
    });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
    // No need to process.exit() here, SIGTERM handler should just clean up
  });
});

// Optional log to confirm script reaches the end of initialization phase
console.log("Server script finished initialization phase.");