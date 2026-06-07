import * as db from '../models/db.js';

export const getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const appointments = await db.getAllAppointments(limit, offset);
    res.json({ data: appointments, pagination: { page, limit } });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await db.getAppointmentById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ data: appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, durationMinutes, notes } = req.body;
    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const appointmentId = await db.createAppointment(patientId, doctorId, appointmentDate, durationMinutes || 30, notes);
    res.status(201).json({ message: 'Appointment created', data: { id: appointmentId } });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { appointmentDate, durationMinutes, status, notes } = req.body;
    const success = await db.updateAppointment(req.params.id, appointmentDate, durationMinutes, status, notes);
    if (!success) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment updated' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

export default { getAllAppointments, getAppointmentById, createAppointment, updateAppointment };
