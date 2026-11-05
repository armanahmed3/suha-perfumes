/** Compare conservative edit: keep bottle pixel-natural, only swap background. */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import sharp from 'sharp';

const PROMPT = [
  'Keep the perfume bottle completely unchanged and natural, exactly as in the original photo: same white plastic spray pump, same clear glass, same pale yellow liquid, same label with the exact same text "SUHA PERFUMES Impression of 212 MEN", same colors, same sharpness. Do not add glow, do not tint, do not redraw the bottle.',
  'Replace ONLY the background: elegant dark charcoal-black luxury studio backdrop, soft warm golden gradient light behind the bottle, glossy dark reflective table surface with a faint mirror reflection under the bottle, soft professional studio lighting.',
  'Photorealistic high-end product photography.',
].join(' ');

const zai = await ZAI.create();
const inputBuf = await fs.promises.readFile('/home/z/my-project/scripts/originals/212-men-small.jpg');
const dataUrl = `data:image/jpeg;base64,${inputBuf.toString('base64')}`;

const res = await zai.images.generations.edit({
  prompt: PROMPT,
  images: [{ url: dataUrl }],
  size: '1024x1024',
});
const b64 = res?.data?.[0]?.base64;
if (!b64) throw new Error('empty');
fs.writeFileSync('/tmp/compare_conservative.png', Buffer.from(b64, 'base64'));
await sharp('/tmp/compare_conservative.png').jpeg({ quality: 90 }).toFile('/tmp/compare_conservative.jpg');
console.log('saved /tmp/compare_conservative.jpg');
