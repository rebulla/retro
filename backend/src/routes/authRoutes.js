const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/sync', authController.syncUser);
router.put('/request-access', authController.requestAccess);

module.exports = router;
