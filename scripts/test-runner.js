import dotenv from 'dotenv';
dotenv.config();

// Pulse KPRIET - Automated Verification Test Suite

async function runTests() {
  console.log('\x1b[36m========================================================\x1b[0m');
  console.log('\x1b[36m  🧪 PULSE KPRIET AUTOMATED TEST SUITE\x1b[0m');
  console.log('\x1b[36m========================================================\x1b[0m\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`\x1b[32m✔ PASS:\x1b[0m ${testName}`);
      passed++;
    } else {
      console.error(`\x1b[31m✖ FAIL:\x1b[0m ${testName}`);
      failed++;
    }
  }

  // 1. Test Dev Server Accessibility
  try {
    const res = await fetch('http://localhost:5173/');
    const html = await res.text();
    assert(res.status === 200, 'Dev server responds with HTTP 200 OK');
    assert(html.includes('Pulse KPRIET'), 'HTML includes title "Pulse KPRIET"');
    assert(html.includes('id="root"'), 'HTML contains #root mounting node');
    assert(html.includes('leaflet.css'), 'HTML loads Leaflet CSS');
    assert(html.includes('manifest.json'), 'HTML links PWA manifest');
  } catch (err) {
    assert(false, `Dev server test failed: ${err.message}`);
  }

  // 2. Test Manifest & PWA Assets
  try {
    const manifestRes = await fetch('http://localhost:5173/manifest.json');
    const manifest = await manifestRes.json();
    assert(manifest.short_name === 'Pulse', 'PWA Manifest has short_name "Pulse"');
    assert(manifest.start_url === '/', 'PWA Manifest has start_url "/"');
  } catch (err) {
    assert(false, `Manifest test failed: ${err.message}`);
  }

  // 3. Test Constants and Geography Math
  const { calculateDistance } = await import('../src/hooks/useGeolocation.js');
  // Distance from Central Library (11.0834, 77.1422) to Admin Block (11.0827, 77.1420) ~80m
  const dist = calculateDistance(11.0834, 77.1422, 11.0827, 77.1420);
  assert(dist > 50 && dist < 120, `Distance formula calculates campus distances correctly (${dist}m)`);

  // 4. Test Skill Matching Logic
  const { INCIDENT_TYPES, VOLUNTEER_SKILLS, CAMPUS_BLOCKS, DEMO_ACCOUNTS } = await import('../src/lib/constants.js');
  assert(INCIDENT_TYPES.length === 6, 'All 6 incident categories defined (medical, accident, fire, safety, blood_needed, other)');
  assert(VOLUNTEER_SKILLS.length === 5, 'All 5 certified skills defined');
  assert(CAMPUS_BLOCKS.length >= 10, 'Campus landmark blocks mapped with coordinates');
  assert(DEMO_ACCOUNTS.length >= 4, 'Demo quick accounts configured for Student, Volunteers, and Admin');

  // 5. Test RPC helpers and Engine Lifecycle
  const { supabase, rpcCreateIncident, rpcAcceptIncident, rpcResolveIncident, rpcCancelIncident, generateAiSummary } = await import('../src/lib/supabase.js');

  // Sign in as student demo account
  await supabase.auth.signInWithPassword({
    email: 'student@pulse.demo',
    password: 'Demo@12345'
  });

  // Test Creation
  const createRes = await rpcCreateIncident({
    type: 'medical',
    description: 'Test respiratory emergency in Library',
    lat: 11.0834,
    lng: 77.1422,
    label: 'Central Library & Reading Hall'
  });
  assert(createRes.data?.incident_id, `Incident created with ID: ${createRes.data?.incident_id}`);
  assert(createRes.data?.match_count >= 1, `Matched ${createRes.data?.match_count} first responders within radius`);

  const incId = createRes.data?.incident_id;

  // Switch session to Volunteer 1 (Priya)
  await supabase.auth.signInWithPassword({
    email: 'volunteer1@pulse.demo',
    password: 'Demo@12345'
  });

  // Test Acceptance by Volunteer 1
  const acceptRes1 = await rpcAcceptIncident(incId);
  assert(acceptRes1.data?.success === true, 'First responder acceptance succeeded atomically');

  // Switch session to Volunteer 2 (Karthik)
  await supabase.auth.signInWithPassword({
    email: 'volunteer2@pulse.demo',
    password: 'Demo@12345'
  });

  // Test Race Condition Safeguard (Second volunteer attempting to accept already-taken incident)
  const acceptRes2 = await rpcAcceptIncident(incId);
  assert(acceptRes2.data?.success === false, 'Duplicate responder acceptance safely rejected ("Already taken")');

  // Test Resolution by Volunteer 1
  await supabase.auth.signInWithPassword({
    email: 'volunteer1@pulse.demo',
    password: 'Demo@12345'
  });
  const resolveRes = await rpcResolveIncident(incId);
  assert(resolveRes.data?.status === 'resolved', 'Incident marked resolved successfully');

  // Test AI Summary fallback/generation
  const summaryRes = await generateAiSummary(incId);
  assert(summaryRes.summary && summaryRes.summary.length > 20, `AI summary produced: "${summaryRes.summary.substring(0, 60)}..."`);

  console.log(`\n\x1b[36m--------------------------------------------------------\x1b[0m`);
  console.log(`\x1b[32mAll Tests Finished: ${passed} Passed, ${failed} Failed\x1b[0m`);
  console.log(`\x1b[36m--------------------------------------------------------\x1b[0m\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
