// FULL CODE SNIPPET: routes/peopleRoutes.js (No Upload Middleware)
const express = require('express');
const peopleController = require('../controllers/peopleController');
const authController = require('../controllers/authController');
// const uploadMiddleware = require('../middleware/uploadMiddleware'); // REMOVED require

const router = express.Router();

router.use(authController.protect); // Apply auth to all

router
    .route('/')
    .get(peopleController.getAllPeople)
    .post(peopleController.createPerson);

router
    .route('/:id')
    .get(peopleController.getPerson)
    .patch(
        // NO uploadMiddleware here
        peopleController.updatePerson
    )
    .delete(peopleController.deletePerson);

module.exports = router;