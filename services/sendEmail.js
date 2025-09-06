const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Or use AWS SES, Outlook, etc.
  auth: {
    user: process.env.GMAIL_COMPANY,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: `"Real Estate Team" <${process.env.GMAIL_COMPANY}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
