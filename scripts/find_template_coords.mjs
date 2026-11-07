import sharp from 'sharp';

async function measure() {
  const meta100 = await sharp('C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_product_1794077994904.jpg').metadata();
  console.log('100ml meta:', meta100.width, meta100.height);

  const meta35 = await sharp('C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_35ml_1794078082596.jpg').metadata();
  console.log('35ml meta:', meta35.width, meta35.height);

  // Extract label crop of 100ml
  // In 100ml, label is centered vertically and horizontally on the bottle
  await sharp('C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_product_1794077994904.jpg')
    .extract({ left: 320, top: 440, width: 250, height: 350 })
    .toFile('scripts/zoom_100ml_label.jpg');

  // Extract label crop of 35ml
  await sharp('C:/Users/smmar/.gemini/antigravity/brain/2e9eef5b-845d-4bb7-a599-57cae0692b9d/suha_sauvage_35ml_1794078082596.jpg')
    .extract({ left: 330, top: 400, width: 220, height: 350 })
    .toFile('scripts/zoom_35ml_label.jpg');

  console.log('Saved zoom labels');
}

measure().catch(console.error);

