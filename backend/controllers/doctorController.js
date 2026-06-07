import * as db from '../models/db.js';

export const getAllDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const doctors = await db.getAllDoctors(limit, offset);
    res.json({ data: doctors, pagination: { page, limit } });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await db.getDoctorById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ data: doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const { userId, specialization, licenseNumber, officeLocation } = req.body;
    if (!userId || !specialization || !licenseNumber) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const doctorId = await db.createDoctor(userId, specialization, licenseNumber, officeLocation);
    res.status(201).json({ message: 'Doctor created', data: { id: doctorId } });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { specialization, licenseNumber, officeLocation, isActive } = req.body;
    const success = await db.updateDoctor(req.params.id, specialization, licenseNumber, officeLocation, isActive);
    if (!success) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ message: 'Doctor updated' });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
};

export default { getAllDoctors, getDoctorById, createDoctor, updateDoctor };
