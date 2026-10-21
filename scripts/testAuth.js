/**
 * Phase 2 User Authentication Test Suite
 * Tests all requirements against live running server http://localhost:5000
 */
const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🌿 Starting Phase 2 Authentication Verification Suite');
  console.log(`🌐 Testing Target: ${BASE_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  const testEmail = `testuser_${Date.now()}@herbalgarden.edu`;
  const testPassword = 'Password@123';
  let userCookie = '';
  let adminCookie = '';

  // -----------------------------------------------------------
  // TEST 1: User Registration
  // -----------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Medicinal Explorer',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'admin' // Attempting privilege escalation from client
      })
    });
    const data = await res.json();
    assert(res.status === 201 && data.success, '1. User Registration', `Status: ${res.status}`);
    assert(data.user && data.user.role === 'user', '1b. Role Escalation Prevention', `Assigned role is strictly "${data.user?.role}" despite client sending "admin"`);
    assert(data.user && !data.user.password, '1c. Password Hash Redaction', 'Password field omitted from API response');
  } catch (err) {
    assert(false, '1. User Registration', err.message);
  }

  // -----------------------------------------------------------
  // TEST 2: Duplicate Email Rejection
  // -----------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: testEmail,
        password: 'AnotherPassword@123',
        confirmPassword: 'AnotherPassword@123'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && !data.success, '2. Duplicate Email Rejection', data.message);
  } catch (err) {
    assert(false, '2. Duplicate Email Rejection', err.message);
  }

  // -----------------------------------------------------------
  // TEST 3: Invalid Login (Generic Error, No Email Leakage)
  // -----------------------------------------------------------
  try {
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword' })
    });
    const wrongPassData = await wrongPassRes.json();

    const nonExistentRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_person_404@nowhere.com', password: 'SomePassword' })
    });
    const nonExistentData = await nonExistentRes.json();

    assert(
      wrongPassRes.status === 401 && nonExistentRes.status === 401 &&
      wrongPassData.message === nonExistentData.message &&
      wrongPassData.message === 'Invalid email or password',
      '3. Invalid Login Generic Response',
      'Both wrong password and nonexistent email return identical 401 message'
    );
  } catch (err) {
    assert(false, '3. Invalid Login Generic Response', err.message);
  }

  // -----------------------------------------------------------
  // TEST 4: Successful User Login & Session Cookie Creation
  // -----------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      userCookie = setCookie.split(';')[0];
    }

    assert(res.status === 200 && data.success, '4. Successful User Login', `User: ${data.user?.name}`);
    assert(userCookie.includes('connect.sid'), '4b. Session Cookie Generation', userCookie);
  } catch (err) {
    assert(false, '4. Successful User Login', err.message);
  }

  // -----------------------------------------------------------
  // TEST 5: Session Persistence (GET /api/auth/me with Cookie)
  // -----------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userCookie }
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.authenticated === true && data.user?.email === testEmail,
      '5. Session Persistence (/api/auth/me)',
      `Authenticated as: ${data.user?.name} (${data.user?.role})`
    );
  } catch (err) {
    assert(false, '5. Session Persistence', err.message);
  }

  // -----------------------------------------------------------
  // TEST 6: Unauthenticated Access Control to Protected Endpoints
  // -----------------------------------------------------------
  try {
    // 6a. Admin HTML page without session redirects
    const adminHtmlRes = await fetch(`${BASE_URL}/admin.html`, { redirect: 'manual' });
    assert(
      adminHtmlRes.status === 302 && adminHtmlRes.headers.get('location')?.includes('/login.html'),
      '6a. Protected Admin Page Redirect (Unauthenticated)',
      `Redirected to: ${adminHtmlRes.headers.get('location')}`
    );

    // 6b. POST /api/plants without session returns 401
    const postPlantRes = await fetch(`${BASE_URL}/api/plants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Plant', scientificName: 'Testus plantus' })
    });
    assert(postPlantRes.status === 401, '6b. Plant Mutation API Protected (Unauthenticated)', `Status: ${postPlantRes.status}`);
  } catch (err) {
    assert(false, '6. Unauthenticated Access Control', err.message);
  }

  // -----------------------------------------------------------
  // TEST 7: Role-Based Access Control (Regular User cannot access Admin)
  // -----------------------------------------------------------
  try {
    // 7a. Regular user GET /admin.html gets 403 Forbidden
    const adminHtmlRes = await fetch(`${BASE_URL}/admin.html`, {
      headers: { Cookie: userCookie },
      redirect: 'manual'
    });
    assert(adminHtmlRes.status === 403, '7a. Regular User Blocked from /admin.html', `Status: ${adminHtmlRes.status} Forbidden`);

    // 7b. Regular user POST /api/plants gets 403 Forbidden
    const postPlantRes = await fetch(`${BASE_URL}/api/plants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userCookie },
      body: JSON.stringify({ name: 'User Plant', scientificName: 'Userus plantus' })
    });
    assert(postPlantRes.status === 403, '7b. Regular User Blocked from Plant Creation API', `Status: ${postPlantRes.status} Forbidden`);
  } catch (err) {
    assert(false, '7. Role-Based Access Control', err.message);
  }

  // -----------------------------------------------------------
  // TEST 8: Admin Login & Authorization
  // -----------------------------------------------------------
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@herbalgarden.edu', password: 'Admin@1234' })
    });
    const adminLoginData = await adminLoginRes.json();
    const setCookie = adminLoginRes.headers.get('set-cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }

    assert(adminLoginRes.status === 200 && adminLoginData.user?.role === 'admin', '8a. Admin Login Successful', `Role: ${adminLoginData.user?.role}`);

    // Admin access to /admin.html
    const adminHtmlRes = await fetch(`${BASE_URL}/admin.html`, {
      headers: { Cookie: adminCookie }
    });
    assert(adminHtmlRes.status === 200, '8b. Admin Access to /admin.html Allowed', `Status: ${adminHtmlRes.status}`);

    // Admin ability to create plant
    const plantAddRes = await fetch(`${BASE_URL}/api/plants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Ashwagandha Admin Test',
        scientificName: 'Withania somnifera test',
        category: 'Ayurvedic',
        description: 'Verification plant for Phase 2 test suite.'
      })
    });
    const plantAddData = await plantAddRes.json();
    assert(plantAddRes.status === 201 && plantAddData.success, '8c. Admin Authorized Plant Creation', `Created: ${plantAddData.data?.name}`);

    // Clean up created test plant
    if (plantAddData.data?._id) {
      await fetch(`${BASE_URL}/api/plants/${plantAddData.data._id}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie }
      });
    }
  } catch (err) {
    assert(false, '8. Admin Login & Authorization', err.message);
  }

  // -----------------------------------------------------------
  // TEST 9: Logout & Session Invalidation
  // -----------------------------------------------------------
  try {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: userCookie }
    });
    const logoutData = await logoutRes.json();
    assert(logoutRes.status === 200 && logoutData.success, '9a. Logout API Call', logoutData.message);

    // Verify session is now invalid on /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userCookie }
    });
    const meData = await meRes.json();
    assert(meData.authenticated === false && meData.user === null, '9b. Session Destroyed Verification', 'Unauthenticated after logout');
  } catch (err) {
    assert(false, '9. Logout & Session Invalidation', err.message);
  }

  // -----------------------------------------------------------
  // TEST 10: Preserve Existing Features (Homepage & Plant Explorer)
  // -----------------------------------------------------------
  try {
    // 10a. Homepage renders
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeText = await homeRes.text();
    assert(homeRes.status === 200 && (homeText.includes('HerbIT') || homeText.includes('Virtual Herbal Garden')), '10a. Homepage Available', `Status: ${homeRes.status}`);

    // 10b. Public plants GET endpoint returns all dataset records
    const plantsRes = await fetch(`${BASE_URL}/api/plants`);
    const plantsData = await plantsRes.json();
    assert(plantsRes.status === 200 && plantsData.count >= 360, '10b. Public Plant Explorer API Intact', `Count: ${plantsData.count} records`);
  } catch (err) {
    assert(false, '10. Preserve Existing Features', err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
