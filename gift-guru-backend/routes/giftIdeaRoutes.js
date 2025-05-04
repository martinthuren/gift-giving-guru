// FULL CODE SNIPPET: routes/giftIdeaRoutes.js

const express = require('express');
const authController = require('../controllers/authController');
const giftIdeaController = require('../controllers/giftIdeaController'); // We'll create this next

// mergeParams allows this router to access parameters from parent routers (like :personId if nested)
// Although we might not nest it directly in peopleRoutes.js, it's good practice.
const router = express.Router({ mergeParams: true });

// ALL routes defined in this file will require the user to be logged in
router.use(authController.protect);

router
    .route('/')
    // GET /api/gift-ideas (could list ALL ideas for user - maybe add later)
    // GET /api/people/:personId/gift-ideas (if nested - handled by getGiftIdeasForPerson)
    .get(giftIdeaController.getGiftIdeasForPerson) // Gets ideas for a specific person (needs personId)
    .post(giftIdeaController.setPersonUserIds, giftIdeaController.createGiftIdea); // Create a new idea

// Routes for specific gift ideas identified by their own ID
router
    .route('/:ideaId')
    // GET /api/gift-ideas/:ideaId
    .get(giftIdeaController.getGiftIdea)
    // PATCH /api/gift-ideas/:ideaId
    .patch(giftIdeaController.updateGiftIdea)
    // DELETE /api/gift-ideas/:ideaId
    .delete(giftIdeaController.deleteGiftIdea);

module.exports = router;