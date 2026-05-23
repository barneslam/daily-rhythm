const https = require('https');

// Direct Unsplash image URLs for tow trucks (these are verified to work)
const towTruckImages = [
  'https://images.unsplash.com/photo-1601584942197-04bbb2b033ff?w=1080&q=80', // tow truck
  'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1080&q=80', // tow operator
];

// Try Pixabay API instead
function fetchPixabayImage(query) {
  return new Promise((resolve) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=44922757-62f4b8f36319a85e17ec6a3ba&q=${encodedQuery}&image_type=photo&orientation=vertical&per_page=1`;
    
    const options = {
      hostname: 'pixabay.com',
      path: url.split('pixabay.com')[1],
      method: 'GET'
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.hits && result.hits.length > 0) {
            resolve(result.hits[0].webformatURL);
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

async function findImages() {
  console.log('🚚 Finding tow truck images...\n');
  
  const queries = ['tow truck', 'towing'];
  const images = [];
  
  for (const query of queries) {
    process.stdout.write(`  Pixabay: "${query}"... `);
    const url = await fetchPixabayImage(query);
    if (url) {
      images.push(url);
      console.log('✅');
    } else {
      console.log('⚠️');
    }
  }
  
  console.log('\n📸 Found images:');
  images.forEach((url, i) => {
    console.log(`\n${i+1}. ${url}`);
  });
}

findImages();
