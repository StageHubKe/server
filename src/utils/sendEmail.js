import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationUrl = `${process.env.CLIENT_URL}/verify/${token}`;

  const mailOptions = {
    from: `"Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email address",
    html: `
      <h2>Welcome!</h2>
      <p>Please verify your email by clicking the button below:</p>
      <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:white;text-decoration:none;border-radius:5px;">
        Verify Email
      </a>
      <p>If the button doesn't work, use this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
