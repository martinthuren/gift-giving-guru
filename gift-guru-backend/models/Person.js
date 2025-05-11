// FULL CODE SNIPPET: models/Person.js (Correct Implementation)

const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    user: { // Link to the user who added this person
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: [true, 'Person must belong to a user.'], // Ensure it's linked
        index: true // Add index for faster lookups by user
    },
    name: {
        type: String,
        required: [true, 'Person must have a name'],
        trim: true, // Remove leading/trailing whitespace
    },
    relationship: {
        type: String,
        trim: true,
    },
    birthday: { // Store as Date for easier comparison/sorting
        type: Date,
    },
    // Add anniversary or other important dates if needed later
    // anniversary: Date,
    interests: { // Array of strings for interests/preferences
        type: [String],
        // Optional: Add validation or sanitization for interests if needed
    },
    // Optional notes specific to the person
    // notes: {
    //     type: String,
    //     trim: true
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    profilePictureUrl: {
        type: String,
        default: null
    },
});

// Optional: Add more indexes for performance if needed
// Example: personSchema.index({ user: 1, birthday: 1 });

// Create the Mongoose model from the schema
const Person = mongoose.model('Person', personSchema);

// !! IMPORTANT: Export the model !!
module.exports = Person;