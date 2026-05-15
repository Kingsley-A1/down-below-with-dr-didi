/**
 * ADMIN AUTH DIAGNOSTIC & RECOVERY SYSTEM
 * ========================================
 * This file provides comprehensive diagnostics and recovery for admin authentication issues.
 * Run with: npm run dev && node scripts/admin-auth-diagnostic.js
 * Or: pnpm dev && node scripts/admin-auth-diagnostic.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function diagnoseAdminAuth() {
  console.log('🔍 ADMIN AUTH DIAGNOSTIC SYSTEM v1.0\n');
  console.log('═'.repeat(60));
  
  const email = 'deblessedking001@gmail.com';
  const password = 'Kingsley.A1';
  
  console.log(`📧 Target Email: ${email}`);
  console.log(`🔐 Password: ${password}`);
  console.log('═'.repeat(60) + '\n');
  
  // Step 1: Try login
  console.log('📍 STEP 1: Testing Login Endpoint\n');
  try {
    const loginRes = await fetch(`${API_BASE}/api/admin/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);
    console.log(`Response: ${JSON.stringify(loginData, null, 2)}`);
    
    if (loginRes.status === 401 && loginData.error === 'Admin access denied') {
      console.log('\n⚠️  Login failed with "Admin access denied"');
      console.log('   This means: passwordHash=NULL, isActive=false, or account doesn\'t exist\n');
    }
  } catch (error) {
    console.log(`❌ Login endpoint error: ${error.message}\n`);
  }
  
  // Step 2: Check if registration endpoint works (for re-registration)
  console.log('═'.repeat(60));
  console.log('📍 STEP 2: Testing Registration Endpoint\n');
  
  try {
    const regRes = await fetch(`${API_BASE}/api/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name: 'Kingsley A',
        phone: '09036826272',
        accessCode: '826272' // super_admin code from .env
      })
    });
    
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status}`);
    console.log(`Response: ${JSON.stringify(regData, null, 2)}`);
    
    if (regRes.status === 200) {
      console.log('\n✅ Registration succeeded!');
      console.log('   Session cookie should be set.');
      console.log('   Try logging in again.\n');
    } else if (regRes.status === 409) {
      console.log('\n⚠️  Account already exists but login fails.');
      console.log('   This is the critical issue: account exists but password hash is NULL or isActive=false\n');
    }
  } catch (error) {
    console.log(`❌ Registration endpoint error: ${error.message}\n`);
  }
  
  // Step 3: Provide recovery instructions
  console.log('═'.repeat(60));
  console.log('📍 STEP 3: Recovery Instructions\n');
  
  console.log('Option A: Fix via Re-registration (Recommended)');
  console.log('1. Clear browser cookies (including session cookie)');
  console.log('2. Run registration endpoint again with the same credentials');
  console.log('3. If that fails, go to Option B\n');
  
  console.log('Option B: Manual Database Fix (Admin Only)');
  console.log('1. Access your CockroachDB dashboard');
  console.log('2. Run this SQL command:');
  console.log(`   DELETE FROM "AdminUser" WHERE email = '${email}';`);
  console.log('3. Then re-register the admin account\n');
  
  console.log('Option C: Verify Account Status');
  console.log('1. This requires direct database access');
  console.log('2. Query: SELECT id, email, passwordHash, isActive FROM "AdminUser" WHERE email = \'deblessedking001@gmail.com\';');
  console.log('3. Check: Is passwordHash 60 chars and starts with $2a$ or $2b$?');
  console.log('4. Check: Is isActive = true?\n');
  
  console.log('═'.repeat(60));
  console.log('\n✅ Diagnostic complete!\n');
  
  process.exit(0);
}

diagnoseAdminAuth().catch(error => {
  console.error('❌ Diagnostic error:', error);
  process.exit(1);
});
