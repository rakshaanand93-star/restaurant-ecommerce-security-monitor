import { User, SecurityEvent, OrderSecurity } from '../models';

/**
 * Database Service
 * Provides utility functions for common database operations
 */

class DatabaseService {
  /**
   * Create or update user from Firebase
   */
  static async createOrUpdateUser(firebaseUid: string, userData: any) {
    try {
      let user = await User.findByFirebaseUid(firebaseUid);

      if (!user) {
        user = new User({
          firebaseUid,
          email: userData.email,
          displayName: userData.displayName || userData.email,
          emailVerified: userData.emailVerified || false,
          photoURL: userData.photoURL,
        });
      } else {
        // Update existing user
        user.email = userData.email;
        user.displayName = userData.displayName || user.displayName;
        user.emailVerified = userData.emailVerified || user.emailVerified;
        if (userData.photoURL) user.photoURL = userData.photoURL;
      }

      await user.save();
      return user;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(eventData: any) {
    try {
      const event = new SecurityEvent({
        userId: eventData.userId,
        eventType: eventData.eventType,
        severity: eventData.severity || 'medium',
        category: eventData.category,
        description: eventData.description,
        status: 'pending',
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        location: eventData.location,
        metadata: eventData.metadata,
      });

      await event.save();
      return event;
    } catch (error) {
      console.error('Error logging security event:', error);
      throw error;
    }
  }

  /**
   * Create order security record
   */
  static async createOrderSecurity(orderData: any) {
    try {
      const orderSecurity = new OrderSecurity({
        orderId: orderData.orderId,
        userId: orderData.userId,
        email: orderData.email,
        orderAmount: orderData.orderAmount,
        riskScore: orderData.riskScore || 0,
        riskLevel: this.calculateRiskLevel(orderData.riskScore || 0),
        fraudDetected: orderData.fraudDetected || false,
        fraudReasons: orderData.fraudReasons || [],
        deliveryAddress: orderData.deliveryAddress,
        billingAddress: orderData.billingAddress,
        shippingMethod: orderData.shippingMethod,
        paymentMethod: orderData.paymentMethod,
        ipAddress: orderData.ipAddress,
        userAgent: orderData.userAgent,
        deviceFingerprint: orderData.deviceFingerprint,
        orderItems: orderData.orderItems,
      });

      await orderSecurity.save();
      return orderSecurity;
    } catch (error) {
      console.error('Error creating order security record:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStatistics() {
    try {
      const [userStats, eventStats, fraudStats] = await Promise.all([
        User.countByRole(),
        SecurityEvent.getStatistics(7),
        OrderSecurity.getFraudStats(7),
      ]);

      return {
        users: userStats,
        security: eventStats[0],
        fraud: fraudStats[0],
      };
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw error;
    }
  }

  /**
   * Get high-risk summary
   */
  static async getHighRiskSummary() {
    try {
      const [criticalEvents, highRiskOrders, pendingReviews] = await Promise.all([
        SecurityEvent.findCriticalEvents(),
        OrderSecurity.findHighRiskOrders(),
        OrderSecurity.findPendingReview(),
      ]);

      return {
        criticalSecurityEvents: criticalEvents.length,
        highRiskOrders: highRiskOrders.length,
        pendingReviews: pendingReviews.length,
      };
    } catch (error) {
      console.error('Error fetching high-risk summary:', error);
      throw error;
    }
  }

  /**
   * Calculate risk level based on risk score
   */
  private static calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get user security summary
   */
  static async getUserSecuritySummary(userId: string) {
    try {
      const [recentEvents, userOrders] = await Promise.all([
        SecurityEvent.findByUser(userId, 10),
        OrderSecurity.findByUser(userId, 10),
      ]);

      return {
        recentSecurityEvents: recentEvents,
        recentOrders: userOrders,
      };
    } catch (error) {
      console.error('Error fetching user security summary:', error);
      throw error;
    }
  }
}

export default DatabaseService;
