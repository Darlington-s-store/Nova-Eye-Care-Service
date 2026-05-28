const db = require('../config/db');
const { sendSMS } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');
const { notifyAdmins } = require('../services/adminNotificationService');

const getAppointments = async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      query = `
        SELECT a.*, p.full_name as profile_name 
        FROM appointments a 
        LEFT JOIN profiles p ON a.user_id = p.id 
        ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
    } else {
      query = `
        SELECT * FROM appointments 
        WHERE user_id = $1
        ORDER BY appointment_date DESC, appointment_time DESC`;
      params = [req.user.id];
    }

    /** @type {any} */
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const getAppointmentById = async (req, res) => {
  const { id } = req.params;
  try {
    /** @type {any} */
    const result = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });
    
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && result.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const createAppointment = async (req, res) => {
  const { fullName, phone, email, service, appointmentDate, appointmentTime, notes } = req.body;
  const userId = req.user ? req.user.id : null;

  try {
    /** @type {any} */
    const newAppointment = await db.query(
      `INSERT INTO appointments 
      (user_id, full_name, phone, email, service, appointment_date, appointment_time, notes) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, fullName, phone, email, service, appointmentDate, appointmentTime, notes]
    );

    const appointment = newAppointment.rows[0];

    // Initial Confirmation Logic
    try {
      const formattedDate = new Date(appointmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const message = `NOVA EYE CARE: Hello ${fullName}, your appointment for ${service} is booked for ${formattedDate} at ${appointmentTime}. Thank you for choosing us!`;
      
      // 1. In-App Notification
      if (userId) {
        await db.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
          [userId, 'appointment', 'Appointment Booked', message]
        );
      }

      // 2. Send SMS
      if (phone) await sendSMS(phone, message);
      
      // 3. Send Email
      if (email) await sendEmail({
        to: email,
        subject: 'Appointment Confirmation - Nova Eye Care',
        html: `<p>Hello <strong>${fullName}</strong>,</p><p>Your appointment has been booked for <strong>${appointmentDate}</strong> at <strong>${appointmentTime}</strong>.</p>`
      });
    } catch (notifyErr) {
      console.error('Notification failed:', notifyErr);
    }

    // Admin Notification for new booking
    notifyAdmins(
      'New Appointment Booking',
      `${fullName} has booked an appointment for ${service} on ${appointmentDate} at ${appointmentTime}.`,
      'booking'
    );

    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { appointmentDate, appointmentTime, service, notes, fullName, phone, email, status } = req.body;

  try {
    // Security: Check ownership
    const checkQuery = 'SELECT user_id FROM appointments WHERE id = $1';
    /** @type {any} */
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });
    
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }
    
    /** @type {any} */
    const result = await db.query(
      `UPDATE appointments 
       SET appointment_date = $1, 
           appointment_time = $2, 
           service = $3, 
           notes = $4, 
           full_name = COALESCE($5, full_name),
           phone = COALESCE($6, phone),
           email = COALESCE($7, email),
           status = COALESCE($8, status),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 RETURNING *`,
      [appointmentDate, appointmentTime, service, notes, fullName, phone, email, status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // pending, confirmed, cancelled, completed

  try {
    /** @type {any} */
    const result = await db.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });
    
    /** @type {any} */
    const appointment = result.rows[0];

    // Status Change Notification Logic
    try {
      let statusMessage = '';
      if (status === 'confirmed') {
        statusMessage = `Your appointment at Nova Eye Care on ${appointment.appointment_date} has been CONFIRMED.`;
      } else if (status === 'cancelled') {
        statusMessage = `Your appointment at Nova Eye Care on ${appointment.appointment_date} has been CANCELLED.`;
      }

      if (statusMessage) {
        // 1. In-App Notification (if user_id exists)
        if (appointment.user_id) {
          await db.query(
            'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
            [appointment.user_id, 'appointment', `Appointment ${status.toUpperCase()}`, statusMessage]
          );
        }

        // 2. Send SMS
        if (appointment.phone) await sendSMS(appointment.phone, statusMessage);
        
        // 3. Send Email
        if (appointment.email) await sendEmail({
          to: appointment.email,
          subject: `Appointment Status Update: ${status.toUpperCase()}`,
          html: `<p>${statusMessage}</p>`
        });
      }
    } catch (notifyErr) {
      console.error('Status notification failed:', notifyErr);
    }

    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    // Security: Check ownership
    const checkQuery = 'SELECT user_id FROM appointments WHERE id = $1';
    /** @type {any} */
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });
    
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this appointment' });
    }

    await db.query('DELETE FROM appointments WHERE id = $1', [id]);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const getAvailableSlots = async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  if (!date) return res.status(400).json({ message: 'Date is required' });

  try {
    // Standard working hours: 09:00 to 17:00
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
      '15:00', '15:30', '16:00', '16:30'
    ];
    
    /** @type {any} */
    const bookedSlotsResult = await db.query(
      "SELECT appointment_time FROM appointments WHERE appointment_date = $1 AND status NOT IN ('cancelled')",
      [date]
    );

    const bookedSlots = bookedSlotsResult.rows.map((/** @type {any} */ row) => {
      // Normalize time to HH:MM
      return row.appointment_time.substring(0, 5);
    });

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({ date, availableSlots });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

module.exports = { 
  getAppointments, 
  getAppointmentById, 
  createAppointment, 
  updateAppointment, 
  updateAppointmentStatus, 
  deleteAppointment,
  getAvailableSlots
};
