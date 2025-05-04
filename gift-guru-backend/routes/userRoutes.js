// FULL CODE SNIPPET: routes/userRoutes.js

const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController'); // Need protect middleware

const router = express.Router();

// All routes defined below this point require the user to be logged in (via JWT)
router.use(authController.protect);

// Route for generating/regenerating API Key for the logged-in user ('me')
router.post('/me/api-key', userController.generateApiKey);

// Add other user routes here later (e.g., GET /me, PATCH /me/update)
// Note: We already have GET /me in authRoutes, maybe move it here for consistency? Or leave it.

module.exports = router;