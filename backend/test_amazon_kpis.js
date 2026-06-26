async function testKPIs() {
  const backendUrl = 'http://localhost:4000';
  
  // 1. Fetch initial Amazon KPIs
  let res = await fetch(`${backendUrl}/api/dashboard/kpis?company=amazon`);
  let kpis = await res.json();
  console.log('Initial Amazon KPIs:', kpis);

  // 2. Create a warehouse user
  res = await fetch(`${backendUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'wh999@gmail.com',
      password: 'TestPass123!',
      displayName: 'Warehouse 999',
      role: 'warehouse',
      company: 'amazon',
      status: 'active'
    })
  });
  let user = await res.json();
  console.log('Created User Role:', user.role);

  // 3. Fetch KPIs after creation
  res = await fetch(`${backendUrl}/api/dashboard/kpis?company=amazon`);
  kpis = await res.json();
  console.log('After Creation KPIs:', kpis.amazonWarehouse);

  // 4. Disable user
  res = await fetch(`${backendUrl}/api/users/${user._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'inactive' })
  });

  // 5. Fetch KPIs after disable
  res = await fetch(`${backendUrl}/api/dashboard/kpis?company=amazon`);
  kpis = await res.json();
  console.log('After Disable KPIs:', kpis.amazonWarehouse);

  // 6. Enable user
  res = await fetch(`${backendUrl}/api/users/${user._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'active' })
  });

  // 7. Fetch KPIs after enable
  res = await fetch(`${backendUrl}/api/dashboard/kpis?company=amazon`);
  kpis = await res.json();
  console.log('After Enable KPIs:', kpis.amazonWarehouse);

  // 8. Delete user
  await fetch(`${backendUrl}/api/users/${user._id}?company=amazon`, { method: 'DELETE' });

  // 9. Fetch KPIs after delete
  res = await fetch(`${backendUrl}/api/dashboard/kpis?company=amazon`);
  kpis = await res.json();
  console.log('After Delete KPIs:', kpis.amazonWarehouse);

}

testKPIs();
