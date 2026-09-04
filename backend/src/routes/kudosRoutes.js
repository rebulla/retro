const express = require('express');
const router = express.Router();
const kudosController = require('../controllers/kudosController');

router.get('/', kudosController.getAllKudosBoards);
router.get('/:id', kudosController.getKudosBoardById);
router.post('/', kudosController.createKudosBoard);
router.put('/:id', kudosController.updateKudosBoardTheme);
router.delete('/:id', kudosController.deleteKudosBoard);

// Kudos items routes
router.post('/:id/kudos', kudosController.addKudo);
router.put('/:id/kudos/:kudoId', kudosController.updateKudo);
router.delete('/:id/kudos/:kudoId', kudosController.deleteKudo);
router.post('/:id/kudos/:kudoId/vote', kudosController.toggleVote);

module.exports = router;
