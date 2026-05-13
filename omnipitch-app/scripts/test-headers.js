const https = require('https');

async function testFetch() {
  const options = {
    hostname: 'www.fotmob.com',
    port: 443,
    path: '/api/teams?id=8456',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response begins with:', data.substring(0, 100));
      if (data.startsWith('{')) {
          console.log("Success! Got JSON.");
      } else {
          console.log("Failed. Got HTML/Cloudflare.");
      }
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.end();
}

testFetch();
