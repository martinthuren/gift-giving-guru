// FULL CODE SNIPPET: routes/giftHistoryRoutes.js

const express = require('express');
const authController = require('../controllers/authController');
const giftHistoryController = require('../controllers/giftHistoryController');

// Allow merging params if this router is nested later (e.g., under /people/:personId)
const router = express.Router({ mergeParams: true });

// Protect all routes in this file
router.use(authController.protect);

router
    .route('/')
    .get(giftHistoryController.getHistoryForPerson) // GET /api/history?person=... OR GET /people/:id/history
    .post(giftHistoryController.setPersonUserIds, giftHistoryController.createHistoryRecord); // POST /api/history OR POST /people/:id/history

// Routes for operating on a specific history record by its ID
router
    .route('/:recordId')
    // Add GET /api/history/:recordId later if needed
    // Add PATCH /api/history/:recordId later if needed
    .delete(giftHistoryController.deleteHistoryRecord); // DELETE /api/history/:recordId

module.exports = router;