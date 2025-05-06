import express from 'express';
import * as userController from '../controllers/user';
import User from '../models/user';
import { validateUserData } from '../utils/validator';
import { sendEmailNotification } from '../utils/email';

const router = express.Router();

// User Routes
router.route('/')
  .get(userController.getAllUsers)
  .post(validateUserData, userController.createUser);

router.route('/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

// Fetch emails of assignees from the database
router.post('/get-emails', async (req: express.Request, res: express.Response) => {
  try {
    const { assignees }: { assignees: string[] } = req.body;

    if (!assignees || assignees.length === 0) {
      return res.status(400).json({ success: false, error: 'No assignees provided' });
    }

    console.log('📥 Fetching emails for assignees:', assignees);

    const users = await User.find({ _id: { $in: assignees } }, 'email');
    const emails = users.map((user: any) => user.email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(404).json({ success: false, error: 'No emails found for given assignees' });
    }

    res.json({ success: true, emails });
  } catch (error: any) {
    console.error(' Error fetching emails:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Send email notifications
router.post('/email/send', async (req: express.Request, res: express.Response) => {
  try {
    console.log('📥 Received request body:', req.body);

    const { emails, subject, message }: { emails: string[]; subject: string; message: string } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid email list' });
    }

    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Missing subject or message' });
    }

    console.log(' Sending emails to:', emails);

    for (const email of emails) {
      await sendEmailNotification(email, subject, message);
    }

    res.json({ success: true, message: 'Emails sent successfully' });
  } catch (error: any) {
    console.error(' Email sending error:', error);
    res.status(500).json({ success: false, error: 'Failed to send emails' });
  }
});

export default router;
