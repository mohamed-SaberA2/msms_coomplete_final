import * as db from '../models/db.js';

export const getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const patients = await db.getAllPatients(limit, offset);
    const totalCount = await db.getTotalPatientsCount();

    res.json({
      data: patients,
      pagination: { page, limit, total: totalCount }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patient = await db.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ data: patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

export const createPatient = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact, userId } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const patientId = await db.createPatient(
      firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact, userId
    );

    res.status(201).json({
      message: 'Patient created successfully',
      data: { id: patientId }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact } = req.body;

    const success = await db.updatePatient(
      req.params.id, firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact
    );

    if (!success) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient updated successfully' });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const success = await db.deletePatient(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};

export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const patients = await db.searchPatients(q);
    res.json({ data: patients });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
};

export default { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, searchPatients };
