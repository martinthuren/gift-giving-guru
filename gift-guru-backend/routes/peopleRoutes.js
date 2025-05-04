// FULL CODE SNIPPET: peopleRoutes.js
const express = require('express');
const peopleController = require('../controllers/peopleController');
const authController = require('../controllers/authController'); // To use protect middleware

const router = express.Router();

// All routes below this middleware require authentication
router.use(authController.protect);

router
    .route('/')
    .get(peopleController.getAllPeople)
    .post(peopleController.createPerson); // Change setUser to 
router
    .route('/:id')
    .get(peopleController.getPerson)
    // .patch(peopleController.updatePerson) // <-- COMMENT THIS LINE OUT
    .delete(peopleController.deletePerson);

// --- Nested Routes for Gift Ideas (Optional but clean) ---
// Example: GET /api/people/123abc456def/gift-ideas
// You would need to create a giftIdeaRouter and mount it here
// const giftIdeaRouter = require('./giftIdeaRoutes'); // Adjust path if needed
// router.use('/:personId/gift-ideas', giftIdeaRouter);

module.exports = router;