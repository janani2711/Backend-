import nodemailer from "nodemailer";

// Define return type
interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Create the email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Define the sendEmailNotification function
const sendEmailNotification = async (
  email: string,
  subject: string,
  message: string
): Promise<EmailResponse> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject,
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent: " + info.response);

    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};

export { sendEmailNotification };
