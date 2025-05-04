// FULL CODE SNIPPET: controllers/peopleController.js (Get All & Create)

const Person = require('../models/Person'); // Ensure Person model exists and path is correct
console.log('Imported Person:', Person); // <-- ADD THIS

const AppError = require('../utils/appError'); // Ensure AppError utility exists

// Middleware to set user ID on the body for creation (used in peopleRoutes.js)
// exports.setUser = (req, res, next) => {
//     // Ensure req.user exists (from protect middleware)
//     if (!req.user || !req.user.id) {
//         return next(new AppError('User not found for setting person owner.', 500));
//     }
//     req.body.user = req.user.id;
//     next();
// }
// Note: The setUser middleware logic was previously included directly in the POST route handler in peopleRoutes.js.
// Let's ensure peopleRoutes.js passes the user ID correctly. Re-check peopleRoutes.js if needed.

// GET All People for the logged-in user
exports.getAllPeople = async (req, res, next) => {
    try {
        // Filter to only find people belonging to the currently logged-in user (req.user set by protect middleware)
        const people = await Person.find({ user: req.user.id }).sort({ name: 1 }); // Sort by name

        res.status(200).json({
            status: 'success',
            results: people.length,
            data: {
                people,
            },
        });
    } catch (err) {
        next(err); // Pass errors to global error handler
    }
};

// POST - Create a New Person for the logged-in user
exports.createPerson = async (req, res, next) => {
    try {
        // Make sure the user ID is added to the body before creating
        // This should be handled either by middleware (like setUser above)
        // or directly in the route handler in peopleRoutes.js
        if (!req.body.user) {
             // Double-check: Ensure protect middleware ran and peopleRoutes correctly adds user ID
             if (req.user && req.user.id) {
                 req.body.user = req.user.id;
             } else {
                return next(new AppError('Cannot create person without logged-in user.', 400));
             }
        }
        // Only allow creating for the logged-in user
        if (req.body.user !== req.user.id) {
             return next(new AppError('You can only create people for your own account.', 403)); // Forbidden
        }


        // Create the person with data from request body (name, relationship, birthday, etc.)
        const newPerson = await Person.create(req.body);

        res.status(201).json({ // 201 Created
            status: 'success',
            data: {
                person: newPerson,
            },
        });
    } catch (err) {
         // Handle Mongoose validation errors
         if (err.name === 'ValidationError') {
             const errors = Object.values(err.errors).map(el => el.message);
             const message = `Invalid input data. ${errors.join('. ')}`;
             return next(new AppError(message, 400));
         }
        next(err); // Pass other errors
    }
};

// --- Add Handlers for getPerson(id), updatePerson(id), deletePerson(id) later ---
// Make sure they also check that the person belongs to req.user.id
// Example:
exports.getPerson = async (req, res, next) => {
    try {
        const person = await Person.findOne({ _id: req.params.id, user: req.user.id });

        if (!person) {
            return next(new AppError('No person found with that ID for this user', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { person }
        });
    } catch (err) {
         if (err.name === 'CastError') return next(new AppError(`Invalid ID format: ${req.params.id}`, 400));
         next(err);
    }
};

 exports.deletePerson = async (req, res, next) => {
     try {
         const person = await Person.findOneAndDelete({ _id: req.params.id, user: req.user.id });

         if (!person) {
             return next(new AppError('No person found with that ID for this user', 404));
         }
         // TODO: Consider deleting associated GiftIdeas as well?
         // await GiftIdea.deleteMany({ person: req.params.id, user: req.user.id });

         res.status(204).json({ // 204 No Content
             status: 'success',
             data: null
         });
     } catch (err) {
          if (err.name === 'CastError') return next(new AppError(`Invalid ID format: ${req.params.id}`, 400));
         next(err);
     }
 };

 // Add updatePerson later...