// FULL CODE SNIPPET: routes/peopleRoutes.js (With Upload Middleware)

const express = require('express');
const peopleController = require('../controllers/peopleController');
const authController = require('../controllers/authController');
// Require the upload middleware
const uploadMiddleware = require('../middleware/uploadMiddleware');

const router = express.Router();

// Protect all routes defined in this file
router.use(authController.protect);

// Routes for the base '/api/people' path
router
    .route('/')
    // GET all people for the logged-in user
    .get(peopleController.getAllPeople)
    // POST to create a new person (image upload handled on update for simplicity)
    .post(peopleController.createPerson);

// Routes for '/api/people/:id'
router
    .route('/:id')
    // GET a specific person by ID
    .get(peopleController.getPerson)
    // PATCH to update a specific person (handles text data AND potential image upload)
    .patch(
        uploadMiddleware.uploadPersonPhoto, // 1. Multer middleware tries to handle single file upload named 'profileImage'
        // Optional: add resize middleware here if doing it on server-side
        peopleController.updatePerson        // 2. Controller function handles saving text data and Cloudinary URL
    )
    // DELETE a specific person by ID
    .delete(peopleController.deletePerson);

// --- Optional Nested Routes Placeholder ---
// Example: router.use('/:personId/gift-ideas', giftIdeaRouter);

module.exports = router;