import * as db from '../models/db.js';

export const getAllRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const records = await db.getAllRecords(limit, offset);
    res.json({ data: records, pagination: { page, limit } });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

export const getRecordById = async (req, res) => {
  try {
    const record = await db.getRecordById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ data: record });
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
};

export const createRecord = async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId, visitDate, diagnosis, treatment, prescriptions, notes, followUpRequired, followUpDate } = req.body;
    if (!patientId || !doctorId || !visitDate) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const recordId = await db.createRecord(appointmentId, patientId, doctorId, visitDate, diagnosis, treatment, prescriptions, notes, followUpRequired, followUpDate);
    res.status(201).json({ message: 'Record created', data: { id: recordId } });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const { diagnosis, treatment, prescriptions, notes, followUpRequired, followUpDate } = req.body;
    const success = await db.updateRecord(req.params.id, diagnosis, treatment, prescriptions, notes, followUpRequired, followUpDate);
    if (!success) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record updated' });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
};

export default { getAllRecords, getRecordById, createRecord, updateRecord };
