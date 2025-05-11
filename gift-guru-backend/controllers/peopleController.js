// FULL CODE SNIPPET: controllers/peopleController.js (With Cloudinary Upload Logic)

const Person = require('../models/Person'); // Ensure model path is correct
const AppError = require('../utils/appError'); // Ensure utility path is correct
const cloudinary = require('cloudinary').v2; // Require Cloudinary SDK

// --- GET All People ---
exports.getAllPeople = async (req, res, next) => {
    try {
        // Find only people associated with the logged-in user
        const people = await Person.find({ user: req.user.id }).sort({ name: 1 });
        res.status(200).json({
            status: 'success',
            results: people.length,
            data: { people }
        });
    } catch (err) {
        next(err); // Pass to global error handler
    }
};

// --- CREATE Person ---
// Note: This basic version doesn't handle initial image upload during creation.
// That would require changing the route/middleware for POST '/'.
exports.createPerson = async (req, res, next) => {
    try {
        // Ensure user ID is set correctly
        const personData = { ...req.body }; // Copy request body
        if (!personData.user) {
             if (req.user && req.user.id) personData.user = req.user.id;
             else return next(new AppError('Cannot create person without logged-in user.', 400));
        }
        // Prevent user from creating person for someone else
        if (personData.user !== req.user.id) {
             return next(new AppError('Forbidden: Cannot create person for another user.', 403));
        }
        // Remove profilePictureUrl if sent during creation (should be added via update)
        delete personData.profilePictureUrl;

        // Create the person
        const newPerson = await Person.create(personData);
        res.status(201).json({
            status: 'success',
            data: { person: newPerson }
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return next(new AppError(`Invalid input data. ${errors.join('. ')}`, 400));
        }
        next(err);
    }
};

// --- GET Single Person ---
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
         if (err.name === 'CastError' && err.path === '_id') {
            return next(new AppError(`Invalid Person ID format: ${req.params.id}`, 400));
         }
         next(err);
    }
};

// --- UPDATE Person (Handles Image Upload) ---
exports.updatePerson = async (req, res, next) => {
    try {
        // 1. Extract allowed text data from body (exclude fields not updatable here)
        const { user, createdAt, ...updateData } = req.body;

        // Handle potential interests array sent as JSON string from FormData
        if (updateData.interests && typeof updateData.interests === 'string') {
             try {
                 updateData.interests = JSON.parse(updateData.interests);
                 if (!Array.isArray(updateData.interests)) {
                     throw new Error("Interests not an array");
                 }
             } catch (parseError) {
                  console.warn("Could not parse interests string, treating as single interest:", updateData.interests);
                  // Optionally handle as single interest or return error
                   updateData.interests = [updateData.interests]; // Treat as single item array
                  // return next(new AppError('Invalid format for interests.', 400));
             }
        }


        // 2. Handle file upload if req.file exists (from multer middleware)
        if (req.file && req.file.buffer) {
            console.log(`Processing uploaded file: ${req.file.originalname}, size: ${req.file.size}`);
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = `data:${req.file.mimetype};base64,${b64}`;

            try {
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(dataURI, {
                     folder: "gift_guru_profiles", // Organize uploads
                     // Example transformation: limit size, focus on face if possible
                     transformation: [{ width: 300, height: 300, crop: "limit" }, { crop: "fill", gravity: "face", width: 250, height: 250 }]
                });
                console.log("Cloudinary Upload Success:", result.secure_url);
                updateData.profilePictureUrl = result.secure_url; // Set the URL to save in DB

                // TODO: Implement deletion of the OLD image from Cloudinary here
                // Requires fetching the person *before* the update to get the old URL/public_id

            } catch (uploadError) {
                 console.error("Cloudinary Upload Error:", uploadError);
                 return next(new AppError('Image could not be uploaded successfully.', 500)); // Fail request if upload fails
            }
        } else {
             // Handle explicit removal request ONLY if the field is present in body and empty/null
             // Note: FormData doesn't typically send empty fields unless explicitly set
              if ('profilePictureUrl' in req.body && !req.body.profilePictureUrl) {
                  // TODO: Delete image from Cloudinary if removing
                  console.log("Request to remove profile picture.");
                  updateData.profilePictureUrl = null; // Set to null in DB
              } else {
                 // If profilePictureUrl is not in req.body, DON'T change the existing value
                  delete updateData.profilePictureUrl;
              }
        }


        // 3. Update the Person document in MongoDB
        // Find only by ID and user ID (ensures ownership)
        const person = await Person.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            updateData, // Apply the updates (potentially including new image URL)
            {
                new: true, // Return the modified document
                runValidators: true // Run schema validations
            }
        );

        // If findOneAndUpdate didn't find a matching document
        if (!person) {
            return next(new AppError('No person found with that ID for this user to update', 404));
        }

        // 4. Send successful response with updated person data
        res.status(200).json({
            status: 'success',
            data: {
                person
            }
        });
    } catch (err) {
         // Handle specific errors
         if (err.name === 'CastError' && err.path === '_id') {
            return next(new AppError(`Invalid Person ID format: ${req.params.id}`, 400));
         }
         if (err.name === 'ValidationError') {
             const errors = Object.values(err.errors).map(el => el.message);
             return next(new AppError(`Invalid input data. ${errors.join('. ')}`, 400));
         }
         // Pass any other errors to the global error handler
         next(err);
    }
};

// --- DELETE Person ---
exports.deletePerson = async (req, res, next) => {
     try {
         // Find the person first to potentially get image URL for deletion
         const personToDelete = await Person.findOne({ _id: req.params.id, user: req.user.id });

         if (!personToDelete) {
             return next(new AppError('No person found with that ID for this user', 404));
         }

         // TODO: Delete associated profile picture from Cloudinary
         // if (personToDelete.profilePictureUrl) {
         //    try {
         //        const publicId = ... // Extract public ID from URL if possible, or store it separately
         //        await cloudinary.uploader.destroy(publicId);
         //        console.log("Deleted old image from Cloudinary:", publicId);
         //    } catch (deleteError) {
         //         console.error("Cloudinary Delete Error (on person delete):", deleteError);
         //          // Decide if deletion failure should stop the process
         //    }
         // }

         // TODO: Delete associated GiftIdeas and GiftHistory?
         // await GiftIdea.deleteMany({ person: personToDelete._id, user: req.user.id });
         // await GiftHistory.deleteMany({ person: personToDelete._id, user: req.user.id });


         // Delete the person document itself
         await Person.findByIdAndDelete(personToDelete._id);


         res.status(204).json({ // 204 No Content
             status: 'success',
             data: null
         });
     } catch (err) {
          if (err.name === 'CastError' && err.path === '_id') {
            return next(new AppError(`Invalid Person ID format: ${req.params.id}`, 400));
          }
         next(err);
     }
 };