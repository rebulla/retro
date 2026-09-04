const express = require('express');
const router = express.Router();
const sprintController = require('../controllers/sprintController');

router.get('/', sprintController.getAllSprints);
router.get('/active', sprintController.getActiveSprint);
router.put('/:id/activate', sprintController.activateSprint);
router.put('/:id', sprintController.updateSprint);
router.post('/', sprintController.createSprint);
router.delete('/:id', sprintController.deleteSprint);

module.exports = router;
