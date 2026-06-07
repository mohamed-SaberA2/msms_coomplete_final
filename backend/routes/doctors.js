import express from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, doctorController.getAllDoctors);
router.get('/:id', authenticateToken, doctorController.getDoctorById);
router.post('/', authenticateToken, authorizeRole(['admin']), doctorController.createDoctor);
router.put('/:id', authenticateToken, authorizeRole(['admin']), doctorController.updateDoctor);

export default router;
