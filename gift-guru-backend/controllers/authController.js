// FULL CODE SNIPPET: controllers/authController.js (Handles JWT & API Key)

const jwt = require('jsonwebtoken');
const { promisify } = require('util'); // Node built-in utility
const User = require('../models/User'); // Ensure User model path is correct
const AppError = require('../utils/appError'); // Ensure AppError utility exists
const crypto = require('crypto'); // Need crypto for hashing incoming API key

// --- Debug Log (Optional - remove after confirming import works) ---
// console.log('Imported User in authController:', User);

// --- Helper Function to Sign JWT ---
// Used only for standard login/registration
const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// --- Helper Function to Create and Send Token Response ---
// Used only for standard login/registration
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;
    // Also remove API key hash if it exists on the object
    user.apiKeyHash = undefined;

    // Optional: Set cookie
    // const cookieOptions = { ... };
    // res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json({
        status: 'success',
        token, // The JWT token
        data: {
            user,
        },
    });
};

// --- Registration Controller ---
exports.register = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        if (typeof User.create !== 'function') {
             console.error('FATAL: User.create is not a function! Check User model import/export.');
             return next(new AppError('Server configuration error during registration.', 500));
        }

        // Create new user (password hashed via pre-save hook)
        const newUser = await User.create({
            email: email,
            password: password,
        });

        // Log in the user immediately after registration (sends JWT)
        createSendToken(newUser, 201, res);

    } catch (err) {
        if (err.code === 11000) return next(new AppError('Email address already in use.', 400));
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            const message = `Invalid input data. ${errors.join('. ')}`;
            return next(new AppError(message, 400));
        }
        next(err);
    }
};

// --- Login Controller ---
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        // Find user and explicitly include password for comparison
        const user = await User.findOne({ email: email }).select('+password');

        // Check if user exists and password is correct
        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        // Send JWT token response
        createSendToken(user, 200, res);

    } catch (err) {
        next(err);
    }
};

// --- MODIFIED Protect Routes Middleware (Handles JWT & API Key) ---
exports.protect = async (req, res, next) => {
    try {
        // 1) Get token/key from Authorization header
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        // If no token/key provided at all
        if (!token) {
            return next(
                new AppError('Authentication required. Please log in or provide an API key.', 401)
            );
        }

        // 2) Try Verifying as a JWT Token first
        try {
            // Verify the token using the JWT secret
            const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

            // If JWT verification succeeds:
            // 3a) Check if the user associated with the JWT still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                // If user deleted after token was issued
                return next(
                    new AppError('The user belonging to this token no longer exists.', 401)
                );
            }

            // 4a) Optional: Check if user changed password after the token was issued
            // Requires adding 'passwordChangedAt' field and method to User model
            // if (currentUser.changedPasswordAfter(decoded.iat)) {
            //     return next(new AppError('User recently changed password! Please log in again.', 401));
            // }

            // --- ACCESS GRANTED via JWT ---
            req.user = currentUser; // Attach user object to the request
            res.locals.user = currentUser;
            return next(); // Proceed to the next middleware/route handler

        } catch (jwtError) {
            // If JWT verification fails, check if it's a known JWT error (expired, invalid signature)
            // If it's not one of those, it might be an API key or an unexpected error
            if (jwtError.name !== 'JsonWebTokenError' && jwtError.name !== 'TokenExpiredError') {
                // Re-throw unexpected errors during JWT verification
                throw jwtError;
            }

            // --- If JWT failed, attempt to validate as an API Key ---

            // 3b) Hash the incoming token string using SHA256 (same way API keys are stored)
            const incomingApiKeyHash = crypto
                .createHash('sha256')
                .update(token) // Assume 'token' variable holds the raw API key
                .digest('hex');

            // 4b) Find a user whose apiKeyHash matches the hashed incoming key
            // Need to explicitly select the apiKeyHash field as it's normally hidden
            const userFoundByApiKey = await User.findOne({ apiKeyHash: incomingApiKeyHash }).select('+apiKeyHash');

            // If no user is found with this API key hash
            if (!userFoundByApiKey) {
                // It wasn't a valid JWT (expired or invalid) AND it's not a valid API key
                return next(
                    new AppError('Invalid credentials. Your token/API key is either invalid or expired.', 401)
                );
            }

            // --- ACCESS GRANTED via API Key ---
            req.user = userFoundByApiKey; // Attach user object to the request
            res.locals.user = userFoundByApiKey;
            return next(); // Proceed to the next middleware/route handler
        }
    } catch (err) {
        // Catch any unexpected errors from the entire process
        // Ensure a generic error response if something else goes wrong
        next(new AppError('Authentication failed. Please try again later.', 500));
    }
};

// --- Get Current User Controller ---
// This now works whether authenticated via JWT or API Key,
// because 'protect' middleware attaches req.user in either case.
exports.getMe = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('User not found (middleware error).', 404));
    }
    // Return non-sensitive user data
    const userData = {
        _id: req.user._id,
        email: req.user.email,
        // Add other safe fields if needed
    };
    res.status(200).json({
        status: 'success',
        data: {
            user: userData,
        },
    });
};