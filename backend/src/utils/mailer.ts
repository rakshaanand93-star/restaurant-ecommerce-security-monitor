import nodemailer from 'nodemailer';
import dns from 'dns';

// Force Node.js to prioritize IPv4 over IPv6 when resolving addresses
// This prevents ENETUNREACH errors in environments without IPv6 routing
dns.setDefaultResultOrder('ipv4first');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });
};

const sendMailSafely = async (mailOptions: nodemailer.SendMailOptions) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[Mailer] SMTP credentials not configured. Skipping email to ${mailOptions.to}`);
    return false;
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"SecureGuard AI" <${process.env.SMTP_USER}>`,
      ...mailOptions
    });

    console.log(`[Mailer] Successfully sent email to ${mailOptions.to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Mailer] Failed to send email to ${mailOptions.to}:`, error);
    return false;
  }
};
export const sendEmployeeNewOrderEmail = async (order: any) => {
  const mailOptions = {
    to: 'secureguard.notifications@gmail.com',
    subject: `New Order Received - ${order.company === 'amazon' ? 'Amazon' : 'Zomato'}`,
    text: `A new customer order has been received. Please log in to the Employee Dashboard and Accept or Reject the order.

Company: ${order.company || 'Unknown'}
Order ID: ${order.orderId || 'Unknown'}
Customer Name: ${order.customerName || order.customerEmail || 'Unknown'}
Customer Email: ${order.customerEmail || 'Unknown'}
Customer Phone: ${order.customerPhone || 'N/A'}
Delivery Address: ${order.shippingAddress ? JSON.stringify(order.shippingAddress) : 'N/A'}
Ordered Items: ${order.items?.map((i: any) => `${i.name || 'Item'} (x${i.quantity || 1})`).join(', ') || 'N/A'}
Total Amount: ${order.amount || 0}
Order Date & Time: ${new Date().toLocaleString()}
Current Status: Pending
`
  };
  return sendMailSafely(mailOptions);
};

export const sendAdminDeviceApprovalEmail = async (deviceData: any) => {
  const mailOptions = {
    to: 'araksha0914@gmail.com',
    subject: 'Employee Login Approval Required',
    text: `A new employee login requires approval.

Company: ${deviceData.company || 'Unknown'}
Employee Name: ${deviceData.employeeName || deviceData.email || 'Unknown'}
Employee Email: ${deviceData.email || 'Unknown'}
Role: ${deviceData.role || 'employee'}
Device Name: ${deviceData.newDevice || 'Unknown'}
Browser: ${deviceData.browser || 'Unknown'}
Operating System: ${deviceData.os || 'Unknown'}
IP Address: ${deviceData.ipAddress || 'Unknown'}
Location: ${deviceData.location || 'Unknown'}
Login Time: ${new Date().toLocaleString()}

Please log in to the Admin Dashboard to Approve or Reject this login request.
`
  };
  return sendMailSafely(mailOptions);
};

export const sendCustomerOrderAcceptedEmail = async (order: any) => {
  if (!order.customerEmail) {
    console.warn('[Mailer] Missing customer email for accepted order:', order.orderId);
    return false;
  }

  const mailOptions = {
    to: order.customerEmail,
    subject: `Your Order Has Been Accepted`,
    text: `Your order has been accepted and is now being prepared.

Customer Name: ${order.customerName || order.customerEmail || 'Customer'}
Order ID: ${order.orderId || 'Unknown'}
Company: ${order.company || 'Unknown'}
Ordered Items: ${order.items?.map((i: any) => `${i.name || 'Item'} (x${i.quantity || 1})`).join(', ') || 'N/A'}
Total Amount: ${order.amount || 0}
Status: Accepted
`
  };
  return sendMailSafely(mailOptions);
};

export const sendCustomerOrderRejectedEmail = async (order: any) => {
  if (!order.customerEmail) {
    console.warn('[Mailer] Missing customer email for rejected order:', order.orderId);
    return false;
  }

  const mailOptions = {
    to: order.customerEmail,
    subject: `Your Order Has Been Rejected`,
    text: `We are sorry. Your order could not be accepted.

Customer Name: ${order.customerName || order.customerEmail || 'Customer'}
Order ID: ${order.orderId || 'Unknown'}
Company: ${order.company || 'Unknown'}
Status: Rejected
Rejection Reason: ${order.rejectionReason || 'No reason provided.'}
`
  };
  return sendMailSafely(mailOptions);
};

export const sendCustomerOrderCompletedEmail = async (order: any) => {
  if (!order.customerEmail) {
    console.warn('[Mailer] Missing customer email for completed order:', order.orderId);
    return false;
  }

  const mailOptions = {
    to: order.customerEmail,
    subject: `Your Order Has Been Delivered`,
    text: `Customer Name: ${order.customerName || order.customerEmail || 'Customer'}
Order ID: ${order.orderId || 'Unknown'}
Company: ${order.company || 'Unknown'}
Ordered Items: ${order.items?.map((i: any) => `${i.name || 'Item'} (x${i.quantity || 1})`).join(', ') || 'N/A'}
Total Amount: ${order.amount || 0}
Delivery Status: Completed
Delivery Date & Time: ${new Date().toLocaleString()}
Thank you for choosing us.`
  };
  return sendMailSafely(mailOptions);
};
