import { Router } from 'express';
import { Notification } from '../models/Notification';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { company } = req.query;
    const filter = company ? { company: company as string } : {};
    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    console.log("Notification fetched from MongoDB");
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log("Notification API called: POST /api/notifications", req.body);
    const { title, message, type, userEmail, read, company } = req.body;
    
    if (!title || !message || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newNotification = await Notification.create({
      title,
      message,
      type,
      userEmail,
      read: read || false,
      company: company || 'system'
    });

    console.log("Notification saved to MongoDB");
    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Added a route to mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

export default router;
