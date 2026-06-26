async function testKPIs() {
  const backendUrl = 'http://localhost:4000';
  
  // 1. Fetch initial Zomato KPIs
  let res = await fetch(`${backendUrl}/api/dashboard/kpis?company=zomato`);
  let kpis = await res.json();
  console.log('Initial Zomato KPIs:', kpis);

  // 2. Create an employee
  res = await fetch(`${backendUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'restaurant4@gmail.com',
      password: 'TestPass123!',
      displayName: 'Restaurant 4',
      role: 'employee',
      company: 'zomato',
      status: 'active'
    })
  });
  let user = await res.json();
  console.log('Created User Role:', user.role);

  // 3. Fetch Zomato KPIs again
  res = await fetch(`${backendUrl}/api/dashboard/kpis?company=zomato`);
  kpis = await res.json();
  console.log('New Zomato KPIs:', kpis);

  // 4. Clean up
  await fetch(`${backendUrl}/api/users/${user._id}?company=zomato`, { method: 'DELETE' });
  console.log('Cleaned up test user');
}

testKPIs();
