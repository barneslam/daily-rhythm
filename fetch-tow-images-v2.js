const https = require('https');

function fetchPexelsImage(query) {
  return new Promise((resolve) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=1&orientation=portrait`;
    
    const options = {
      hostname: 'api.pexels.com',
      path: url.split('api.pexels.com')[1],
      method: 'GET',
      headers: {
        'Authorization': 'dLNUGT3k2K23pVfkU98lHBSBp48fKrWfZ3kVVqLPcVH3xAr2qXJ1j8MV'
      }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.photos && result.photos.length > 0) {
            resolve(result.photos[0].src.large);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null)).end();
  });
}

async function fetchTowImages() {
  console.log('🚚 Fetching towing industry images...\n');
  
  const queries = [
    'tow truck',
    'tow truck driver',
    'roadside assistance'
  ];
  
  const images = [];
  for (const query of queries) {
    process.stdout.write(`  "${query}"... `);
    const url = await fetchPexelsImage(query);
    if (url) {
      images.push(url);
      console.log('✅');
    } else {
      console.log('⚠️ retry');
    }
  }
  
  if (images.length > 0) {
    console.log(`\n✅ Found ${images.length} tow industry images\n`);
    images.forEach((url, i) => {
      console.log(`Image ${i+1}: ${url}`);
    });
  }
}

fetchTowImages();
