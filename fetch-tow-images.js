const https = require('https');

function fetchUnsplashImage(query) {
  return new Promise((resolve) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=portrait`;
    
    const options = {
      hostname: 'api.unsplash.com',
      path: url.split('api.unsplash.com')[1],
      method: 'GET',
      headers: {
        'Authorization': 'Client-ID dNo87Yo5QqXc9y2AzUhYvvJWIm45Gl6JVFQ5k4LxzgE',
        'Accept-Version': 'v1'
      }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.results && result.results.length > 0) {
            resolve(result.results[0].urls.regular);
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
    'towing truck operator',
    'roadside assistance tow'
  ];
  
  const images = {};
  for (const query of queries) {
    process.stdout.write(`  "${query}"... `);
    const url = await fetchUnsplashImage(query);
    if (url) {
      images[query] = url;
      console.log('✅');
    } else {
      console.log('⚠️ (fallback to placeholder)');
    }
  }
  
  console.log('\n📸 Image URLs:');
  Object.entries(images).forEach(([query, url]) => {
    console.log(`  ${query}: ${url.substring(0, 80)}...`);
  });
  
  return images;
}

fetchTowImages().then(images => {
  const imageUrls = Object.values(images);
  console.log(`\n✅ Found ${imageUrls.length} tow industry images`);
  console.log(`\nUse these URLs in carousel files:`);
  imageUrls.forEach((url, i) => {
    console.log(`  Image ${i+1}: ${url}`);
  });
});
