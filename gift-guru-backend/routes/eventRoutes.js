// FULL CODE SNIPPET: routes/eventRoutes.js

const express = require('express');
const eventController = require('../controllers/eventController');
const authController = require('../controllers/authController'); // Need protect middleware

const router = express.Router();

// Protect all routes defined in this file
router.use(authController.protect);

// Define route for getting upcoming events
router.get('/upcoming', eventController.getUpcomingEvents);

// You could add other event-related routes here later

module.exports = router;