// FULL CODE SNIPPET: models/GiftHistory.js

const mongoose = require('mongoose');

const giftHistorySchema = new mongoose.Schema({
    user: { // Link to the user who this record belongs to
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'History record must belong to a user.'],
        index: true,
    },
    person: { // Link to the person involved (recipient or giver if tracking both ways)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person',
        required: [true, 'History record must be linked to a person.'],
        index: true,
    },
    // Consider adding 'direction': 'given' | 'received' if tracking both
    giftDescription: { // What was the gift?
        type: String,
        required: [true, 'Gift description cannot be empty.'],
        trim: true,
    },
    event: { // Optional: What occasion? (e.g., "Birthday 2024", "Christmas 2023")
        type: String,
        trim: true,
    },
    dateGiven: { // When was it given? Default to now, but allow setting specific date
        type: Date,
        default: Date.now,
    },
    notes: { // Optional notes about the gift/reaction etc.
        type: String,
        trim: true
    },
    // Optional: Link back to the original GiftIdea if converting an idea to history
    // giftIdeaId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'GiftIdea'
    // },
    cost: { // Optional cost tracking
         type: Number,
         min: [0, 'Cost cannot be negative.']
    },
    createdAt: { // When the record was created (distinct from dateGiven)
        type: Date,
        default: Date.now,
    },
});

// Sort by dateGiven descending by default when querying?
giftHistorySchema.index({ person: 1, dateGiven: -1 });

const GiftHistory = mongoose.model('GiftHistory', giftHistorySchema);

module.exports = GiftHistory;