// node tests.cjs — 臨床引擎單元測試
const assert = require('assert');
const HN = require('./app.js');
let pass = 0;
const t = (name, fn) => { try { fn(); pass++; } catch (e) { console.error('FAIL', name, '\n ', e.message); process.exitCode = 1; } };

const base = { age: '70', sex: '女性', onset: '>=48 小時', symptomSeverity: '無症狀/輕微', symptoms: ['無'], serumNa: '122', glucose: '100', serumOsm: '255', pseudoRisk: ['無'] };
const siadh = { ...base, urineOsm: '450', urineNa: '60', volumeStatus: '等容積', kidneyFunction: '正常/接近正常', thyroid: '已排除嚴重低下', adrenal: '已排除 adrenal insufficiency', diuretics: '無', odsRisk: ['無'] };

t('classify ESE bands', () => {
  assert.strictEqual(HN.classify({ serumNa: '124.9' }).startsWith('profound'), true);
  assert.strictEqual(HN.classify({ serumNa: '129.5' }).startsWith('moderate'), true);
  assert.strictEqual(HN.classify({ serumNa: '130' }).startsWith('mild'), true);
  assert.strictEqual(HN.classify({ serumNa: '135' }).startsWith('未達'), true);
  assert.strictEqual(HN.classify({}), '尚未分類');
});
t('corrected Na: no negative correction below 100', () => {
  assert.strictEqual(HN.correctedNa({ serumNa: '125', glucose: '600' }), 137);
  assert.strictEqual(HN.correctedNa({ serumNa: '125', glucose: '60' }), 125);
});
t('tonicity: hypo / iso / hyper', () => {
  assert.strictEqual(HN.tonicity({ serumOsm: '260' }).key, 'hypo');
  assert.strictEqual(HN.tonicity({ serumOsm: '285' }).key, 'iso');
  assert.strictEqual(HN.tonicity({ serumOsm: '310', serumNa: '125', glucose: '600' }).key, 'hyper');
  assert.match(HN.tonicity({ serumOsm: '310', serumNa: '125', glucose: '600' }).text, /高血糖解釋/);
});
t('uremia: measured osm high, effective osm low → hypotonic', () => {
  const s = { serumOsm: '290', bun: '112' };
  assert.strictEqual(HN.effectiveOsm(s), 250);
  assert.strictEqual(HN.tonicity(s).key, 'hypo');
});
t('empty string is not 0', () => {
  assert.strictEqual(HN.tonicity({ serumOsm: '' }).key, 'pending');
  assert.strictEqual(HN.etiology({ ...base, urineOsm: '' }).key, 'pending');
});
t('vomiting upgrades severity to severe', () => {
  const sv = HN.severity({ symptomSeverity: '中度症狀', symptoms: ['嘔吐'] });
  assert.strictEqual(sv.level, 2); assert.strictEqual(sv.upgraded, true);
  assert.match(HN.plan({ ...siadh, symptomSeverity: '中度症狀', symptoms: ['嘔吐'] }).join('\n'), /3% NaCl 150 mL IV over 20 min/);
});
t('non-hypotonic skips hypertonic saline even if severe', () => {
  const p = HN.plan({ ...base, serumOsm: '320', glucose: '900', symptomSeverity: '嚴重症狀' }).join('\n');
  assert.doesNotMatch(p, /3% NaCl 150/);
  assert.strictEqual(HN.etiology({ ...base, serumOsm: '320' }).key, 'nonhypo');
});
t('Na >=135 is not hyponatremia', () => {
  assert.strictEqual(HN.etiology({ ...siadh, serumNa: '138' }).key, 'none');
});
t('urine osm <=100 → water', () => assert.strictEqual(HN.etiology({ ...siadh, urineOsm: '80' }).key, 'water'));
t('low urine Na: hypervolemic vs hypovolemic', () => {
  assert.strictEqual(HN.etiology({ ...siadh, urineNa: '10', volumeStatus: '高容積/水腫' }).key, 'hypervol');
  assert.strictEqual(HN.etiology({ ...siadh, urineNa: '10', volumeStatus: '低容積' }).key, 'hypovol');
  assert.strictEqual(HN.etiology({ ...siadh, urineNa: '10', volumeStatus: '不確定' }).key, 'hypovol');
  assert.strictEqual(HN.etiology({ ...siadh, urineNa: '10' }).key, 'lowuna-euvol');
});
t('SIADH requires exclusions', () => {
  assert.strictEqual(HN.etiology(siadh).key, 'siadh');
  assert.strictEqual(HN.etiology({ ...siadh, adrenal: '尚未檢查' }).key, 'adrenal');
  assert.strictEqual(HN.etiology({ ...siadh, thyroid: '尚未檢查' }).key, 'thyroid');
  assert.strictEqual(HN.etiology({ ...siadh, diuretics: 'thiazide' }).key, 'diuretic-kidney');
  assert.strictEqual(HN.etiology({ ...siadh, kidneyFunction: 'CKD 3-5' }).key, 'diuretic-kidney');
  assert.strictEqual(HN.etiology({ ...siadh, volumeStatus: '不確定' }).key, 'siadh-vs-hypo');
});
t('high urine Na hypovolemic → renal loss incl. adrenal/CSW', () => {
  const e = HN.etiology({ ...siadh, volumeStatus: '低容積' });
  assert.strictEqual(e.key, 'hypovol-renal'); assert.match(e.text, /adrenal/);
});
t('ODS high risk: Na<=105 auto, limit 8', () => {
  assert.strictEqual(HN.odsHigh({ serumNa: '104', odsRisk: ['無'] }), true);
  assert.strictEqual(HN.rateLimits({ serumNa: '104', onset: '不明' }).max24, 8);
  assert.strictEqual(HN.rateLimits({ serumNa: '120', onset: '不明', odsRisk: ['無'] }).max24, 10);
  assert.strictEqual(HN.rateLimits({ onset: '<48 小時' }).chronic, false);
});
t('TBW and Adrogué–Madias', () => {
  assert.strictEqual(HN.tbw({ weight: '60', sex: '女性', age: '70' }), 27);
  assert.strictEqual(HN.adrogue({ serumNa: '120', weight: '60', sex: '女性', age: '70' }, 513), 14);
  assert.ok(Number.isNaN(HN.tbw({ sex: '男性' })));
});
t('Furst ratio', () => {
  assert.strictEqual(HN.furst({ urineNa: '100', urineK: '40', serumNa: '120' }), 1.17);
  assert.match(HN.plan({ ...siadh, urineNa: '100', urineK: '40', serumNa: '120' }).join('\n'), /限水幾乎無效/);
});
t('overcorrection follow-up', () => {
  assert.strictEqual(HN.followUp({ ...siadh, naFollow: '134', hoursFollow: '20' }).status, 'over');
  assert.strictEqual(HN.followUp({ ...siadh, naFollow: '130', hoursFollow: '12' }).status, 'near');
  assert.strictEqual(HN.followUp({ ...siadh, naFollow: '126', hoursFollow: '12' }).status, 'ok');
  assert.strictEqual(HN.followUp({ ...siadh, naFollow: '120', hoursFollow: '12' }).status, 'falling');
  assert.strictEqual(HN.followUp({ ...siadh, naFollow: '134' }), null);
});
t('tolvaptan: cirrhosis / contra / severe / hypovolemic', () => {
  const ok = HN.plan(siadh).join('\n');
  assert.match(ok, /Tolvaptan：可評估|Tolvaptan（目前未勾選可用）：可評估|Tolvaptan：可評估/);
  assert.match(HN.plan({ ...siadh, urineNa: '10', volumeStatus: '高容積/水腫', edemaSigns: ['肝硬化/腹水'] }).join('\n'), /FDA 警示/);
  assert.match(HN.plan({ ...siadh, tolvaptanContra: ['無尿'] }).join('\n'), /不建議/);
  assert.doesNotMatch(HN.plan({ ...siadh, urineNa: '10', volumeStatus: '低容積' }).join('\n'), /Tolvaptan/);
});
t('tolvaptan dose follows label, 7.5 mg flagged off-label', () => {
  const p = HN.plan(siadh).join('\n');
  assert.match(p, /仿單起始 15 mg\/day（7\.5 mg 屬 off-label/);
  assert.doesNotMatch(p, /7\.5–15/);
});
t('availability note', () => {
  assert.match(HN.plan({ ...siadh, symptomSeverity: '嚴重症狀', availableTherapy: ['限水'] }).join('\n'), /3% NaCl 150 mL IV over 20 min（約|3% NaCl 150 mL IV over 20 min，|未勾選可用/);
});
t('monitoring mismatch warning', () => {
  assert.match(HN.plan({ ...siadh, symptomSeverity: '嚴重症狀', monitoring: '門診/低頻監測' }).join('\n'), /監測.*不足/);
});
t('3% dose by weight', () => {
  assert.match(HN.plan({ ...siadh, weight: '50', symptomSeverity: '嚴重症狀' }).join('\n'), /≈ 100 mL/);
});
// 教學內容：病例數字與考題計算一律回頭對引擎
const { SOURCES, CASES, QUIZ, MAP } = require('./teach-content.js');
const REQUIRED = ['age', 'sex', 'onset', 'symptomSeverity', 'symptoms', 'serumNa', 'glucose', 'serumOsm', 'pseudoRisk', 'urineOsm', 'fluidIntake', 'urineNa', 'volumeStatus', 'edemaSigns', 'lossSigns', 'kidneyFunction', 'thyroid', 'adrenal', 'diuretics', 'medications', 'imaging', 'odsRisk', 'availableTherapy', 'tolvaptanContra', 'monitoring'];
t('8 cases, unique ids, all sources defined', () => {
  assert.strictEqual(CASES.length, 8);
  assert.strictEqual(new Set(CASES.map(c => c.id)).size, 8);
  [...CASES, ...QUIZ].forEach(x => { assert.ok(x.src.length); x.src.forEach(k => assert.ok(SOURCES[k], k)); });
});
CASES.forEach(c => t(`case ${c.id} matches engine`, () => {
  const s = c.base, x = c.expect;
  REQUIRED.forEach(k => assert.ok(s[k] !== undefined && s[k] !== '', `${c.id} missing ${k}`));
  assert.ok(HN.classify(s).startsWith(x.classify), HN.classify(s));
  assert.strictEqual(HN.tonicity(s).key, x.tonicity);
  assert.strictEqual(HN.etiology(s).key, x.etiology);
  assert.strictEqual(HN.severity(s).level, x.sevLevel);
  if ('chronic' in x) assert.strictEqual(HN.rateLimits(s).chronic, x.chronic);
  if ('max24' in x) assert.strictEqual(HN.rateLimits(s).max24, x.max24);
  if ('odsHigh' in x) assert.strictEqual(HN.odsHigh(s), x.odsHigh);
  if ('tbw' in x) assert.strictEqual(HN.tbw(s), x.tbw);
  if ('d3' in x) assert.strictEqual(HN.adrogue(s, 513), x.d3);
  if ('dns' in x) assert.strictEqual(HN.adrogue(s, 154), x.dns);
  if ('furst' in x) assert.strictEqual(HN.furst(s), x.furst);
  if ('cna' in x) assert.strictEqual(HN.correctedNa(s), x.cna);
  if ('eff' in x) assert.strictEqual(HN.effectiveOsm(s), x.eff);
  if ('follow' in x) { assert.strictEqual(HN.followUp(s).status, x.follow); assert.strictEqual(HN.followUp(s).delta, x.delta); }
}));
t('non-hypotonic case does not get 3%', () => assert.doesNotMatch(HN.plan(CASES.find(c => c.id === 'hhs').base).join('\n'), /3% NaCl 150/));
t('quiz: 20 items, 10+10, A–D 5 each, 4 options', () => {
  assert.strictEqual(QUIZ.length, 20);
  assert.strictEqual(QUIZ.filter(q => q.level === '基礎').length, 10);
  assert.strictEqual(QUIZ.filter(q => q.level === '高階').length, 10);
  [0, 1, 2, 3].forEach(a => assert.strictEqual(QUIZ.filter(q => q.answer === a).length, 5));
  QUIZ.forEach(q => assert.strictEqual(q.options.length, 4));
});
const CALC = {
  correctedNa: HN.correctedNa, furst: HN.furst, effectiveOsm: HN.effectiveOsm,
  adrogue513: s => HN.adrogue(s, 513),
  followUpStatus: s => HN.followUp(s).status,
  etiologyKey: s => HN.etiology(s).key
};
QUIZ.filter(q => q.calc).forEach(q => t(`quiz calc: ${q.calc.fn}`, () => assert.strictEqual(CALC[q.calc.fn](q.calc.input), q.calc.value)));
t('map: 8 branches', () => { assert.strictEqual(MAP.branches.length, 8); MAP.branches.forEach(b => assert.ok(b.leaves.length >= 5)); });
console.log(`${pass} tests passed`);
