const API_URL = 'http://localhost:5000/api';

async function testWorkerFlow() {
  try {
    const email = `testworker_${Date.now()}@test.com`;
    console.log(`Testing flow with email: ${email}`);

    // 1. Register worker
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Worker',
        email: email,
        password: 'Password123!',
        role: 'worker'
      })
    });
    const registerData: any = await registerRes.json();
    if (!registerRes.ok) throw new Error(`Register failed: ${JSON.stringify(registerData)}`);
    
    const { token, devOnly_otp } = registerData;
    const workerId = registerData.user.id;
    console.log('Registered. OTP:', devOnly_otp);

    // 2. Verify OTP
    const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp: devOnly_otp
      })
    });
    if (!verifyRes.ok) throw new Error('Verify OTP failed');
    console.log('OTP Verified.');

    // 3. Check getMe (should be false)
    const getMeConfig = {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    };
    const meRes1 = await fetch(`${API_URL}/auth/me`, getMeConfig);
    const meData1: any = await meRes1.json();
    console.log('After OTP Verify - hasCompletedOnboarding:', meData1.user.hasCompletedOnboarding);
    
    if (meData1.user.hasCompletedOnboarding !== false) {
      throw new Error('Expected hasCompletedOnboarding to be false after OTP verify for worker');
    }

    // 4. Save profile
    const profileRes = await fetch(`${API_URL}/workers/${workerId}/profile`, {
      method: 'PUT',
      headers: getMeConfig.headers,
      body: JSON.stringify({
        skills: ['Plumbing'],
        experienceYears: 5,
        visitingCharge: 50,
        serviceRadiusKm: 10
      })
    });
    if (!profileRes.ok) throw new Error('Profile save failed');
    console.log('Worker profile saved.');

    // 5. Check getMe again (should be true)
    const meRes2 = await fetch(`${API_URL}/auth/me`, getMeConfig);
    const meData2: any = await meRes2.json();
    console.log('After Profile Save - hasCompletedOnboarding:', meData2.user.hasCompletedOnboarding);
    
    if (meData2.user.hasCompletedOnboarding !== true) {
      throw new Error('Expected hasCompletedOnboarding to be true after saving profile');
    }

    console.log('Test passed successfully!');
  } catch (err: any) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

testWorkerFlow();
