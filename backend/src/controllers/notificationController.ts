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
    const { title, message, type, userEmail, read, company, severity, relatedOrderId, employeeName } = req.body;
    
    if (!title || !message || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newNotification = await Notification.create({
      title,
      message,
      type,
      userEmail,
      read: read || false,
      company: company || 'system',
      severity: severity || 'info',
      relatedOrderId,
      employeeName
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

// Mark all notifications as read for a given company
router.patch('/read-all', async (req, res) => {
  try {
    const { company } = req.body;
    const filter = company ? { company } : {};
    
    await Notification.updateMany(filter, { read: true });
    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// Delete a specific notification
router.delete('/:id', async (req, res) => {
  try {
    const deletedNotification = await Notification.findByIdAndDelete(req.params.id);
    if (!deletedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
