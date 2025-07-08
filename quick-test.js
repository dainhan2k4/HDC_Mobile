const axios = require('axios');

async function compareFundData() {
  console.log('🔍 Comparing Direct Odoo vs Middleware API...\n');

  try {
    // Test 1: Direct Odoo
    console.log('🔄 Testing Direct Odoo: http://localhost:11018/data_fund');
    const directResponse = await axios.get('http://localhost:11018/data_fund');
    console.log(`✅ Direct Odoo: ${directResponse.status}`);
    console.log(`📊 Direct Data Count: ${Array.isArray(directResponse.data) ? directResponse.data.length : 'Not array'}`);
    
    // Test 2: Middleware API
    console.log('\n🔄 Testing Middleware: http://192.168.50.104:3001/api/v1/portfolio/funds');
    const middlewareResponse = await axios.get('http://192.168.50.104:3001/api/v1/portfolio/funds');
    console.log(`✅ Middleware: ${middlewareResponse.status}`);
    console.log(`📊 Middleware Success: ${middlewareResponse.data.success}`);
    console.log(`📊 Middleware Data Count: ${middlewareResponse.data.count || 0}`);
    
    // Compare
    const directCount = Array.isArray(directResponse.data) ? directResponse.data.length : 0;
    const middlewareCount = middlewareResponse.data.count || 0;
    
    console.log('\n📈 Comparison:');
    console.log(`Direct Odoo: ${directCount} items`);
    console.log(`Middleware: ${middlewareCount} items`);
    
    if (directCount > 0 && middlewareCount === 0) {
      console.log('❌ Issue: Direct Odoo has data but middleware returns empty');
      console.log('🔧 Check middleware server logs for authentication or connection errors');
    } else if (directCount === middlewareCount) {
      console.log('✅ Success: Both APIs return same amount of data');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

compareFundData(); 