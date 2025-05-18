// FULL CODE SNIPPET: controllers/peopleController.js (Revised Update Logic)

const Person = require('../models/Person'); // Ensure model path is correct
const AppError = require('../utils/appError'); // Ensure utility path is correct
const cloudinary = require('cloudinary').v2; // Require Cloudinary SDK

// --- GET All People ---
exports.getAllPeople = async (req, res, next) => {
    try {
        const people = await Person.find({ user: req.user.id }).sort({ name: 1 });
        res.status(200).json({
            status: 'success',
            results: people.length,
            data: { people }
        });
    } catch (err) {
        next(err);
    }
};

// --- CREATE Person ---
exports.createPerson = async (req, res, next) => {
    try {
        const personData = { ...req.body };
        if (!personData.user) {
             if (req.user && req.user.id) personData.user = req.user.id;
             else return next(new AppError('Cannot create person without logged-in user.', 400));
        }
        if (personData.user !== req.user.id) {
             return next(new AppError('Forbidden: Cannot create person for another user.', 403));
        }
        delete personData.profilePictureUrl; // Don't allow setting pic on create

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

// --- UPDATE Person (Revised Logic for Image Upload) ---
exports.updatePerson = async (req, res, next) => {
    try {
        // 1. Extract text data and potential profilePictureUrl intent from body
        const { user, createdAt, profilePictureUrl: profilePictureUrlFromBody, ...textData } = req.body;
        let updateData = { ...textData }; // Initialize with text data

        // Handle interests array sent as JSON string from FormData
        if (updateData.interests && typeof updateData.interests === 'string') {
             try {
                 updateData.interests = JSON.parse(updateData.interests);
                 if (!Array.isArray(updateData.interests)) {
                     // If not an array after parsing, wrap it in an array or handle error
                     console.warn("Parsed interests is not an array, wrapping:", updateData.interests);
                     updateData.interests = [updateData.interests];
                     // Or: throw new Error("Interests not an array after parsing");
                 }
             } catch (parseError) {
                  console.warn("Could not parse interests string, treating as single interest:", updateData.interests);
                  updateData.interests = [updateData.interests]; // Treat as single item array
                  // Or: return next(new AppError('Invalid format for interests. Must be a valid JSON array string or comma-separated.', 400));
             }
        }

        // 2. Handle file upload if req.file (from multer) exists
        if (req.file && req.file.buffer) {
            console.log(`Processing uploaded file: ${req.file.originalname}, size: ${req.file.size}`);
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = `data:${req.file.mimetype};base64,${b64}`;

            try {
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(dataURI, {
                     folder: "gift_guru_profiles",
                     transformation: [{ width: 300, height: 300, crop: "limit" }, { crop: "fill", gravity: "face", width: 250, height: 250 }]
                });
                console.log("Cloudinary Upload Success:", result.secure_url);
                updateData.profilePictureUrl = result.secure_url; // Set the new URL in data to be saved

                // TODO: Implement deletion of the OLD image from Cloudinary
                // This would require fetching the existing person document before this point
                // to get the old image's public_id if you're using specific public_ids.

            } catch (uploadError) {
                 console.error("Cloudinary Upload Error:", uploadError);
                 // Fail the request if image upload fails, as it might be an essential part of the update
                 return next(new AppError('Image could not be uploaded successfully. Please try again.', 500));
            }
        } else if (Object.prototype.hasOwnProperty.call(req.body, 'profilePictureUrl') &&
                   (profilePictureUrlFromBody === '' || profilePictureUrlFromBody === null)) {
            // If no new file, AND the frontend explicitly sent profilePictureUrl as empty/null,
            // this signals an intent to remove the existing picture.
            console.log("Request to remove profile picture received.");
            // TODO: Implement deletion of the image from Cloudinary here
            updateData.profilePictureUrl = null; // Set to null in the database
        }
        // If no new file is uploaded AND profilePictureUrl is not explicitly sent as empty/null in req.body,
        // then updateData will not have the profilePictureUrl property set by the above blocks.
        // This means Mongoose will preserve the existing value in the database for that field.


        // 3. Log data before updating and then update the Person document
        console.log("Data being sent to MongoDB for update:", updateData);
        const person = await Person.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id }, // Find condition
            updateData, // Apply the updates
            {
                new: true, // Return the updated document
                runValidators: true // Run schema validations
            }
        );

        if (!person) {
            return next(new AppError('No person found with that ID for this user to update', 404));
        }

        // 4. Send Successful Response
        res.status(200).json({
            status: 'success',
            data: {
                person // Send back the updated person document
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
         const personToDelete = await Person.findOne({ _id: req.params.id, user: req.user.id });
         if (!personToDelete) {
             return next(new AppError('No person found with that ID for this user', 404));
         }

         // TODO: Delete associated profile picture from Cloudinary
         // if (personToDelete.profilePictureUrl) { ... }

         // TODO: Delete associated GiftIdeas and GiftHistory
         // await GiftIdea.deleteMany({ person: personToDelete._id, user: req.user.id });
         // await GiftHistory.deleteMany({ person: personToDelete._id, user: req.user.id });

         await Person.findByIdAndDelete(personToDelete._id);

         res.status(204).json({ status: 'success', data: null });
     } catch (err) {
          if (err.name === 'CastError' && err.path === '_id') {
            return next(new AppError(`Invalid Person ID format: ${req.params.id}`, 400));
          }
         next(err);
     }
 };