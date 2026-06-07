import * as db from '../models/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalPatients = await db.getTotalPatientsCount();
    const todayAppointments = await db.getTodayAppointmentsCount();
    const pendingBills = await db.getPendingBillsCount();
    const doctorAvailability = await db.getActiveDoctorsCount();

    res.json({
      data: {
        totalPatients,
        todayAppointments,
        pendingBills,
        doctorAvailability
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export default { getDashboardStats };
