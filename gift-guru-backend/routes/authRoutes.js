// FULL CODE SNIPPET: routes/authRoutes.js (Restore Original)
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Make sure authController is required correctly above!

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.protect, authController.getMe); // Ensure getMe is defined in authController

module.exports = router;