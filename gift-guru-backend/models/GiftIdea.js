// FULL CODE SNIPPET: models/GiftIdea.js

const mongoose = require('mongoose');

const giftIdeaSchema = new mongoose.Schema({
    user: { // Link to the user who added this idea
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: [true, 'Gift idea must belong to a user.'],
        index: true,
    },
    person: { // Link to the person this gift is for
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person', // Reference to the Person model
        required: [true, 'Gift idea must be linked to a person.'],
        index: true,
    },
    idea: { // The actual gift description/name
        type: String,
        required: [true, 'Gift idea description cannot be empty.'],
        trim: true,
    },
    url: { // To store URL saved from extension or manually
        type: String,
        trim: true,
        // Optional: Add URL validation if desired
        // match: [/^(http|https):\/\/[^ "]+$/, 'Please provide a valid URL']
    },
    imageUrl: { // Optional image URL (e.g., scraped from URL)
        type: String,
        trim: true,
    },
    price: { // Optional price tracking
        type: Number,
        min: [0, 'Price cannot be negative.']
    },
    notes: { // User's notes about the idea
        type: String,
        trim: true
    },
    isPurchased: { // Flag to mark if the gift has been bought
        type: Boolean,
        default: false,
    },
    // You could add fields like 'whereToBuy', 'priority', etc. later
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create the Mongoose model from the schema
const GiftIdea = mongoose.model('GiftIdea', giftIdeaSchema);

// !! IMPORTANT: Export the model !!
module.exports = GiftIdea;