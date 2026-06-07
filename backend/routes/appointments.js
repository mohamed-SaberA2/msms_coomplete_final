import express from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, appointmentController.getAllAppointments);
router.get('/:id', authenticateToken, appointmentController.getAppointmentById);
router.post('/', authenticateToken, appointmentController.createAppointment);
router.put('/:id', authenticateToken, appointmentController.updateAppointment);

export default router;
