import sharp from 'sharp';
import fs from 'node:fs/promises';

const directory='public/images';
for (const name of ['home-hero','buyers-hero']) {
  for (const width of [640,960]) await sharp(`${directory}/${name}.jpg`).resize({width,withoutEnlargement:true}).jpeg({quality:82,progressive:true}).toFile(`${directory}/${name}-${width}.jpg`);
}
for (const width of [480,800,1365]) await sharp(`${directory}/katrina-portrait.png`).resize({width,withoutEnlargement:true}).webp({quality:84,effort:5}).toFile(`${directory}/katrina-portrait-${width}.webp`);
const logo=await sharp(`${directory}/logo-transparent.png`).resize({width:1000}).png().toBuffer();
const {height}=await sharp(logo).metadata();
await sharp({create:{width:1200,height:630,channels:3,background:'#FAFBF7'}})
  .composite([{input:logo,left:100,top:Math.floor((630-height)/2)}]).jpeg({quality:90,progressive:true}).toFile(`${directory}/social-preview.jpg`);
const original=(await fs.stat(`${directory}/katrina-portrait.png`)).size;
const optimized=(await fs.stat(`${directory}/katrina-portrait-800.webp`)).size;
console.log(`Prepared responsive image derivatives and branded share image. Portrait at 800px: ${Math.round(original/1024)} KB PNG → ${Math.round(optimized/1024)} KB WebP.`);
