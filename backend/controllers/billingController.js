import * as db from '../models/db.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const invoices = await db.getAllInvoices(limit, offset);
    res.json({ data: invoices, pagination: { page, limit } });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await db.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ data: invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { patientId, appointmentId, amount, description, dueDate } = req.body;
    if (!patientId || !amount) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const invoiceId = await db.createInvoice(patientId, appointmentId, invoiceNumber, amount, description, dueDate);
    res.status(201).json({ message: 'Invoice created', data: { id: invoiceId, invoiceNumber } });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paidDate } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const success = await db.updateInvoiceStatus(req.params.id, status, paidDate);
    if (!success) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice updated' });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

export default { getAllInvoices, getInvoiceById, createInvoice, updateInvoiceStatus };
