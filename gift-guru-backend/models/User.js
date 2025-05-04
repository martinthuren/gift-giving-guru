// FULL CODE SNIPPET: models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true, // Ensure email is unique in the database
        lowercase: true, // Convert email to lowercase before saving
        trim: true, // Remove whitespace from ends
        match: [/\S+@\S+\.\S+/, 'Please provide a valid email'], // Basic email format validation
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long'], // Enforce minimum length
        select: false, // Prevent password from being sent back in queries by default
        
    },
       // ADD THIS FIELD:
       apiKeyHash: {
        type: String,
        select: false // Don't send the hash back in queries by default
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the creation date
    },
    // You might add other fields later like name, passwordChangedAt, etc.
});

// --- Mongoose Middleware ---

// Hash password BEFORE saving a new user or modifying the password
userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified (or is new)
    if (!this.isModified('password')) return next();

    // Hash the password with a cost factor of 12
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        // Do NOT save confirmPassword field if you added one to the schema
        // this.passwordConfirm = undefined;
        next();
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

// --- Mongoose Instance Methods ---

// Method to check if the provided password matches the hashed password in the DB
userSchema.methods.correctPassword = async function (
    candidatePassword, // Password user entered during login
    userPassword // Hashed password stored in the database (passed in because 'select: false')
) {
    // Returns true if passwords match, false otherwise
    return await bcrypt.compare(candidatePassword, userPassword);
};

// --- Create and Export Model ---

// Create the Mongoose model based on the schema
const User = mongoose.model('User', userSchema);

// !! IMPORTANT !! Export the Model
module.exports = User;