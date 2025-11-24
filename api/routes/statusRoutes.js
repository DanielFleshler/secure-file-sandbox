/**
 * Status Routes
 * Handles status check endpoints
 * GET /status/:id - Get processing status of uploaded file
 */

const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

// GET /status/:id
// TODO: Add parameter validation middleware
// TODO: Route to statusController.getStatus

module.exports = router;
