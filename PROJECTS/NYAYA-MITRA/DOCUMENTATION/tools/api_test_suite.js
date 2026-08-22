const http = require('http');

const runTest = (method, path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

(async () => {
  try {
    console.log("=== NYAYA-MITRA API TEST SUITE ===");
    
    // 1. Unauthenticated Request (Should fail 401)
    console.log("\n1. GET /fir (No Auth)");
    const r1 = await runTest('GET', '/fir');
    console.log(`Status: ${r1.status}`);
    console.log(`Response: ${r1.body}`);

    // 2. Fetch Profiles (Usually public or requires basic auth, let's test)
    console.log("\n2. GET /citizen_profiles (No Auth)");
    const r2 = await runTest('GET', '/citizen_profiles');
    console.log(`Status: ${r2.status}`);
    console.log(`Response Snippet: ${r2.body.substring(0, 100)}...`);

    // 3. Fetch Complaints
    console.log("\n3. GET /complaints (No Auth)");
    const r3 = await runTest('GET', '/complaints');
    console.log(`Status: ${r3.status}`);
    console.log(`Response Snippet: ${r3.body.substring(0, 100)}...`);

  } catch(e) {
    console.error(e);
  }
})();
