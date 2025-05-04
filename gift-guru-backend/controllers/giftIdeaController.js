// FULL CODE SNIPPET: controllers/giftIdeaController.js (Corrected)

const GiftIdea = require('../models/GiftIdea'); // Ensure GiftIdea model exists and path is correct
const Person = require('../models/Person'); // Need Person model to verify ownership
const AppError = require('../utils/appError'); // Ensure AppError utility exists

// Middleware to set user and person IDs on the request body before creating
// Used in POST '/' route in giftIdeaRoutes.js
exports.setPersonUserIds = (req, res, next) => {
    // Ensure req.user exists (from protect middleware)
    if (!req.user || !req.user.id) {
        return next(new AppError('User not found for setting gift idea owner.', 500));
    }
    // Set the user ID from the logged-in user
    req.body.user = req.user.id;

    // If person ID is coming from a nested route parameter (e.g., /people/:personId/gift-ideas)
    // This allows flexibility if you decide to nest routes later
    if (req.params.personId) {
        req.body.person = req.params.personId;
    }
    // If person ID is provided directly in the body (e.g., POST /api/gift-ideas)
    // we'll still verify ownership later, but make sure 'person' is set in the body
    if (!req.body.person) {
         return next(new AppError('Missing person ID for the gift idea.', 400));
    }

    next();
};

// Controller to CREATE a new gift idea
// Handles POST /api/gift-ideas
// Expects { person: 'personId', idea: 'text', ... } in req.body
// Middleware setPersonUserIds should run before this
exports.createGiftIdea = async (req, res, next) => {
    try {
        // req.body.user and req.body.person should be set by setPersonUserIds middleware

        // Verify the referenced person belongs to the logged-in user before creating idea
        const person = await Person.findOne({ _id: req.body.person, user: req.body.user });
        if (!person) {
            // Send 404 if the person doesn't exist or doesn't belong to the user
            return next(new AppError('Cannot add gift idea: Person not found or does not belong to user.', 404));
        }

        // Create the gift idea using the data in req.body
        // Mongoose will only use fields defined in the GiftIdea schema
        const newGiftIdea = await GiftIdea.create(req.body);

        res.status(201).json({ // 201 Created
            status: 'success',
            data: {
                giftIdea: newGiftIdea,
            },
        });
    } catch (err) {
        // Handle Mongoose validation errors (e.g., required fields missing)
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            const message = `Invalid input data. ${errors.join('. ')}`;
            return next(new AppError(message, 400));
        }
        // Handle CastError if the provided person ID has an invalid format
        if (err.name === 'CastError' && err.path === 'person') {
             return next(new AppError(`Invalid Person ID format: ${req.body.person}`, 400));
        }
        // Pass other errors to the global error handler
        next(err);
    }
};

// Controller to GET gift ideas, typically filtered by a specific person
// Handles GET /api/gift-ideas (expects ?person=personId query parameter)
// OR GET /api/people/:personId/gift-ideas (if nested routes were used)
exports.getGiftIdeasForPerson = async (req, res, next) => {
    try {
        let personId = req.params.personId; // Check URL path parameters first

        // If personId wasn't in the URL params, check the query parameters
        // This handles the current frontend request: GET /api/gift-ideas?person=...
        if (!personId && req.query.person) {
            personId = req.query.person;
        }

        // If we still don't have a personId after checking both, return an error
        if (!personId) {
            // Note: If you wanted a route to get ALL ideas for a user, you would create a separate route/controller
            return next(new AppError('Please specify the person ID (as query parameter "person") to get their gift ideas.', 400));
        }

        // Verify the person belongs to the logged-in user before fetching ideas
        // This prevents users from seeing gift ideas for people not on their list
         const person = await Person.findOne({ _id: personId, user: req.user.id });
         if (!person) {
             // Use 404 even if the person exists but belongs to another user
             return next(new AppError('Person not found or does not belong to this user.', 404));
         }

        // Find gift ideas linked to this specific person AND the logged-in user
        const giftIdeas = await GiftIdea.find({
            person: personId,
            user: req.user.id // Ensure we only get ideas created by the logged-in user
        }).sort({ createdAt: -1 }); // Sort newest first

        res.status(200).json({
            status: 'success',
            results: giftIdeas.length,
            data: {
                giftIdeas,
            },
        });
    } catch (err) {
        // Handle invalid MongoDB ID format for the personId
        if (err.name === 'CastError' && (err.path === '_id' || err.path === 'person')) {
             // Determine which ID was invalid based on where personId came from
             const invalidId = req.params.personId || req.query.person;
             return next(new AppError(`Invalid Person ID format: ${invalidId}`, 400));
        }
        next(err); // Pass other errors
    }
};

// Controller to GET a single gift idea by its own ID
// Handles GET /api/gift-ideas/:ideaId
exports.getGiftIdea = async (req, res, next) => {
     try {
        // Find the idea by its ID AND ensure it belongs to the logged-in user
        const idea = await GiftIdea.findOne({ _id: req.params.ideaId, user: req.user.id });

        if (!idea) {
            // Use 404 if idea doesn't exist or doesn't belong to the user
            return next(new AppError('No gift idea found with that ID for this user', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { giftIdea: idea }
        });
    } catch (err) {
         // Handle invalid MongoDB ID format for the ideaId
         if (err.name === 'CastError' && err.path === '_id') {
             return next(new AppError(`Invalid Gift Idea ID format: ${req.params.ideaId}`, 400));
         }
         next(err); // Pass other errors
    }
};

// Controller to UPDATE a specific gift idea
// Handles PATCH /api/gift-ideas/:ideaId
exports.updateGiftIdea = async (req, res, next) => {
    try {
        // Prevent user/person fields from being changed via this endpoint
        const { user, person, ...updateData } = req.body;

        // Find the idea by its ID and ensure it belongs to the logged-in user before updating
        const idea = await GiftIdea.findOneAndUpdate(
            { _id: req.params.ideaId, user: req.user.id }, // Find condition (ensures ownership)
            updateData, // Data from request body to update
            {
                new: true, // Return the updated document
                runValidators: true // Ensure schema validations run on update
            }
        );

        if (!idea) {
            // Use 404 if idea doesn't exist or doesn't belong to the user
            return next(new AppError('No gift idea found with that ID for this user to update', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                giftIdea: idea
            }
        });
    } catch (err) {
         // Handle invalid MongoDB ID format for the ideaId
         if (err.name === 'CastError' && err.path === '_id') {
            return next(new AppError(`Invalid Gift Idea ID format: ${req.params.ideaId}`, 400));
         }
         // Handle Mongoose validation errors during update
         if (err.name === 'ValidationError') {
             const errors = Object.values(err.errors).map(el => el.message);
             const message = `Invalid input data. ${errors.join('. ')}`;
             return next(new AppError(message, 400));
         }
        next(err); // Pass other errors
    }
};

// Controller to DELETE a specific gift idea
// Handles DELETE /api/gift-ideas/:ideaId
exports.deleteGiftIdea = async (req, res, next) => {
     try {
         // Find the idea by its ID and ensure it belongs to the logged-in user before deleting
         const idea = await GiftIdea.findOneAndDelete({ _id: req.params.ideaId, user: req.user.id });

         if (!idea) {
             // Use 404 if idea doesn't exist or doesn't belong to the user
             return next(new AppError('No gift idea found with that ID for this user to delete', 404));
         }

         // Send 204 No Content on successful deletion
         res.status(204).json({
             status: 'success',
             data: null
         });
     } catch (err) {
          // Handle invalid MongoDB ID format for the ideaId
          if (err.name === 'CastError' && err.path === '_id') {
             return next(new AppError(`Invalid Gift Idea ID format: ${req.params.ideaId}`, 400));
          }
         next(err); // Pass other errors
     }
 };