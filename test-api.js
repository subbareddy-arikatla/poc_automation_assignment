// Quick test script to verify API connectivity
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function testAPI() {
  console.log('Testing API connection...');
  console.log(`API Base URL: ${API_BASE}`);
  
  try {
    const response = await fetch(`${API_BASE}/api/batches/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log(`\n✅ Status: ${response.status} ${response.statusText}`);
    console.log(`✅ CORS Headers:`);
    console.log(`   Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin') || 'NOT SET'}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ Success! Found ${Array.isArray(data) ? data.length : 0} batch(es)`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   First batch: ${data[0].batch_name || data[0].name || 'N/A'}`);
      }
    } else {
      const text = await response.text();
      console.log(`\n❌ Error Response: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`\n❌ Connection Error: ${error.message}`);
    console.log(`\nTroubleshooting:`);
    console.log(`1. Make sure Django server is running: python manage.py runserver`);
    console.log(`2. Check if server is accessible at: ${API_BASE}`);
    console.log(`3. Verify CORS is configured in Django settings.py`);
  }
}

testAPI();

