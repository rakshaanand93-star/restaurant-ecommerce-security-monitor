import { Router, Request, Response } from 'express';
import { sendAdminDeviceApprovalEmail } from '../utils/mailer';

const router = Router();

// POST /api/email/notify-admin-device
router.post('/notify-admin-device', async (req: Request, res: Response) => {
  try {
    const deviceData = req.body;
    if (!deviceData || !deviceData.email) {
      return res.status(400).json({ error: 'Device data is required' });
    }

    // Fire and forget email
    sendAdminDeviceApprovalEmail(deviceData).catch(console.error);
    
    return res.json({ success: true, message: 'Notification sent to admin' });
  } catch (error) {
    console.error('Failed to notify admin:', error);
    return res.status(500).json({ error: 'Failed to notify admin' });
  }
});

export default router;
