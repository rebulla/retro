const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// TODO: Adicionar middleware para verificar se é admin
router.get('/users', adminController.getUsers);
router.put('/users/:id/approve', adminController.approveUser);
router.put('/users/:id/reject', adminController.rejectUser);
router.delete('/users/:id/squads/:squadId', adminController.removeSquadFromUser);

module.exports = router;
