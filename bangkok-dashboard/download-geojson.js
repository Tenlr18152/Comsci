const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/pcrete/gsvloader-demo/master/geojson/Bangkok-districts.geojson';
const targetPath = path.join(__dirname, 'bangkok-districts.geojson');

console.log('Downloading Bangkok GeoJSON from:', url);

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Request Failed. Status Code: ${res.statusCode}`);
    res.resume();
    return;
  }

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      // Validate it's correct JSON
      JSON.parse(data);
      fs.writeFileSync(targetPath, data);
      console.log('Successfully saved GeoJSON to:', targetPath);
    } catch (e) {
      console.error('Downloaded data is not valid JSON:', e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
