/**
 * Database Connection Test Script
 * Run with: npm run test:db or ts-node src/scripts/testDatabase.ts
 *
 * This script tests:
 * 1. MongoDB connection
 * 2. Model initialization
 * 3. Basic CRUD operations
 * 4. Database statistics
 */

import dotenv from 'dotenv';
import { initializeMongoose, closeMongoose, getMongooseStatus } from '../config/mongodb';
import { User, SecurityEvent, OrderSecurity } from '../models';
import DatabaseService from '../services/DatabaseService';

dotenv.config();

async function testDatabase() {
  console.log('\n🧪 Testing MongoDB Connection and Models\n');
  console.log('=' .repeat(60));

  try {
    // 1. Test connection
    console.log('\n1️⃣  Testing MongoDB Connection...');
    await initializeMongoose();
    const status = getMongooseStatus();
    console.log(`   ✓ Connected: ${status.connected}`);
    console.log(`   ✓ Database: ${status.database}`);
    console.log(`   ✓ Host: ${status.host}`);

    // 2. Test User Model
    console.log('\n2️⃣  Testing User Model...');
    const testUser = new User({
      firebaseUid: `test-uid-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      displayName: 'Test User',
      role: 'user',
      status: 'active',
    });
    const savedUser = await testUser.save();
    console.log(`   ✓ User created with ID: ${savedUser._id}`);
    console.log(`   ✓ Email: ${savedUser.email}`);

    // Test find by Firebase UID
    const foundUser = await User.findByFirebaseUid(testUser.firebaseUid);
    console.log(`   ✓ User found by Firebase UID: ${foundUser?.email}`);

    // 3. Test SecurityEvent Model
    console.log('\n3️⃣  Testing SecurityEvent Model...');
    const testEvent = new SecurityEvent({
      userId: savedUser.firebaseUid,
      eventType: 'test_event',
      category: 'system',
      severity: 'low',
      description: 'Test security event',
      status: 'pending',
    });
    const savedEvent = await testEvent.save();
    console.log(`   ✓ Security event created with ID: ${savedEvent._id}`);
    console.log(`   ✓ Event type: ${savedEvent.eventType}`);

    // Test find pending events
    const pendingEvents = await SecurityEvent.findPending();
    console.log(`   ✓ Found ${pendingEvents.length} pending events`);

    // 4. Test OrderSecurity Model
    console.log('\n4️⃣  Testing OrderSecurity Model...');
    const testOrder = new OrderSecurity({
      orderId: `order-${Date.now()}`,
      userId: savedUser.firebaseUid,
      email: savedUser.email,
      orderAmount: 99.99,
      riskScore: 25,
      riskLevel: 'low',
      fraudDetected: false,
      fraudReasons: [],
      paymentMethod: 'credit_card',
    });
    const savedOrder = await testOrder.save();
    console.log(`   ✓ Order security record created with ID: ${savedOrder._id}`);
    console.log(`   ✓ Order ID: ${savedOrder.orderId}`);
    console.log(`   ✓ Risk Level: ${savedOrder.riskLevel}`);

    // Test find by user
    const userOrders = await OrderSecurity.findByUser(savedUser.firebaseUid);
    console.log(`   ✓ Found ${userOrders.length} orders for user`);

    // 5. Test Database Service
    console.log('\n5️⃣  Testing Database Service...');

    // Create/update user via service
    const serviceUser = await DatabaseService.createOrUpdateUser(
      `service-test-${Date.now()}`,
      {
        email: `service-${Date.now()}@example.com`,
        displayName: 'Service Test User',
      }
    );
    console.log(`   ✓ User created via DatabaseService: ${serviceUser.email}`);

    // Log security event via service
    const serviceEvent = await DatabaseService.logSecurityEvent({
      userId: serviceUser.firebaseUid,
      eventType: 'service_test',
      category: 'system',
      severity: 'low',
      description: 'Test from DatabaseService',
    });
    console.log(`   ✓ Security event logged via DatabaseService: ${serviceEvent._id}`);

    // Get high-risk summary
    const highRiskSummary = await DatabaseService.getHighRiskSummary();
    console.log(`   ✓ High-risk summary retrieved`);
    console.log(`     - Critical events: ${highRiskSummary.criticalSecurityEvents}`);
    console.log(`     - High-risk orders: ${highRiskSummary.highRiskOrders}`);
    console.log(`     - Pending reviews: ${highRiskSummary.pendingReviews}`);

    // 6. Test Collections
    console.log('\n6️⃣  Testing Collections...');
    const userCount = await User.countDocuments();
    const eventCount = await SecurityEvent.countDocuments();
    const orderCount = await OrderSecurity.countDocuments();

    console.log(`   ✓ Users in database: ${userCount}`);
    console.log(`   ✓ Security events in database: ${eventCount}`);
    console.log(`   ✓ Order security records in database: ${orderCount}`);

    // 7. Test Aggregations
    console.log('\n7️⃣  Testing Aggregations...');
    const userStats = await User.countByRole();
    console.log(`   ✓ Users by role: ${JSON.stringify(userStats)}`);

    const eventStats = await SecurityEvent.getStatistics(7);
    if (eventStats[0]) {
      console.log(`   ✓ Event statistics retrieved`);
      if (eventStats[0].total[0]) {
        console.log(`     - Total events (7 days): ${eventStats[0].total[0].count}`);
      }
    }

    // 8. Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ firebaseUid: { $regex: '^test-' } });
    await User.deleteMany({ firebaseUid: { $regex: '^service-' } });
    await SecurityEvent.deleteMany({ userId: { $regex: '^test-' } });
    await SecurityEvent.deleteMany({ userId: { $regex: '^service-' } });
    await OrderSecurity.deleteMany({ orderId: { $regex: '^order-' } });
    console.log(`   ✓ Test data cleaned up`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All database tests passed!\n');
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    console.log('\n' + '='.repeat(60));
    process.exit(1);
  } finally {
    try {
      await closeMongoose();
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Run tests
testDatabase();
