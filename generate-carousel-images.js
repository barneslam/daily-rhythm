const https = require('https');
const fs = require('fs');

// Unsplash search terms related to RIN (dispatch, logistics, drivers, fleet)
const searchQueries = [
  'dispatch logistics',
  'fleet management truck',
  'real-time tracking map',
  'driver success achievement'
];

function fetchUnsplashImage(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&order_by=relevance`;
    
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
            // Return the regular size image URL
            resolve(result.results[0].urls.regular);
          } else {
            // Fallback to placeholder
            resolve(`https://picsum.photos/1080/1350?random=${Math.random()}`);
          }
        } catch (e) {
          resolve(`https://picsum.photos/1080/1350?random=${Math.random()}`);
        }
      });
    }).on('error', () => {
      resolve(`https://picsum.photos/1080/1350?random=${Math.random()}`);
    }).end();
  });
}

async function generateImages() {
  console.log('🎨 Generating carousel images...\n');
  
  const images = {};
  for (const query of searchQueries) {
    process.stdout.write(`  Fetching "${query}"... `);
    const url = await fetchUnsplashImage(query);
    images[query] = url;
    console.log('✅');
  }
  
  console.log('\n📸 Image URLs:');
  console.log(JSON.stringify(images, null, 2));
  
  // Save for reference
  fs.writeFileSync('/Users/b.lamoutlook.com/daily-rhythm/carousel-images.json', JSON.stringify(images, null, 2));
  console.log('\n✅ Saved to carousel-images.json');
  
  return images;
}

generateImages();
