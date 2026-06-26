async function testIsolation() {
  try {
    const backendUrl = 'http://localhost:4000';
    
    console.log('--- Testing Amazon Context ---');
    // 1. Create Amazon user
    let res = await fetch(`${backendUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amazon_wh_iso1@gmail.com', password: 'TestPass123!', displayName: 'Amazon Iso WH', role: 'warehouse', company: 'amazon' })
    });
    let data = await res.json();
    console.log('Amazon User Created:', data.email);
    const amazonUserId = data._id;

    // 2. Fetch Amazon KPIs
    res = await fetch(`${backendUrl}/api/dashboard/kpis?company=amazon`);
    data = await res.json();
    console.log('Amazon KPIs - Total Users:', data.totalUsers);

    console.log('--- Testing Zomato Context ---');
    // 3. Create Zomato user
    res = await fetch(`${backendUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'zomato_rest_iso1@gmail.com', password: 'TestPass123!', displayName: 'Zomato Iso Rest', role: 'restaurant', company: 'zomato' })
    });
    data = await res.json();
    console.log('Zomato User Created:', data.email);
    const zomatoUserId = data._id;

    // 4. Fetch Zomato KPIs
    res = await fetch(`${backendUrl}/api/dashboard/kpis?company=zomato`);
    data = await res.json();
    console.log('Zomato KPIs - Total Users:', data.totalUsers);

    console.log('--- Fetching Isolated User Lists ---');
    // 5. Amazon Users
    res = await fetch(`${backendUrl}/api/users?company=amazon`);
    let amazonUsers = await res.json();
    console.log('Amazon User Count:', amazonUsers.length);
    console.log('Contains Zomato user?', amazonUsers.some(u => u.email === 'zomato_rest_iso1@gmail.com'));

    // 6. Zomato Users
    res = await fetch(`${backendUrl}/api/users?company=zomato`);
    let zomatoUsers = await res.json();
    console.log('Zomato User Count:', zomatoUsers.length);
    console.log('Contains Amazon user?', zomatoUsers.some(u => u.email === 'amazon_wh_iso1@gmail.com'));

    console.log('--- Clean Up ---');
    await fetch(`${backendUrl}/api/users/${amazonUserId}?company=amazon`, { method: 'DELETE' });
    await fetch(`${backendUrl}/api/users/${zomatoUserId}?company=zomato`, { method: 'DELETE' });
    console.log('Cleaned up users');

  } catch (err) {
    console.error(err);
  }
}

testIsolation();
