import express, { Request, Response } from 'express';
import nodemailer, { Transporter } from 'nodemailer';

const router = express.Router();


const transporter: Transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_ADDRESS, 
        pass: process.env.EMAIL_PASSWORD, 
    },
});

// Interface to type the body of the request
interface EmailRequestBody {
    emails: string[];
    projectName: string;
    projectKey: string;
    projectLead: string;
}

// Route to send emails
router.post("/email/send", async (req: Request<{}, {}, EmailRequestBody>, res: Response) => {
    try {
        const { emails, projectName, projectKey, projectLead } = req.body;

        
        console.log("📩 Received request:", req.body);

       
        if (!emails || !projectName || !projectKey || !projectLead) {
            return res.status(400).json({ success: false, error: "All fields are required" });
        }

       
        const emailMessage = `
            <h2>🚀 Project Details</h2>
            <p><strong>Name of the Project:</strong> ${projectName}</p>
            <p><strong>Lead of the Project:</strong> ${projectLead}</p>
            <p>You have been assigned to a new project. Click the button below to view the project dashboard.</p>
            <a href='http://localhost:8081/src/ProjectDashboard/${projectKey}' 
               style='display:inline-block; padding:10px 20px; background-color:#007bff; color:#ffffff; text-decoration:none; border-radius:5px;'>
               View Project Dashboard
            </a>
        `;

        // Mail options
        let mailOptions = {
            from: `"Task Manager" <${process.env.EMAIL_ADDRESS}>`,
            to: emails.join(","), // Join multiple emails into a single string
            subject: `Project Assigned: ${projectName} (${projectKey})`,
            html: emailMessage, // Send as HTML
        };

        // Send email
        let info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);

        return res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (error) {
        console.error(" Error sending email:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
});

export default router;
