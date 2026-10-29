const assert = require('node:assert/strict');
const {translate, chooseLanguage, messages} = require('../static/i18n.js');
assert.equal(chooseLanguage('fr-FR'), 'fr');
assert.equal(chooseLanguage('zh-TW'), 'zh-CN');
assert.equal(chooseLanguage('invalid'), 'en');
assert.equal(translate('Import video', 'fr'), 'Importer la vidéo');
assert.equal(translate('Import video', 'zh-CN'), '导入视频');
assert.equal(translate('Noise sample: 00:01.00 – 00:02.00. Keep speech out of this selection.', 'fr'), 'Échantillon de bruit : 00:01.00 – 00:02.00. Évitez toute parole dans cette sélection.');
assert.equal(translate('Importing video… 42%', 'zh-CN'), '正在导入视频… 42%');
assert.equal(translate('my tutorial 中文.mp4', 'fr'), 'my tutorial 中文.mp4');
assert.equal(translate('Unknown FFmpeg diagnostic', 'zh-CN'), 'Unknown FFmpeg diagnostic');
assert.equal(translate('Original', 'en'), 'Original');
assert.ok(messages.length > 100);
for (const row of messages) {
  assert.equal(row.length, 3);
  for (const text of row) assert.ok(typeof text === 'string' && text.length);
  const slots = text => [...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  assert.deepEqual(slots(row[0]), slots(row[1]), row[0]);
  assert.deepEqual(slots(row[0]), slots(row[2]), row[0]);
}
console.log(`Language checks passed (${messages.length} translated messages).`);
