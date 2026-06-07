import express from 'express';
import * as billingController from '../controllers/billingController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeRole(['admin', 'staff']), billingController.getAllInvoices);
router.get('/:id', authenticateToken, billingController.getInvoiceById);
router.post('/', authenticateToken, authorizeRole(['admin', 'staff']), billingController.createInvoice);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'staff']), billingController.updateInvoiceStatus);

export default router;
