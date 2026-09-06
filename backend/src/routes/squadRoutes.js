const express = require('express');
const router = express.Router();
const squadController = require('../controllers/squadController');

router.get('/', squadController.getSquads);
router.post('/', squadController.createSquad);
router.put('/:id', squadController.updateSquad);
router.delete('/:id', squadController.deleteSquad);

module.exports = router;
