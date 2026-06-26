async function test() {
  try {
    console.log('1. Creating user');
    let res = await fetch('http://localhost:4000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'warehouse22@gmail.com', password: 'TestPass123!', displayName: 'Warehouse 22' })
    });
    let data = await res.json();
    console.log('Create result:', data);

    const id = data._id;
    if (!id) throw new Error('No id returned');

    // Simulate desync by only deleting from MongoDB
    const mongoose = require('mongoose');
    const { User } = require('./src/models/User');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureguard');
    await User.findByIdAndDelete(id);
    console.log('2. Deleted from MongoDB ONLY. Firebase still has warehouse22@gmail.com');
    
    console.log('3. Recreating user (should recover)');
    res = await fetch('http://localhost:4000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'warehouse22@gmail.com', password: 'TestPass123!', displayName: 'Warehouse 22' })
    });
    data = await res.json();
    console.log('Recreate result (Recovered):', data);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
require('dotenv').config();
test();
