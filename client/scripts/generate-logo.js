import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Ensure directories exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const logosDir = path.join(publicDir, 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// 3-facet GoBetter brand SVG
const svg = `<svg width="512" height="512" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gobe-left" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d8ff43" />
      <stop offset="100%" stop-color="#c0f200" />
    </linearGradient>
    <linearGradient id="gobe-right" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a5d800" />
      <stop offset="100%" stop-color="#769d00" />
    </linearGradient>
    <linearGradient id="gobe-bottom" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#88b300" />
      <stop offset="100%" stop-color="#516e00" />
    </linearGradient>
  </defs>
  <path d="M12 2.59009V13.6101L2.65 20.1501C1.8 19.1401 1.75 17.6101 2.7 15.9001L5.82 10.2901L8.76 5.00009C9.65 3.40009 10.82 2.59009 12 2.59009Z" fill="url(#gobe-left)" />
  <path d="M21.3504 20.1501C20.7004 20.9401 19.5704 21.4101 18.0604 21.4101H5.94039C4.43039 21.4101 3.30039 20.9401 2.65039 20.1501L12.0004 13.6101L21.3504 20.1501Z" fill="url(#gobe-bottom)" />
  <path d="M21.35 20.1501L12 13.6101V2.59009C13.18 2.59009 14.35 3.40009 15.24 5.00009L18.18 10.2901L21.3 15.9001C22.25 17.6101 22.2 19.1401 21.35 20.1501Z" fill="url(#gobe-right)" />
</svg>`;

// Render 512x512 High-DPI Master PNG
const resvg512 = new Resvg(svg, {
  fitTo: { mode: 'width', value: 512 },
  background: 'rgba(0, 0, 0, 0)',
});
const png512 = resvg512.render().asPng();

// Render 128x128 Retina Email PNG
const resvg128 = new Resvg(svg, {
  fitTo: { mode: 'width', value: 128 },
  background: 'rgba(0, 0, 0, 0)',
});
const png128 = resvg128.render().asPng();

// Render 64x64 Compact PNG
const resvg64 = new Resvg(svg, {
  fitTo: { mode: 'width', value: 64 },
  background: 'rgba(0, 0, 0, 0)',
});
const png64 = resvg64.render().asPng();

// Write to public paths
fs.writeFileSync(path.join(publicDir, 'logo.png'), png512);
fs.writeFileSync(path.join(publicDir, 'gobetter-logo.png'), png512);
fs.writeFileSync(path.join(publicDir, 'logo-128.png'), png128);
fs.writeFileSync(path.join(logosDir, 'gobetter.png'), png128);

console.log('Successfully generated:');
console.log(' - public/logo.png (512x512, ' + png512.length + ' bytes)');
console.log(' - public/gobetter-logo.png (512x512, ' + png512.length + ' bytes)');
console.log(' - public/logo-128.png (128x128, ' + png128.length + ' bytes)');
console.log(' - public/logos/gobetter.png (128x128, ' + png128.length + ' bytes)');
