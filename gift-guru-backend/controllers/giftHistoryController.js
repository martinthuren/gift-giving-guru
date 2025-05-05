// FULL CODE SNIPPET: controllers/giftHistoryController.js

const GiftHistory = require('../models/GiftHistory');
const Person = require('../models/Person'); // Need Person model to verify ownership
const AppError = require('../utils/appError');

// Middleware to set user and person IDs before creating a history record
// Similar to the one for Gift Ideas
exports.setPersonUserIds = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new AppError('User not found for setting history record owner.', 500));
    }
    req.body.user = req.user.id;

    if (req.params.personId) { // If nested route like /people/:personId/history
        req.body.person = req.params.personId;
    }
    // Ensure person is set in the body somehow if not using nested routes
    if (!req.body.person) {
        return next(new AppError('Missing person ID for the history record.', 400));
    }
    next();
};

// Controller to CREATE a new history record
// Handles POST /api/history or POST /api/people/:personId/history
// Expects { person: 'personId', giftDescription: 'text', ... } in req.body
exports.createHistoryRecord = async (req, res, next) => {
    try {
        // req.body.user and req.body.person should be set by middleware

        // Verify the referenced person belongs to the logged-in user
        const person = await Person.findOne({ _id: req.body.person, user: req.body.user });
        if (!person) {
            return next(new AppError('Cannot add history record: Person not found or does not belong to user.', 404));
        }

        // Create the history record
        const newRecord = await GiftHistory.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                historyRecord: newRecord,
            },
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return next(new AppError(`Invalid input: ${errors.join('. ')}`, 400));
        }
         if (err.name === 'CastError' && err.path === 'person') {
             return next(new AppError(`Invalid Person ID format: ${req.body.person}`, 400));
         }
        next(err);
    }
};

// Controller to GET history records for a specific person
// Handles GET /api/history?person=personId or GET /api/people/:personId/history
exports.getHistoryForPerson = async (req, res, next) => {
    try {
        let personId = req.params.personId;
        if (!personId && req.query.person) {
            personId = req.query.person;
        }

        if (!personId) {
            return next(new AppError('Please specify the Person ID (as query parameter "person") to get their history.', 400));
        }

        // Verify the person belongs to the logged-in user
         const person = await Person.findOne({ _id: personId, user: req.user.id });
         if (!person) {
             return next(new AppError('Person not found or does not belong to this user.', 404));
         }

        // Find history records linked to this person and user, sort by date given (most recent first)
        const historyRecords = await GiftHistory.find({
            person: personId,
            user: req.user.id
        }).sort({ dateGiven: -1, createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: historyRecords.length,
            data: {
                history: historyRecords, // Use 'history' key for clarity
            },
        });
    } catch (err) {
        if (err.name === 'CastError' && (err.path === '_id' || err.path === 'person')) {
             const invalidId = req.params.personId || req.query.person;
             return next(new AppError(`Invalid Person ID format: ${invalidId}`, 400));
        }
        next(err);
    }
};

// --- Add GET (one record), PATCH, DELETE later if needed ---
// Example: Delete a history record
exports.deleteHistoryRecord = async (req, res, next) => {
    try {
        const record = await GiftHistory.findOneAndDelete({
            _id: req.params.recordId, // Assuming route is /api/history/:recordId
            user: req.user.id // Ensure ownership
        });

        if (!record) {
            return next(new AppError('No history record found with that ID for this user.', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        if (err.name === 'CastError' && err.path === '_id') {
            return next(new AppError(`Invalid History Record ID format: ${req.params.recordId}`, 400));
        }
        next(err);
    }
};