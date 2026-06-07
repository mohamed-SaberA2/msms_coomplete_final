import express from 'express';
import * as recordController from '../controllers/recordController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, recordController.getAllRecords);
router.get('/:id', authenticateToken, recordController.getRecordById);
router.post('/', authenticateToken, authorizeRole(['admin', 'doctor']), recordController.createRecord);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'doctor']), recordController.updateRecord);

export default router;
