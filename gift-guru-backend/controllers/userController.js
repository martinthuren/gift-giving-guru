// FULL CODE SNIPPET: controllers/userController.js

const User = require('../models/User'); // Need the User model
const AppError = require('../utils/appError'); // For error handling
const crypto = require('crypto'); // For generating keys and hashing

// Controller function to generate/regenerate an API key
exports.generateApiKey = async (req, res, next) => {
    try {
        // 1. Generate a simple, secure random API key (e.g., 32 bytes hex string)
        // This is the key the user will copy
        const rawApiKey = crypto.randomBytes(32).toString('hex');

        // 2. Create a SHA256 hash of the raw key for storing in the DB
        // Use a standard, non-salted hash for lookup capability
        const hashedApiKey = crypto
            .createHash('sha256')
            .update(rawApiKey)
            .digest('hex');

        // 3. Update the currently logged-in user's document
        // req.user is attached by the 'protect' middleware
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { apiKeyHash: hashedApiKey }, // Set the new hash
            { new: true } // Return the updated user document (optional)
        );

        if (!updatedUser) {
            // Should not happen if protect middleware worked, but good check
            return next(new AppError('User not found.', 404));
        }

        // 4. Send the RAW API key back to the user ONCE.
        // Make it clear in the frontend that this is the only time it's shown.
        res.status(200).json({
            status: 'success',
            message: 'API Key generated successfully. Copy it now, it will not be shown again!',
            apiKey: rawApiKey // Send the unhashed key
        });

    } catch (err) {
        next(err); // Pass errors to global error handler
    }
};

// Add other user-related handlers here later if needed (e.g., update profile)