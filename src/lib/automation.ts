import { toast } from "sonner";

/**
 * AUTOMATION HUB: Nova Eye Care
 * This utility handles all patient communications (Emails & Notifications)
 * 
 * To make these emails "Live":
 * 1. Sign up for Resend.com
 * 2. Deploy a Supabase Edge Function to call the Resend API
 * 3. Replace the 'console.log' below with a fetch call to your Edge Function
 */

type EmailData = {
  to: string;
  subject: string;
  body: string;
  patientName: string;
};

interface AppointmentInfo {
  full_name: string;
  email: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
}

const sendEmail = async (data: EmailData) => {
  // SIMULATION: In a real app, this would hit a Supabase Edge Function connected to Resend
  console.log(`[EMAIL SENT TO ${data.to}] Subject: ${data.subject}`);
  console.log(`Body: ${data.body}`);
  
  // You can view these logs in your browser console (F12) to see the content being "sent"
  return true;
};

export const automation = {
  /**
   * Called when a patient successfully books an appointment
   */
  onAppointmentBooked: async (appt: AppointmentInfo) => {
    await sendEmail({
      to: appt.email,
      patientName: appt.full_name,
      subject: "Appointment Received - Nova Eye Care",
      body: `Hello ${appt.full_name},\n\nWe have received your booking for ${appt.service} on ${appt.appointment_date} at ${appt.appointment_time}. Our team will review this and confirm shortly.\n\nThank you for choosing Nova Eye Care!`
    });
  },

  /**
   * Called when an admin updates an appointment status
   */
  onStatusUpdated: async (appt: AppointmentInfo, newStatus: string) => {
    const messages: Record<string, string> = {
      confirmed: `Great news! Your appointment for ${appt.service} on ${appt.appointment_date} has been CONFIRMED. We look forward to seeing you.`,
      completed: `Your visit for ${appt.service} on ${appt.appointment_date} is now marked as complete. Thank you for visiting Nova Eye Care. Please feel free to leave a review!`,
      cancelled: `We are writing to inform you that your appointment for ${appt.service} on ${appt.appointment_date} has been cancelled. If this was a mistake, please contact us.`
    };

    if (messages[newStatus]) {
      await sendEmail({
        to: appt.email,
        patientName: appt.full_name,
        subject: `Appointment Update: ${newStatus.toUpperCase()}`,
        body: `Hello ${appt.full_name},\n\n${messages[newStatus]}\n\nBest regards,\nNova Eye Care Team`
      });
    }
  },

  /**
   * Called on account creation (Manual welcome)
   */
  onWelcomeUser: async (email: string, name: string) => {
    await sendEmail({
      to: email,
      patientName: name,
      subject: "Welcome to Nova Eye Care Portal",
      body: `Hello ${name},\n\nYour account has been successfully created. You can now manage your appointments and view your eye health history online.\n\nLogin here: ${window.location.origin}/auth`
    });
  }
};
