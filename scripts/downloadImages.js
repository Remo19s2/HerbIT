const fs = require('fs');
const path = require('path');
const https = require('https');

const images = {
  'tulsi.jpg': 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80',
  'neem.jpg': 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  'aloe-vera.jpg': 'https://images.unsplash.com/photo-1570295835271-04c05b4ed943?auto=format&fit=crop&w=800&q=80',
  'turmeric.jpg': 'https://images.unsplash.com/photo-1666818398897-381dd5eb9139?auto=format&fit=crop&w=800&q=80',
  'ginger.jpg': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  'mint.jpg': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
  'ashwagandha.jpg': 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=80',
  'lemongrass.jpg': 'https://images.unsplash.com/photo-1596797882870-8c33deeac224?auto=format&fit=crop&w=800&q=80',
  'amla.jpg': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
  'brahmi.jpg': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
  'default-plant.jpg': 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
  'welcome-hero.jpg': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1600&q=80'
};

const destDir = path.join(__dirname, '..', 'public', 'images', 'plants');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const [filename, url] of Object.entries(images)) {
    const dest = path.join(destDir, filename);
    console.log(`Downloading ${filename}...`);
    try {
      await download(url, dest);
      console.log(`Downloaded ${filename} (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`Failed ${filename}:`, err.message);
    }
  }
  console.log('All image downloads complete!');
}

run();
