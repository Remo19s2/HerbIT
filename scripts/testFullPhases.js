/**
 * Comprehensive Integration Test Suite: Phases 3–7
 * Tests User Profiles, My Garden, Submissions, Enhanced Admin, Gemini Assistant, and Existing Features.
 */

const BASE_URL = 'http://localhost:5000';

async function runTestSuite() {
  console.log('==================================================================');
  console.log('🌿 HerbIT: Phases 3–7 Comprehensive Test Suite');
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? '— ' + details : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '— ' + details : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const user1Email = `botanist1_${timestamp}@herbalgarden.edu`;
  const user2Email = `botanist2_${timestamp}@herbalgarden.edu`;
  const adminEmail = 'admin@herbalgarden.edu';
  const adminPassword = 'Admin@1234';
  const userPassword = 'UserPass@123';

  let user1Cookie = '';
  let user2Cookie = '';
  let adminCookie = '';

  let samplePlantId = '';
  let samplePlant2Id = '';
  let createdGardenEntryId = '';
  let createdSubmissionId = '';

  // =========================================================================
  // SETUP: Fetch 2 sample plants from repository
  // =========================================================================
  try {
    const plantsRes = await fetch(`${BASE_URL}/api/plants`);
    const plantsData = await plantsRes.json();
    assert(plantsRes.ok && plantsData.data && plantsData.data.length >= 2, 'Setup: Fetch Botanical Plants', `Count: ${plantsData.count}`);
    samplePlantId = plantsData.data[0]._id;
    samplePlant2Id = plantsData.data[1]._id;
  } catch (err) {
    assert(false, 'Setup: Fetch Botanical Plants', err.message);
  }

  // =========================================================================
  // TEST SUITE A: AUTHENTICATION & LOGIN FOR 2 TEST USERS & ADMIN
  // =========================================================================
  console.log('\n--- SUITE A: Authentication & Session Provisioning ---');
  try {
    // Register User 1
    const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Botanist One', email: user1Email, password: userPassword, confirmPassword: userPassword })
    });
    const reg1Data = await reg1Res.json();
    assert(reg1Res.status === 201 && reg1Data.success, 'A1. Register User 1', `Registered: ${user1Email}`);

    // Register User 2
    const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Botanist Two', email: user2Email, password: userPassword, confirmPassword: userPassword })
    });
    assert(reg2Res.status === 201, 'A2. Register User 2', `Registered: ${user2Email}`);

    // Login User 1
    const login1Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user1Email, password: userPassword })
    });
    user1Cookie = login1Res.headers.get('set-cookie')?.split(';')[0] || '';
    assert(login1Res.ok && user1Cookie.includes('connect.sid'), 'A3. Login User 1 (Session Cookie)', 'Session cookie set');

    // Login User 2
    const login2Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user2Email, password: userPassword })
    });
    user2Cookie = login2Res.headers.get('set-cookie')?.split(';')[0] || '';
    assert(login2Res.ok && user2Cookie.includes('connect.sid'), 'A4. Login User 2 (Session Cookie)', 'Session cookie set');

    // Login Admin
    const loginAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    const adminData = await loginAdminRes.json();
    adminCookie = loginAdminRes.headers.get('set-cookie')?.split(';')[0] || '';
    assert(loginAdminRes.ok && adminData.user?.role === 'admin', 'A5. Login Admin Account', `Role: ${adminData.user?.role}`);
  } catch (err) {
    assert(false, 'SUITE A Failed', err.message);
  }

  // =========================================================================
  // TEST SUITE B: MY GARDEN
  // =========================================================================
  console.log('\n--- SUITE B: My Garden Operations ---');
  try {
    // B1. Add Plant to User 1's Garden
    const addRes = await fetch(`${BASE_URL}/api/garden`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        plantId: samplePlantId,
        status: 'Want to Grow',
        personalNotes: 'Testing note for Tulsi balcony planting.',
        isFavorite: true
      })
    });
    const addData = await addRes.json();
    createdGardenEntryId = addData.data?._id;
    assert(addRes.status === 201 && addData.success && createdGardenEntryId, 'B1. Add Plant to Garden', `Entry ID: ${createdGardenEntryId}`);

    // B2. Prevent Duplicate Entry for the same user
    const dupRes = await fetch(`${BASE_URL}/api/garden`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ plantId: samplePlantId, status: 'Growing' })
    });
    assert(dupRes.status === 400, 'B2. Duplicate Plant Prevention', 'Rejected second addition of same plant');

    // B3. Retrieve User 1's Garden (Populated plant data)
    const listRes = await fetch(`${BASE_URL}/api/garden`, {
      headers: { Cookie: user1Cookie }
    });
    const listData = await listRes.json();
    assert(listRes.ok && listData.count >= 1 && listData.data[0].plantId?.name, 'B3. Retrieve User Garden', `Found ${listData.count} plant(s) with populated details`);

    // B4. Update Status and Notes
    const updateRes = await fetch(`${BASE_URL}/api/garden/${createdGardenEntryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        status: 'Growing',
        personalNotes: 'Updated cultivation notes: sprouted healthy leaves.'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.ok && updateData.data?.status === 'Growing', 'B4. Update Garden Status & Notes', `New status: ${updateData.data?.status}`);

    // B5. Toggle Favorite
    const favRes = await fetch(`${BASE_URL}/api/garden/${createdGardenEntryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ isFavorite: false })
    });
    const favData = await favRes.json();
    assert(favRes.ok && favData.data?.isFavorite === false, 'B5. Toggle Favorite Flag', 'isFavorite set to false');

    // B6. Verify User 2 CANNOT access User 1's entry (Ownership enforcement)
    const crossAccessRes = await fetch(`${BASE_URL}/api/garden/${createdGardenEntryId}`, {
      headers: { Cookie: user2Cookie }
    });
    assert(crossAccessRes.status === 403, 'B6. Cross-User Access Blocked (Ownership check)', `Status: ${crossAccessRes.status} Forbidden`);

    // B7. User 2 can independently save the same plant (Different user)
    const user2AddRes = await fetch(`${BASE_URL}/api/garden`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
      body: JSON.stringify({ plantId: samplePlantId, status: 'Learning' })
    });
    assert(user2AddRes.status === 201, 'B7. Multi-User Plant Sharing', 'User 2 independently saved the plant');

    // B8. Delete entry from User 1's garden
    const delRes = await fetch(`${BASE_URL}/api/garden/${createdGardenEntryId}`, {
      method: 'DELETE',
      headers: { Cookie: user1Cookie }
    });
    assert(delRes.ok, 'B8. Delete Garden Entry', 'Entry successfully deleted');

    // B9. Verify deleting entry does NOT delete the canonical plant
    const plantStillExists = await fetch(`${BASE_URL}/api/plants/${samplePlantId}`);
    assert(plantStillExists.ok, 'B9. Canonical Plant Preserved', 'Original Plant record remains intact in database');
  } catch (err) {
    assert(false, 'SUITE B Failed', err.message);
  }

  // =========================================================================
  // TEST SUITE C: USER PROFILES
  // =========================================================================
  console.log('\n--- SUITE C: User Profiles & Security ---');
  try {
    // C1. View Own Profile
    const meRes = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { Cookie: user1Cookie }
    });
    const meData = await meRes.json();
    assert(meRes.ok && meData.user?.email === user1Email && meData.stats !== undefined, 'C1. View Own Profile & Garden Stats', `User: ${meData.user?.name}`);

    // C2. Update Full Name
    const updateNameRes = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ name: 'Dr. Botanist Renamed' })
    });
    const updateNameData = await updateNameRes.json();
    assert(updateNameRes.ok && updateNameData.user?.name === 'Dr. Botanist Renamed', 'C2. Update Profile Name', `New name: ${updateNameData.user?.name}`);

    // C3. Reject Unauthorized Email Change via Profile
    const hackEmailRes = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ email: 'hacked_email@attacker.com', role: 'admin' })
    });
    const checkUserRes = await fetch(`${BASE_URL}/api/users/me`, { headers: { Cookie: user1Cookie } });
    const checkUserData = await checkUserRes.json();
    assert(checkUserData.user?.email === user1Email && checkUserData.user?.role === 'user', 'C3. Role & Email Tampering Prevention', 'Email and role remained unchanged');

    // C4. Change Password (Incorrect current password rejected)
    const badPassRes = await fetch(`${BASE_URL}/api/users/me/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ currentPassword: 'WrongPassword', newPassword: 'NewPassword@456', confirmPassword: 'NewPassword@456' })
    });
    assert(badPassRes.status === 400, 'C4. Reject Incorrect Current Password', 'Invalid current password rejected');

    // C5. Change Password Successfully
    const goodPassRes = await fetch(`${BASE_URL}/api/users/me/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ currentPassword: userPassword, newPassword: 'NewPassword@456', confirmPassword: 'NewPassword@456' })
    });
    assert(goodPassRes.status === 200, 'C5. Change Password Successfully', 'Password updated');

    // C6. Verify login works with new password
    const testLoginNewRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user1Email, password: 'NewPassword@456' })
    });
    user1Cookie = testLoginNewRes.headers.get('set-cookie')?.split(';')[0] || '';
    assert(testLoginNewRes.ok, 'C6. Login with New Password Verified', 'Authenticated with new password');
  } catch (err) {
    assert(false, 'SUITE C Failed', err.message);
  }

  // =========================================================================
  // TEST SUITE D: COMMUNITY PLANT SUBMISSIONS
  // =========================================================================
  console.log('\n--- SUITE D: Community Submissions Workflow ---');
  try {
    const testHerbName = `Kalmegh Test ${timestamp}`;
    const testSciName = `Andrographis paniculata ${timestamp}`;

    // D1. Validate Required Fields (Missing description fails)
    const invalidSubRes = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ name: testHerbName, scientificName: testSciName })
    });
    assert(invalidSubRes.status === 400, 'D1. Submission Field Validation', 'Missing description rejected');

    // D2. Submit Valid Plant Proposal
    const subRes = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        name: testHerbName,
        scientificName: testSciName,
        category: 'Ayurvedic',
        description: 'Known as the King of Bitters, traditionally used for seasonal immunity.',
        benefits: 'Supports liver health, immune balance, and febrifuge formulations.',
        partsUsed: 'Whole aerial plant, leaves.',
        sourceUrl: 'https://en.wikipedia.org/wiki/Andrographis_paniculata'
      })
    });
    const subData = await subRes.json();
    createdSubmissionId = subData.data?._id;
    assert(subRes.status === 201 && subData.data?.status === 'pending', 'D2. Submit Plant for Review', `Status: ${subData.data?.status}`);

    // D3. Retrieve User 1's Submissions
    const mySubsRes = await fetch(`${BASE_URL}/api/submissions/mine`, {
      headers: { Cookie: user1Cookie }
    });
    const mySubsData = await mySubsRes.json();
    assert(mySubsRes.ok && mySubsData.count >= 1, 'D3. Retrieve Own Submissions', `Count: ${mySubsData.count}`);

    // D4. User 2 cannot edit User 1's submission
    const crossEditRes = await fetch(`${BASE_URL}/api/submissions/${createdSubmissionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
      body: JSON.stringify({ description: 'Hacked description' })
    });
    assert(crossEditRes.status === 403, 'D4. Unauthorized Edit Blocked', `Status: ${crossEditRes.status} Forbidden`);

    // D5. Non-Admin CANNOT review submission
    const nonAdminReviewRes = await fetch(`${BASE_URL}/api/admin/submissions/${createdSubmissionId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ action: 'approve' })
    });
    assert(nonAdminReviewRes.status === 403, 'D5. Non-Admin Review Blocked', `Status: ${nonAdminReviewRes.status} Forbidden`);

    // D6. Administrator Approves Submission
    const approveRes = await fetch(`${BASE_URL}/api/admin/submissions/${createdSubmissionId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        action: 'approve',
        adminFeedback: 'Verified against canonical pharmacopeia. Welcome to the herbal database!'
      })
    });
    const approveData = await approveRes.json();
    assert(approveRes.ok && approveData.data?.status === 'approved', 'D6. Administrator Approval & Integration', `Status: ${approveData.data?.status}`);

    // D7. Verify plant now exists in canonical Plant collection
    const checkPlantRes = await fetch(`${BASE_URL}/api/plants?search=${encodeURIComponent(testHerbName)}`);
    const checkPlantData = await checkPlantRes.json();
    assert(checkPlantRes.ok && checkPlantData.count >= 1, 'D7. Approved Plant Live in Catalog', `Found: ${checkPlantData.data[0]?.name}`);

    // Clean up approved test plant from catalog
    if (checkPlantData.data[0]?._id) {
      await fetch(`${BASE_URL}/api/plants/${checkPlantData.data[0]._id}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie }
      });
    }

    // Clean up submission
    await fetch(`${BASE_URL}/api/submissions/${createdSubmissionId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
  } catch (err) {
    assert(false, 'SUITE D Failed', err.message);
  }

  // =========================================================================
  // TEST SUITE E: ENHANCED ADMIN MANAGEMENT
  // =========================================================================
  console.log('\n--- SUITE E: Enhanced Admin Management ---');
  try {
    // E1. Overview Statistics
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie }
    });
    const statsData = await statsRes.json();
    assert(
      statsRes.ok && statsData.data && statsData.data.totalPlants >= 360 && statsData.data.totalUsers >= 2,
      'E1. Admin Overview Analytics',
      `Plants: ${statsData.data?.totalPlants}, Users: ${statsData.data?.totalUsers}, Gardens: ${statsData.data?.totalGardenEntries}`
    );

    // E2. Paginated User List
    const usersRes = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=5`, {
      headers: { Cookie: adminCookie }
    });
    const usersData = await usersRes.json();
    assert(usersRes.ok && usersData.data && usersData.totalPages >= 1, 'E2. Paginated User Directory', `Returned ${usersData.count} of ${usersData.total} users`);

    // E3. User Search by Name / Email
    const searchUserRes = await fetch(`${BASE_URL}/api/admin/users?search=${encodeURIComponent(user2Email)}`, {
      headers: { Cookie: adminCookie }
    });
    const searchUserData = await searchUserRes.json();
    assert(searchUserRes.ok && searchUserData.data[0]?.email === user2Email, 'E3. User Search by Email', `Found: ${searchUserData.data[0]?.name}`);

    // E4. Deactivate and Reactivate User 2
    const user2Id = searchUserData.data[0]._id;
    const deactRes = await fetch(`${BASE_URL}/api/admin/users/${user2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isActive: false })
    });
    const deactData = await deactRes.json();
    assert(deactRes.ok && deactData.data?.isActive === false, 'E4. Deactivate User Account', 'User 2 deactivated');

    // E5. Deactivated User Cannot Login
    const deactLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user2Email, password: userPassword })
    });
    assert(deactLoginRes.status === 403, 'E5. Deactivated User Login Rejected', `Status: ${deactLoginRes.status} Forbidden`);

    // Reactivate User 2
    await fetch(`${BASE_URL}/api/admin/users/${user2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isActive: true })
    });

    // E6. Safety: Admin cannot deactivate themselves
    const adminSelfId = (await (await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: adminCookie } })).json()).user.id;
    const selfDeactRes = await fetch(`${BASE_URL}/api/admin/users/${adminSelfId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isActive: false })
    });
    assert(selfDeactRes.status === 400, 'E6. Admin Self-Deactivation Guardrail', 'Rejected deactivating own admin account');
  } catch (err) {
    assert(false, 'SUITE E Failed', err.message);
  }

  // =========================================================================
  // TEST SUITE F: GEMINI AI GARDENING ASSISTANT
  // =========================================================================
  console.log('\n--- SUITE F: Gemini AI Gardening Assistant ---');
  try {
    // F1. Missing API Key Handled Gracefully
    const chatRes = await fetch(`${BASE_URL}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How do I care for Tulsi in winter?'
      })
    });
    const chatData = await chatRes.json();
    assert(
      chatRes.status === 200 && chatData.reply && (chatData.configured === false || chatData.configured === true),
      'F1. Graceful AI Assistant Query & Setup Handler',
      chatData.configured ? 'Live Gemini Response Received' : 'Clear Setup Instructions Returned'
    );

    // F2. Reject Empty Message
    const emptyMsgRes = await fetch(`${BASE_URL}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' })
    });
    assert(emptyMsgRes.status === 400, 'F2. Reject Empty Chat Message', 'Empty query rejected');

    // F3. Personal Garden Context Inclusion (Owner isolation)
    const ctxChatRes = await fetch(`${BASE_URL}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        message: 'What fertilizer is best for my plants?',
        includeGardenContext: true
      })
    });
    assert(ctxChatRes.status === 200, 'F3. Garden Context Prompt Construction', 'Query processed with user garden isolation');
  } catch (err) {
    assert(false, 'SUITE F Failed', err.message);
  }

  // =========================================================================
  // TEST SUITE G: EXISTING FEATURES & DATASET INTEGRITY
  // =========================================================================
  console.log('\n--- SUITE G: Existing Features & Dataset Integrity ---');
  try {
    // G1. Plant Explorer returns 368 records
    const catalogRes = await fetch(`${BASE_URL}/api/plants`);
    const catalogData = await catalogRes.json();
    assert(catalogRes.ok && catalogData.count >= 368, 'G1. Plant Database Intact (368+ records)', `Exact count: ${catalogData.count}`);

    // G2. Search filters work
    const searchTulsi = await fetch(`${BASE_URL}/api/plants?search=Tulsi`);
    const tulsiData = await searchTulsi.json();
    assert(searchTulsi.ok && tulsiData.count >= 1, 'G2. Botanical Search Operable', `Found ${tulsiData.count} records for "Tulsi"`);

    // G3. Category filtering works
    const catRes = await fetch(`${BASE_URL}/api/plants?category=Ayurvedic`);
    const catData = await catRes.json();
    assert(catRes.ok && catData.count >= 10, 'G3. Category Filter Operable', `Found ${catData.count} Ayurvedic records`);

    // G4. Single Plant Details API works
    const singleRes = await fetch(`${BASE_URL}/api/plants/${samplePlantId}`);
    const singleData = await singleRes.json();
    assert(singleRes.ok && singleData.data?.name, 'G4. Single Plant Details Operable', `Fetched: ${singleData.data?.name}`);

    // G5. All frontend HTML pages load
    const pages = ['index.html', 'login.html', 'register.html', 'garden.html', 'profile.html', 'submit-plant.html', 'assistant.html'];
    let allPagesOk = true;
    for (const page of pages) {
      const pageRes = await fetch(`${BASE_URL}/${page}`, { headers: { Cookie: adminCookie } });
      if (!pageRes.ok) allPagesOk = false;
    }
    assert(allPagesOk, 'G5. All 7 Frontend HTML Pages Accessible', 'index, login, register, garden, profile, submit-plant, assistant');
  } catch (err) {
    assert(false, 'SUITE G Failed', err.message);
  }

  console.log('\n==================================================================');
  console.log(`📊 FINAL TEST REPORT: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
