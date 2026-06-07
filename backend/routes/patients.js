import express from 'express';
import * as patientController from '../controllers/patientController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeRole(['admin', 'staff']), patientController.getAllPatients);
router.get('/search', authenticateToken, authorizeRole(['admin', 'staff']), patientController.searchPatients);
router.get('/:id', authenticateToken, patientController.getPatientById);
router.post('/', authenticateToken, authorizeRole(['admin', 'staff']), patientController.createPatient);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'staff']), patientController.updatePatient);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), patientController.deletePatient);

export default router;
