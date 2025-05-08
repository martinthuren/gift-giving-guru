// FULL CODE SNIPPET: controllers/peopleController.js (No Upload Logic)

const Person = require('../models/Person');
const AppError = require('../utils/appError');
// const cloudinary = require('cloudinary').v2; // REMOVED require

// --- Keep getAllPeople ---
exports.getAllPeople = async (req, res, next) => { /* ... as before ... */
    try {
        const people = await Person.find({ user: req.user.id }).sort({ name: 1 });
        res.status(200).json({ status: 'success', results: people.length, data: { people } });
    } catch (err) { next(err); }
};

// --- Keep createPerson ---
exports.createPerson = async (req, res, next) => { /* ... as before ... */
    try {
        if (!req.body.user) {
             if (req.user && req.user.id) req.body.user = req.user.id;
             else return next(new AppError('Cannot create person without logged-in user.', 400));
        }
        if (req.body.user !== req.user.id) return next(new AppError('Forbidden.', 403));
        const newPerson = await Person.create(req.body);
        res.status(201).json({ status: 'success', data: { person: newPerson } });
    } catch (err) {
        if (err.name === 'ValidationError') { /* handle validation */ return next(new AppError(`Invalid input: ${Object.values(err.errors).map(e=>e.message).join('. ')}`, 400)); }
        next(err);
    }
};

// --- Keep getPerson ---
exports.getPerson = async (req, res, next) => { /* ... as before ... */
    try {
        const person = await Person.findOne({ _id: req.params.id, user: req.user.id });
        if (!person) return next(new AppError('No person found with that ID for this user', 404));
        res.status(200).json({ status: 'success', data: { person } });
    } catch (err) {
         if (err.name === 'CastError') return next(new AppError(`Invalid ID: ${req.params.id}`, 400));
         next(err);
    }
};

// --- MODIFIED updatePerson (No File Logic) ---
exports.updatePerson = async (req, res, next) => {
    try {
        // Exclude fields that shouldn't be updated directly
        const { user, createdAt, profilePictureUrl, ...updateData } = req.body; // Exclude profilePictureUrl too

        // Find and update, ensuring ownership
        const person = await Person.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            updateData, // Only update with allowed fields from request body
            { new: true, runValidators: true }
        );

        if (!person) {
            return next(new AppError('No person found with that ID for this user to update', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { person }
        });
    } catch (err) {
         if (err.name === 'CastError' && err.path === '_id') return next(new AppError(`Invalid ID: ${req.params.id}`, 400));
         if (err.name === 'ValidationError') {
             const errors = Object.values(err.errors).map(el => el.message);
             return next(new AppError(`Invalid input: ${errors.join('. ')}`, 400));
         }
         next(err);
    }
};


// --- Keep deletePerson ---
 exports.deletePerson = async (req, res, next) => { /* ... as before ... */
     try {
         const person = await Person.findOneAndDelete({ _id: req.params.id, user: req.user.id });
         if (!person) return next(new AppError('No person found with that ID for this user', 404));
         // Maybe delete GiftIdeas/History too?
         res.status(204).json({ status: 'success', data: null });
     } catch (err) {
          if (err.name === 'CastError') return next(new AppError(`Invalid ID: ${req.params.id}`, 400));
         next(err);
     }
 };