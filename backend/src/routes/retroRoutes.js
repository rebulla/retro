const express = require('express');
const router = express.Router();
const retroController = require('../controllers/retroController');

// List all retrospectives (nav history)
router.get('/', retroController.getAllRetrospectives);

// Get a specific retrospective
router.get('/:id', retroController.getRetrospectiveById);

// Create a new retrospective
router.post('/', retroController.createRetrospective);

// Update retrospective theme (title, columns, background)
router.put('/:id', retroController.updateRetrospectiveTheme);

// Add a card to a column
router.post('/:id/cards', retroController.addCard);

// Update a card (e.g., move to another column, or vote)
router.put('/:id/cards/:cardId', retroController.updateCard);

// Toggle vote on a card
router.post('/:id/cards/:cardId/vote', retroController.toggleVote);

// Delete a retrospective
router.delete('/:id', retroController.deleteRetrospective);

// Delete a card
router.delete('/:id/cards/:cardId', retroController.deleteCard);

module.exports = router;
