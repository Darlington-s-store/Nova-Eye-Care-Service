const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
    console.warn('Resend API key not configured. Email not sent:', subject);
    return;
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Nova Eye Care <noreply@novaeyecare.com>',
      to: [to],
      subject: subject,
      html: html,
    });

    return data;
  } catch (err) {
    console.error('Error sending email via Resend:', err);
    throw err;
  }
};

module.exports = { sendEmail };
