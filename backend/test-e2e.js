// End-to-End Automated Verification Script for FleetFlow
const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🔍 Starting End-to-End System Verification Suite');
  console.log(`🌐 Target Server: ${BASE_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Endpoint
    console.log('--- 1. Testing System Health & Root Meta ---');
    const healthRes = await fetch(`${BASE_URL}/`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'Root endpoint status is 200 OK');
    assert(healthJson.status === 'online', 'System status is online');
    assert(healthJson.project.includes('FleetFlow'), 'Project metadata name verified');

    // 2. Auth Flow
    console.log('\n--- 2. Testing Authentication & JWT Flow ---');
    const testEmail = `tester_${Date.now()}@fleetflow.io`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Tester',
        email: testEmail,
        password: 'TestPassword@123',
        role: 'admin',
      }),
    });
    const regJson = await regRes.json();
    assert(regRes.status === 201, 'User registration returns 201 Created');
    assert(regJson.data?.token, 'JWT Token issued upon registration');

    const token = regJson.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
    const meJson = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(meJson.data.email === testEmail, 'Verified authenticated identity matches token');

    // 3. Vehicle CRUD Operations
    console.log('\n--- 3. Testing Vehicle CRUD Operations ---');
    const testVehNum = `TEST-${Math.floor(100 + Math.random() * 900)}`;
    const createVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        vehicleNumber: testVehNum,
        vehicleType: 'Truck',
        model: 'F-250 Super Duty',
        manufacturer: 'Ford',
        currentStatus: 'Active',
        mileage: 12500,
        vehicleHealthStatus: 'Good',
        fuelType: 'Diesel',
        assignedDriver: 'Test Driver',
        department: 'Operations',
      }),
    });
    const createVehJson = await createVehRes.json();
    assert(createVehRes.status === 201, 'Vehicle created successfully (201 Created)');
    assert(createVehJson.data.vehicleNumber === testVehNum, 'Vehicle number saved correctly');

    const vehicleId = createVehJson.data._id;

    // Read single vehicle
    const getVehRes = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, { headers: authHeaders });
    const getVehJson = await getVehRes.json();
    assert(getVehRes.status === 200, 'GET /api/vehicles/:id returns 200 OK');
    assert(getVehJson.data.model === 'F-250 Super Duty', 'Vehicle model verified');

    // Update vehicle
    const updateVehRes = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ mileage: 13000, notes: 'Updated via test suite' }),
    });
    const updateVehJson = await updateVehRes.json();
    assert(updateVehRes.status === 200, 'PUT /api/vehicles/:id updates successfully');
    assert(updateVehJson.data.mileage === 13000, 'Mileage updated to 13000');

    // 4. Service Scheduling & Completion
    console.log('\n--- 4. Testing Service Scheduling & Completion ---');
    const createSrvRes = await fetch(`${BASE_URL}/api/services`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        vehicle: vehicleId,
        serviceType: 'Routine Oil & Filter',
        scheduledDate: new Date().toISOString(),
        cost: 150,
        serviceProvider: 'Fleet QuickCare',
        status: 'Scheduled',
      }),
    });
    const createSrvJson = await createSrvRes.json();
    assert(createSrvRes.status === 201, 'Service scheduled successfully (201 Created)');
    const serviceId = createSrvJson.data._id;

    // Complete service & verify vehicle odometer update
    const completeSrvRes = await fetch(`${BASE_URL}/api/services/${serviceId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'Completed',
        odometerAtService: 13200,
        technicianNotes: 'Oil and filter replaced. Verified all fluid levels.',
      }),
    });
    assert(completeSrvRes.status === 200, 'Service completed successfully');

    // Check vehicle mileage updated by service
    const vehAfterSrv = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, { headers: authHeaders });
    const vehAfterSrvJson = await vehAfterSrv.json();
    assert(vehAfterSrvJson.data.mileage === 13200, 'Vehicle mileage updated to service odometer reading');

    // 5. Insurance Management & Alerts
    console.log('\n--- 5. Testing Insurance Policy & Alerts ---');
    const policyNum = `POL-${Date.now()}`;
    const createInsRes = await fetch(`${BASE_URL}/api/insurance`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        vehicle: vehicleId,
        provider: 'Liberty Commercial',
        policyNumber: policyNum,
        coverageType: 'Comprehensive Fleet',
        premiumAmount: 1800,
        startDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ahead
        contactNumber: '+1 800 555 1234',
      }),
    });
    const createInsJson = await createInsRes.json();
    assert(createInsRes.status === 201, 'Insurance policy registered successfully');
    assert(createInsJson.data.renewalStatus === 'Expiring Soon', 'Policy status calculated as Expiring Soon (<=30 days)');

    const alertsRes = await fetch(`${BASE_URL}/api/insurance/alerts`, { headers: authHeaders });
    const alertsJson = await alertsRes.json();
    assert(alertsRes.status === 200, 'GET /api/insurance/alerts returns 200 OK');
    assert(alertsJson.data.some((a) => a.policyNumber === policyNum), 'New expiring policy appeared in alerts');

    // 6. Maintenance Work Orders & Status Transitions
    console.log('\n--- 6. Testing Maintenance Workflow & Vehicle Status ---');
    const createMntRes = await fetch(`${BASE_URL}/api/maintenance`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        vehicle: vehicleId,
        maintenanceType: 'Corrective',
        description: 'Alternator replacement and belt alignment',
        cost: 450,
        status: 'In Progress',
        priority: 'High',
        replacedParts: ['Alternator 160A', 'Serpentine Belt'],
        mechanicName: 'Dave Technician',
      }),
    });
    const createMntJson = await createMntRes.json();
    assert(createMntRes.status === 201, 'Maintenance work order logged');
    const maintenanceId = createMntJson.data._id;

    // Check vehicle was marked 'Under Maintenance'
    const vehDuringMnt = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, { headers: authHeaders });
    const vehDuringMntJson = await vehDuringMnt.json();
    assert(vehDuringMntJson.data.currentStatus === 'Under Maintenance', "Vehicle currentStatus set to 'Under Maintenance'");
    assert(vehDuringMntJson.data.vehicleHealthStatus === 'Under Maintenance', "Vehicle health set to 'Under Maintenance'");

    // Complete maintenance
    const completeMntRes = await fetch(`${BASE_URL}/api/maintenance/${maintenanceId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Completed', resolutionNotes: 'Installed and road-tested.' }),
    });
    assert(completeMntRes.status === 200, 'Maintenance completed successfully');

    // Check vehicle was restored to 'Active' and health 'Good'
    const vehAfterMnt = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, { headers: authHeaders });
    const vehAfterMntJson = await vehAfterMnt.json();
    assert(vehAfterMntJson.data.currentStatus === 'Active', "Vehicle currentStatus restored to 'Active'");
    assert(vehAfterMntJson.data.vehicleHealthStatus === 'Good', "Vehicle health restored to 'Good'");

    // 7. Expenses & Cost Summary
    console.log('\n--- 7. Testing Cost Management & Analytics ---');
    const expRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        vehicle: vehicleId,
        category: 'Fuel',
        amount: 85.5,
        description: 'Fuel top-up diesel',
        paidTo: 'Chevron',
        paymentMethod: 'Fuel Card',
      }),
    });
    assert(expRes.status === 201, 'Fuel expense transaction recorded');

    const sumRes = await fetch(`${BASE_URL}/api/expenses/summary`, { headers: authHeaders });
    const sumJson = await sumRes.json();
    assert(sumRes.status === 200, 'GET /api/expenses/summary returns 200 OK');
    assert(sumJson.data.totalOperationalCost > 0, 'Total operational cost aggregated correctly');
    assert(sumJson.data.categoryBreakdown.length > 0, 'Category breakdown returns aggregated sums');

    // 8. Dashboard KPIs & Redis In-Memory Caching
    console.log('\n--- 8. Testing Dashboard Analytics & Redis Caching ---');
    // First call: Should miss or hit cache
    const dash1 = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders });
    const cacheHeader1 = dash1.headers.get('x-cache');
    const dash1Json = await dash1.json();
    assert(dash1.status === 200, 'Dashboard stats API returns 200 OK');
    assert(dash1Json.data.summary.totalVehicles > 0, `Total vehicles counted: ${dash1Json.data.summary.totalVehicles}`);
    assert(dash1Json.data.summary.totalOperationalCost > 0, `Total operational cost: $${dash1Json.data.summary.totalOperationalCost}`);

    // Flush cache to test deterministic MISS -> HIT sequence
    const flushRes = await fetch(`${BASE_URL}/api/dashboard/cache/flush`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert(flushRes.status === 200, 'POST /api/dashboard/cache/flush flushes cache');

    // Call after flush -> Must be MISS
    const dashMiss = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders });
    const headerMiss = dashMiss.headers.get('x-cache');
    assert(headerMiss === 'MISS', "Call immediately after flush returns 'X-Cache: MISS'");

    // Call again -> Must be HIT
    const dashHit = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders });
    const headerHit = dashHit.headers.get('x-cache');
    assert(headerHit === 'HIT', "Subsequent call returns 'X-Cache: HIT' from Redis");

    // Check cache status endpoint
    const cacheStatusRes = await fetch(`${BASE_URL}/api/dashboard/cache/status`, { headers: authHeaders });
    const cacheStatusJson = await cacheStatusRes.json();
    assert(cacheStatusRes.status === 200, 'GET /api/dashboard/cache/status returns 200 OK');
    assert(cacheStatusJson.data.status, `Cache layer active: ${cacheStatusJson.data.type}`);

    // 9. Cleanup Test Vehicle & Cascaded Documents
    console.log('\n--- 9. Testing Cascading Vehicle Deletion ---');
    const delRes = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delRes.status === 200, 'DELETE /api/vehicles/:id deletes test vehicle and cascaded data');

    const verifyDel = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, { headers: authHeaders });
    assert(verifyDel.status === 404, 'Vehicle confirmed not found (404) after deletion');

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Test Exception:', err);
    process.exit(1);
  }
}

runTests();
