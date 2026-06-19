const nodemailer = require('nodemailer');

const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASS,
  MAIL_FROM,
} = process.env;

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (!MAIL_HOST || !MAIL_PORT) {
    // eslint-disable-next-line no-console
    console.warn('Mail transport is not fully configured; emails may not be sent');
  }

  transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT) || 587,
    secure: Number(MAIL_PORT) === 465,
    auth:
      MAIL_USER && MAIL_PASS
        ? {
            user: MAIL_USER,
            pass: MAIL_PASS,
          }
        : undefined,
  });

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const tx = getTransporter();

  const from = MAIL_FROM || MAIL_USER;

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  await tx.sendMail(mailOptions);
}

module.exports = sendEmail;

