import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD, 
  },
});


export const sendEmailNotification = async (
  email: string,
  subject: string,
  message: string
): Promise<void> => {
  const mailOptions = {
    from: `"Task Manager" <${process.env.EMAIL_ADDRESS}>`,
    to: email,
    subject: subject,
    text: message,
  };

  await transporter.sendMail(mailOptions);
};
