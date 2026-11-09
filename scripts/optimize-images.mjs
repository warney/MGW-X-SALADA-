import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputDir = path.join(root, 'public', 'optimized');

const images = [
  {
    source: 'src/assets/images/mgw_hero_burger_1793924628211.jpg',
    output: 'mgw-hero.webp',
    width: 1440,
    quality: 78,
  },
  {
    source: 'src/assets/images/mgw_xsalada_burger_1793924627575.jpg',
    output: 'mgw-xsalada.webp',
    width: 1000,
    quality: 78,
  },
  {
    source: 'src/assets/images/mgw_combo_tuchaua_1793924628366.jpg',
    output: 'mgw-combo.webp',
    width: 1000,
    quality: 78,
  },
  {
    source: 'src/assets/images/mgw_tuchaua_guarana_1793924628509.jpg',
    output: 'mgw-tuchaua.webp',
    width: 1000,
    quality: 78,
  },
  {
    source: 'public/assets/aistudio/file_000000007d38820eb94512f2855fdde9_ef02d89c.png',
    output: 'mgw-logo.webp',
    width: 512,
    quality: 82,
  },
];

await fs.mkdir(outputDir, { recursive: true });

for (const image of images) {
  const inputPath = path.join(root, image.source);
  const outputPath = path.join(outputDir, image.output);
  const original = await fs.stat(inputPath);

  await sharp(inputPath)
    .rotate()
    .resize({ width: image.width, withoutEnlargement: true })
    .webp({ quality: image.quality, effort: 5 })
    .toFile(outputPath);

  const optimized = await fs.stat(outputPath);
  const reduction = Math.max(0, Math.round((1 - optimized.size / original.size) * 100));
  console.log(
    `[image-optimization] ${image.output}: ${Math.round(original.size / 1024)} KB -> ${Math.round(optimized.size / 1024)} KB (-${reduction}%)`
  );
}
