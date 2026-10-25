/*ENGINE-START*/
// 純函式臨床引擎：不碰 DOM，tests.cjs 直接載入此區塊測試。
// 主要依據：ESE/ERA-EDTA 2014 Clinical Practice Guideline（Spasovski）、
// 2013 US Expert Panel（Verbalis）校正速率與 ODS 風險建議。
const HN = (() => {
  const num = v => (v === undefined || v === null || String(v).trim() === '') ? NaN : Number(v);
  const arr = v => Array.isArray(v) ? v : [];
  const real = v => arr(v).filter(x => x !== '無');
  const fin = Number.isFinite;

  // ESE 2014：嘔吐、心肺窘迫、異常嗜睡、癲癇、昏迷(GCS<=8) 屬嚴重症狀
  const SEVERE_SYMPTOMS = ['嘔吐', '嗜睡', '癲癇', '昏迷', '心肺窘迫'];
  const MODERATE_SYMPTOMS = ['噁心', '頭痛', '混亂'];
  const SEV_ORDER = ['無症狀/輕微', '中度症狀', '嚴重症狀'];

  function severity(s) {
    const picked = SEV_ORDER.indexOf(s.symptomSeverity);
    const sym = arr(s.symptoms);
    const derived = sym.some(x => SEVERE_SYMPTOMS.includes(x)) ? 2 : sym.some(x => MODERATE_SYMPTOMS.includes(x)) ? 1 : 0;
    const level = Math.max(picked, derived);
    return {
      level,
      label: level < 0 ? '' : SEV_ORDER[level],
      upgraded: picked >= 0 && derived > picked
    };
  }

  function classify(s) {
    const n = num(s.serumNa);
    if (!fin(n)) return '尚未分類';
    if (n < 125) return 'profound hyponatremia (<125)';
    if (n < 130) return 'moderate hyponatremia (125–129)';
    if (n < 135) return 'mild hyponatremia (130–134)';
    return '未達低血鈉定義 (Na ≥135)';
  }

  // Hillier：血糖每高於 100 mg/dL 100 單位，Na 校正 +2.4；血糖 <=100 不校正
  function correctedNa(s) {
    const n = num(s.serumNa), g = num(s.glucose);
    if (!fin(n) || !fin(g)) return NaN;
    return Math.round((n + 2.4 * Math.max(0, g - 100) / 100) * 10) / 10;
  }

  // 尿素可自由穿越細胞膜，為無效滲透物：有效 Osm = 實測 Osm − BUN/2.8
  function effectiveOsm(s) {
    const o = num(s.serumOsm), b = num(s.bun);
    if (!fin(o) || !fin(b)) return NaN;
    return Math.round(o - b / 2.8);
  }

  function tonicity(s) {
    const o = num(s.serumOsm);
    if (!fin(o)) return { key: 'pending', text: '尚未判斷' };
    if (o < 275) return { key: 'hypo', text: '低張性低血鈉' };
    const eff = effectiveOsm(s);
    if (fin(eff) && eff < 275) return { key: 'hypo', text: `低張性低血鈉（實測 Osm 被尿素墊高，有效 Osm ≈ ${eff}）` };
    const cna = correctedNa(s);
    if (o > 295) {
      const hyperG = fin(cna) && cna >= 135 ? '；校正鈉已正常，以高血糖解釋' : '';
      return { key: 'hyper', text: `高張性低血鈉：高血糖、mannitol、顯影劑等滲透物${hyperG}` };
    }
    return { key: 'iso', text: '等張性：偽性低血鈉（高脂/高蛋白）或等張沖洗液' };
  }

  const exclusionsPending = s => {
    if (s.adrenal !== '已排除 adrenal insufficiency') return { key: 'adrenal', text: s.adrenal === '疑似/確認 adrenal insufficiency' ? '疑似 adrenal insufficiency（尿鈉高、等/低容積皆可）：先處理皮質醇不足' : '符合 SIADH 型態，但需先排除 adrenal insufficiency（早上 cortisol）' };
    if (s.thyroid !== '已排除嚴重低下') return { key: 'thyroid', text: s.thyroid === '疑似/確認嚴重低下' ? '疑似嚴重甲狀腺低下：先治療甲狀腺' : '符合 SIADH 型態，但需先排除嚴重甲狀腺低下（TSH/free T4）' };
    return null;
  };

  // ESE 2014 演算法：張力 → 尿 Osm → 尿 Na → 利尿劑/腎病 → 細胞外液量
  function etiology(s) {
    const t = tonicity(s);
    if (t.key === 'hyper' || t.key === 'iso') return { key: 'nonhypo', text: '非低張性：先處理高血糖/滲透物或確認偽性低血鈉，不走低張鑑別流程' };
    if (t.key === 'pending') return { key: 'pending', text: '等待血清滲透壓' };
    const n = num(s.serumNa);
    if (fin(n) && n >= 135) return { key: 'none', text: '血鈉未低於 135，非低血鈉' };
    const uo = num(s.urineOsm), un = num(s.urineNa), v = s.volumeStatus;
    if (!fin(uo)) return { key: 'pending', text: '等待尿液滲透壓' };
    if (uo <= 100) return { key: 'water', text: '尿 Osm ≤100：相對水分過多（primary polydipsia、低溶質攝取、beer potomania）' };
    if (!fin(un)) return { key: 'pending', text: '等待尿鈉' };
    if (un <= 30) {
      if (v === '高容積/水腫') return { key: 'hypervol', text: '低有效動脈血量、細胞外液增加：HF、肝硬化、腎病症候群' };
      if (v === '等容積') return { key: 'lowuna-euvol', text: '尿鈉 ≤30 但臨床判為等容積：重新評估是否低容積，或低溶質攝取' };
      return { key: 'hypovol', text: '低有效動脈血量、細胞外液減少：腹瀉嘔吐、第三空間、遠期利尿劑' };
    }
    // un > 30
    const diuretic = s.diuretics && s.diuretics !== '無';
    const kidney = s.kidneyFunction === 'AKI' || s.kidneyFunction === 'CKD 3-5';
    if (diuretic || kidney) return { key: 'diuretic-kidney', text: `尿鈉 >30 但有${[diuretic && '近期利尿劑', kidney && '腎臟病'].filter(Boolean).join('、')}：尿鈉難判讀，先考慮利尿劑/腎臟病相關，SIADH 需停藥後再評估` };
    if (v === '低容積') {
      const ai = s.adrenal === '疑似/確認 adrenal insufficiency' ? '（目前疑似 adrenal insufficiency）' : '';
      return { key: 'hypovol-renal', text: `低容積且尿鈉 >30：嘔吐（代謝性鹼）、原發性 adrenal insufficiency、renal/cerebral salt wasting、隱性利尿劑${ai}` };
    }
    if (v === '高容積/水腫') return { key: 'hypervol-renal', text: '高容積且尿鈉 >30：考慮腎功能不全或利尿劑效應' };
    const ex = exclusionsPending(s);
    if (ex) return ex;
    if (v === '等容積') return { key: 'siadh', text: 'SIADH（等容積、尿 Osm >100、尿鈉 >30、無利尿劑/腎/腎上腺/甲狀腺問題）' };
    return { key: 'siadh-vs-hypo', text: '容積不確定：SIADH vs 低容積（含 CSW）；可參考 uric acid、FE urate，必要時小心等張輸液試驗' };
  }

  function odsHigh(s) {
    const n = num(s.serumNa);
    return real(s.odsRisk).length > 0 || (fin(n) && n <= 105);
  }

  // 慢性或時間不明視為慢性
  function rateLimits(s) {
    if (s.onset === '<48 小時') return { chronic: false, goal: '急性：可較積極矯正，目標先 +4–6 改善症狀', limit: '仍持續監測，避免無控制的上升' };
    if (odsHigh(s)) return { chronic: true, high: true, goal: '目標 +4–6 mmol/L/24h', limit: '上限 8 mmol/L/任何 24h', max24: 8 };
    return { chronic: true, high: false, goal: '目標 +4–8 mmol/L/24h', limit: '上限 10 mmol/L（首 24h），之後每 24h ≤8', max24: 10 };
  }

  // Watson 簡化 TBW 係數
  function tbw(s) {
    const w = num(s.weight), age = num(s.age);
    if (!fin(w) || w <= 0) return NaN;
    const old = fin(age) && age >= 65;
    const f = s.sex === '男性' ? (old ? 0.5 : 0.6) : s.sex === '女性' ? (old ? 0.45 : 0.5) : (old ? 0.475 : 0.55);
    return Math.round(w * f * 10) / 10;
  }

  // Adrogué–Madias：每 1 L 輸液預估 ΔNa = (輸液 Na − 血 Na)/(TBW + 1)
  function adrogue(s, infusateNa) {
    const n = num(s.serumNa), t = tbw(s);
    if (!fin(n) || !fin(t)) return NaN;
    return Math.round((infusateNa - n) / (t + 1) * 10) / 10;
  }

  // Furst ratio：(尿 Na + 尿 K)/血 Na；>1 限水幾乎無效，0.5–1 效果有限
  function furst(s) {
    const un = num(s.urineNa), uk = num(s.urineK), n = num(s.serumNa);
    if (!fin(un) || !fin(uk) || !fin(n) || n <= 0) return NaN;
    return Math.round((un + uk) / n * 100) / 100;
  }

  function followUp(s) {
    const n0 = num(s.serumNa), n1 = num(s.naFollow), h = num(s.hoursFollow);
    if (!fin(n0) || !fin(n1) || !fin(h) || h <= 0) return null;
    const delta = Math.round((n1 - n0) * 10) / 10;
    const lim = rateLimits(s);
    const out = { delta, hours: h, status: 'ok', text: '' };
    if (lim.chronic && h <= 24 && delta > lim.max24) { out.status = 'over'; out.text = `${h} 小時內上升 ${delta}，已超過上限 ${lim.max24}：過度校正，立即 re-lowering`; }
    else if (lim.chronic && h < 24 && delta >= lim.max24 - 2) { out.status = 'near'; out.text = `${h} 小時內已上升 ${delta}，接近上限 ${lim.max24}：停止升鈉治療並考慮 DDAVP clamp`; }
    else if (delta < 0) { out.status = 'falling'; out.text = `血鈉下降 ${-delta}：治療無效或持續失鈉/水分過多，需重新評估`; }
    else out.text = `${h} 小時上升 ${delta}，在速率範圍內`;
    return out;
  }

  const has = (s, x) => arr(s.availableTherapy).includes(x);
  const avail = (s, x) => (arr(s.availableTherapy).length && !has(s, x)) ? '（目前未勾選可用）' : '';

  function plan(s) {
    const p = [], sev = severity(s), e = etiology(s), t = tonicity(s), lim = rateLimits(s);
    const n = num(s.serumNa), w = num(s.weight);
    if (e.key === 'none') return ['血鈉 ≥135，不符合低血鈉；確認檢驗與臨床情境。'];
    if (e.key === 'nonhypo') {
      p.push(t.key === 'hyper' ? '非低張性：治療高血糖/移除滲透物，不給高張鹽水，也不限水作為主要治療。' : '等張性：確認偽性低血鈉（直接 ISE / 血氣鈉），不需矯正血鈉本身。');
      return p;
    }
    if (sev.upgraded) p.push(`症狀勾選含 ${arr(s.symptoms).filter(x => SEVERE_SYMPTOMS.includes(x) || MODERATE_SYMPTOMS.includes(x)).join('、')}，以「${sev.label}」處理（ESE：嘔吐即屬嚴重）。`);
    if (sev.level === 2) {
      const dose = fin(w) ? `（約 2 mL/kg ≈ ${Math.round(w * 2)} mL）` : '';
      p.push(`立即：3% NaCl 150 mL IV over 20 min${dose}，20 分鐘後驗 Na，可重複 2–3 次直到症狀改善或 Na 上升 5 mmol/L${avail(s, '3% 高張鹽水')}。`);
      p.push('Na 上升 5 後症狀改善：停 3%，改 0.9% NaCl 維持靜脈通路並開始病因治療；首 24h 上升仍受速率上限約束。');
    } else if (sev.level === 1) {
      p.push(`中度症狀：可單次 3% NaCl 150 mL over 20 min${avail(s, '3% 高張鹽水')}，目標 24h 上升約 5；同時找病因、停可疑藥物。`);
    } else if (sev.level === 0) {
      p.push('無或輕微症狀：以病因導向治療為主，不需緊急高張鹽水。');
    }
    switch (e.key) {
      case 'water':
        p.push('低尿 Osm：限制自由水、增加蛋白/鹽分溶質攝取；停止大量飲水後會自發水利尿，過度校正風險高。');
        break;
      case 'hypovol':
      case 'hypovol-renal':
      case 'lowuna-euvol':
        p.push('低容積：0.9% NaCl 或平衡晶體液 0.5–1 mL/kg/h，容量補足後 ADH 下降可快速水利尿，尿量 >100 mL/h 時加驗 Na。');
        if (e.key === 'hypovol-renal') p.push('尿鈉高的低容積：檢查 cortisol、鈉流失原因；CSW 補液補鹽（必要時 fludrocortisone），勿限水。');
        break;
      case 'hypervol':
      case 'hypervol-renal':
        p.push('高容積：限水、限鹽，loop diuretic，治療 HF/肝硬化/腎臟病；不給 0.9% NaCl 矯正血鈉。');
        break;
      case 'diuretic-kidney':
        if (s.diuretics === 'thiazide' || s.diuretics === '兩者/不明') p.push('停用 thiazide（thiazide 相關低血鈉常需永久避免），評估容積後補液。');
        if (s.kidneyFunction === 'AKI' || s.kidneyFunction === 'CKD 3-5') p.push('腎功能不全：水排除能力受限，與腎臟科討論，嚴重時考慮透析（調整透析液 Na 避免過快矯正）。');
        break;
      case 'adrenal':
        if (s.adrenal === '疑似/確認 adrenal insufficiency') p.push('Adrenal insufficiency：抽 cortisol/ACTH 後給 hydrocortisone；補類固醇後 ADH 解除會快速升鈉，需密集監測。');
        else p.push('SIADH 確診前先驗早上 cortisol；未排除前避免只靠限水。');
        break;
      case 'thyroid':
        p.push(s.thyroid === '疑似/確認嚴重低下' ? '嚴重甲狀腺低下：甲狀腺素治療（黏液水腫需排除合併腎上腺不足後再給）。' : '先驗 TSH/free T4，排除嚴重低下再下 SIADH 診斷。');
        break;
      case 'siadh':
      case 'siadh-vs-hypo': {
        const fr = furst(s);
        p.push('SIADH 第一線：限水（約 <800–1000 mL/day）；停可疑藥物；治療腫瘤/CNS/肺部誘因。');
        if (fin(fr)) p.push(`Furst ratio ${fr}：${fr > 1 ? '>1，限水幾乎無效，直接加第二線' : fr > 0.5 ? '0.5–1，限水效果有限，可能需第二線' : '<0.5，限水通常有效'}。`);
        p.push(`第二線：口服 urea 0.25–0.5 g/kg/day${avail(s, 'urea')}，或低劑量 loop diuretic + 口服 NaCl${avail(s, '鹽錠/補溶質')}。`);
        if (e.key === 'siadh-vs-hypo') p.push('容積不確定時避免盲目限水或大量輸液，先補做 uric acid、FE urate 釐清。');
        break;
      }
      default:
        if (e.key === 'pending') p.push('病因資料尚未完成，先完成尿 Osm/尿 Na 與體液評估。');
    }
    // Tolvaptan
    const cirrhosis = arr(s.edemaSigns).includes('肝硬化/腹水') || arr(s.tolvaptanContra).includes('肝病/肝損傷風險');
    const contra = real(s.tolvaptanContra);
    const dilutional = ['siadh', 'hypervol'].includes(e.key);
    if (dilutional) {
      if (sev.level === 2) p.push('Tolvaptan：嚴重症狀需 3% 快速處理，此時不用 tolvaptan。');
      else if (cirrhosis) p.push('Tolvaptan：肝硬化/肝病風險，FDA 警示避免使用。');
      else if (contra.length) p.push(`Tolvaptan：有禁忌/限制（${contra.join('、')}），不建議。`);
      else p.push(`Tolvaptan${avail(s, 'tolvaptan/Samsca')}：可評估於 dilutional 低血鈉（ESE 不建議 SIADH 常規使用，US panel 可用）；住院起始 7.5–15 mg/day，首 24h 不限水，q6–8h 驗 Na，用 ≤30 天。`);
    }
    // 校正速率
    p.push(`校正速率：${lim.goal}；${lim.limit}${lim.high ? '（ODS 高風險）' : ''}。`);
    if (fin(n)) {
      const d3 = adrogue(s, 513), dns = adrogue(s, 154);
      if (fin(d3)) p.push(`Adrogué–Madias（TBW ${tbw(s)} L）：每 1 L 3% NaCl 預估 Na +${d3}；每 1 L 0.9% NaCl 預估 +${dns}（未計入持續尿液流失，僅供估算）。`);
    }
    if (lim.chronic && (lim.high || e.key === 'water' || e.key === 'hypovol' || e.key === 'adrenal')) p.push('過度校正風險高：可考慮預防性 DDAVP clamp（DDAVP 1–2 µg IV q6–8h + 3% 控制上升）。');
    // 監測
    const mon = s.monitoring;
    if (sev.level === 2) p.push('監測：3% 推注後每 20 分鐘驗 Na，穩定後 q4h；需 ICU/高頻抽血。');
    else if (lim.chronic) p.push(`監測：Na 至少 q4–6h${lim.high ? '（高風險 q2–4h）' : ''}直到穩定，並記錄尿量。`);
    if ((sev.level === 2 || lim.high) && (mon === '門診/低頻監測' || mon === '病房 q4-6h')) p.push(`⚠ 目前可執行監測（${mon}）不足以支持此風險，建議轉至可 q2–4h 抽血的單位。`);
    // 過度校正處理
    const fu = followUp(s);
    if (fu) p.push(`追蹤：${fu.text}。`);
    p.push(`若超過上限：停止升鈉治療，D5W 約 10 mL/kg over 1h${avail(s, 'D5W')} + DDAVP 2 µg IV（不短於 q8h）${avail(s, 'DDAVP')}，把 Na 拉回限制內。`);
    return p;
  }

  return { num, arr, severity, classify, correctedNa, effectiveOsm, tonicity, etiology, odsHigh, rateLimits, tbw, adrogue, furst, followUp, plan };
})();
if (typeof module !== 'undefined') module.exports = HN;
/*ENGINE-END*/

if (typeof document !== 'undefined') (() => {
  const { arr } = HN;
  // field: [id, label, type, required, opts, wide]；number 的 opts = [單位, [合理下限, 上限]]
  const steps = [
    { id: 'urgency', title: '臨床症狀與急迫性', short: '症狀', desc: '先判斷是否需要立即處理。嚴重神經症狀時，治療優先於完整鑑別。',
      hints: ['嚴重症狀（ESE 2014）：嘔吐、心肺窘迫、異常嗜睡、癲癇、昏迷（GCS ≤8）。', '中度症狀：噁心無嘔吐、頭痛、意識混亂。', '急性 <48 小時；若時間不明，視為慢性以降低 ODS 風險。', '體重可算 3% 劑量（2 mL/kg）與 Adrogué–Madias 預估。'],
      fields: [['age', '年齡', 'number', 1, ['歲', [0, 120]]], ['sex', '性別', 'select', 1, ['女性', '男性', '其他/不明']], ['weight', '體重', 'number', 0, ['kg', [2, 300]]], ['onset', '低血鈉發生時間', 'select', 1, ['<48 小時', '>=48 小時', '不明']], ['symptomSeverity', '症狀嚴重度', 'select', 1, ['無症狀/輕微', '中度症狀', '嚴重症狀']], ['symptoms', '具體症狀', 'checks', 1, ['噁心', '嘔吐', '頭痛', '混亂', '嗜睡', '癲癇', '昏迷', '心肺窘迫', '肌肉痙攣', '步態不穩/跌倒', '無'], 1], ['initialNote', '其他臨床背景', 'textarea', 0, ['可填入癌症、CNS 疾病、肺部疾病、近期手術、疼痛、噁心、運動、住院背景。'], 1]] },
    { id: 'confirm', title: '確認低血鈉與排除非低張性原因', short: '確認', desc: '用血鈉、血糖與實測血清滲透壓確認是否為真正的低張性低血鈉。',
      hints: ['先排除高血糖、mannitol、IVIG、TURP/子宮鏡沖洗液、嚴重高脂血症或高蛋白血症。', '校正鈉（Hillier）：Na + 2.4 × (glucose − 100)/100。', 'Osm <275 低張；275–295 等張（偽性/沖洗液）；>295 高張（高血糖、mannitol）。', '尿毒症時實測 Osm 被尿素墊高：填 BUN 可算有效 Osm = Osm − BUN/2.8。'],
      fields: [['serumNa', '血清鈉 Na', 'number', 1, ['mEq/L', [90, 180]]], ['glucose', '血糖', 'number', 1, ['mg/dL', [10, 2000]]], ['serumOsm', '實測血清滲透壓', 'number', 1, ['mOsm/kg', [150, 450]]], ['bun', 'BUN', 'number', 0, ['mg/dL', [1, 300]]], ['pseudoRisk', '偽性/非低張性線索', 'checks', 1, ['高脂血症', '高蛋白血症', '高血糖', 'mannitol', 'IVIG', 'TURP/子宮鏡沖洗液', '造影/其他滲透物', '無'], 1]] },
    { id: 'urine', title: '尿液滲透壓與水排除能力', short: '尿滲透壓', desc: '確認腎臟是否能適當排出稀釋尿，將低溶質/多喝水與 AVP 相關狀態分開。',
      hints: ['Urine osmolality ≤100：primary polydipsia、beer potomania、tea and toast diet。', 'Urine osmolality >100：尿液不適當濃縮，進一步看尿鈉與體液狀態。', '尿液應與血液同時採檢，且在給輸液/利尿劑前。'],
      fields: [['urineOsm', '尿液滲透壓', 'number', 1, ['mOsm/kg', [20, 1500]]], ['fluidIntake', '水分/低溶質攝取線索', 'checks', 1, ['大量飲水', '精神性多喝水', '耐力運動', 'MDMA/ecstasy', '啤酒大量攝取', '低蛋白低鹽飲食', '營養不良', '無'], 1]] },
    { id: 'volume', title: '尿鈉與體液狀態鑑別', short: '體液狀態', desc: '用尿鈉、有效循環量與水腫狀態定位為低容積、等容積或高容積低血鈉。',
      hints: ['Urine Na ≤30：低有效動脈血量，如 HF、肝硬化、腎病症候群、嘔吐腹瀉、第三空間。', 'Urine Na >30：先問利尿劑與腎臟病，再評估 adrenal insufficiency、SIADH、CSW。', '填尿鉀可算 Furst ratio，預測限水是否有效。'],
      fields: [['urineNa', '尿鈉', 'number', 1, ['mmol/L', [0, 400]]], ['urineK', '尿鉀', 'number', 0, ['mmol/L', [0, 300]]], ['volumeStatus', '臨床體液狀態', 'select', 1, ['低容積', '等容積', '高容積/水腫', '不確定']], ['edemaSigns', '水腫/低有效循環線索', 'checks', 1, ['心衰竭', '肝硬化/腹水', '腎病症候群', '腎衰竭', '下肢水腫', '肺水腫', '無'], 1], ['lossSigns', '體液或鈉流失線索', 'checks', 1, ['嘔吐', '腹瀉', '流汗/燒傷', '胰臟炎/第三空間', '近期利尿劑', '腦部疾病後疑 CSW', '無'], 1]] },
    { id: 'etiology', title: '病因確認：內分泌、用藥、影像與共病', short: '病因', desc: '補齊 SIADH 排除條件、藥物與影像線索，避免把可逆原因誤判為 SIADH。',
      hints: ['SIADH 是排除性診斷：需排除 adrenal insufficiency、嚴重甲狀腺低下、腎衰竭、近期利尿劑。', '常見誘因：惡性腫瘤、CNS 疾病、肺部感染、SSRI、carbamazepine、cyclophosphamide、desmopressin。', '影像/病史資料可協助找出 CNS、肺部或腫瘤相關病因。'],
      fields: [['kidneyFunction', '腎功能', 'select', 1, ['正常/接近正常', 'AKI', 'CKD 3-5', '不明']], ['thyroid', '甲狀腺功能', 'select', 1, ['已排除嚴重低下', '疑似/確認嚴重低下', '尚未檢查']], ['adrenal', '腎上腺/皮質醇狀態', 'select', 1, ['已排除 adrenal insufficiency', '疑似/確認 adrenal insufficiency', '尚未檢查']], ['diuretics', '近期利尿劑', 'select', 1, ['無', 'thiazide', 'loop', '兩者/不明']], ['medications', '可能引起 SIADH 的藥物', 'checks', 1, ['SSRI/SNRI/TCA/MAOI', 'carbamazepine/oxcarbazepine', 'valproate/lamotrigine', 'cyclophosphamide/vinca/platinum', 'desmopressin', 'NSAID/opioid', '其他', '無'], 1], ['imaging', '影像/病史線索', 'checks', 1, ['肺部感染/病灶', '肺癌/惡性腫瘤', 'CNS 感染', '中風/SAH/腦出血', '頭部外傷', '術後/疼痛/噁心', '胸腺瘤/淋巴瘤', '無'], 1], ['supportLabs', '輔助檢驗', 'textarea', 0, ['可填 uric acid、BUN/urea、FE uric acid、cortisol、TSH/free T4、CXR/CT/MRI 摘要。'], 1]] },
    { id: 'treatment', title: '治療策略與過度校正預防', short: '治療', desc: '根據症狀、慢性風險與病因，產生治療方向、監測頻率與過度校正警示。',
      hints: ['嚴重症狀：3% NaCl 150 mL over 20 min，可重複 2–3 次直到症狀改善或 Na 上升 5 mmol/L。', '慢性/時間不明：一般上限 10 mmol/L 首 24h；ODS 高風險上限 8，目標 4–6。', 'Tolvaptan 不適用於低容積、需緊急矯正、無法感覺口渴、無尿、肝病，或與高張鹽水併用。', '填治療後血鈉與經過時數，可即時檢查是否過度校正。'],
      fields: [['odsRisk', 'ODS 高風險因子', 'checks', 1, ['Na <=105', '低血鉀', '酗酒', '營養不良', '晚期肝病', '無'], 1], ['availableTherapy', '可用治療', 'checks', 1, ['限水', '3% 高張鹽水', 'loop diuretic', '鹽錠/補溶質', 'urea', 'DDAVP', 'D5W', 'tolvaptan/Samsca', '補充 cortisol/甲狀腺治療'], 1], ['tolvaptanContra', 'Tolvaptan 禁忌/限制', 'checks', 1, ['需緊急快速矯正嚴重神經症狀', '低容積性低血鈉', '無法反應口渴', '無尿', '肝病/肝損傷風險', '強 CYP3A inhibitor', '正在使用 hypertonic saline', '無'], 1], ['monitoring', '可執行監測強度', 'select', 1, ['ICU/高頻抽血 q2-4h', '病房 q4-6h', '門診/低頻監測', '不確定']], ['naFollow', '治療後血鈉', 'number', 0, ['mEq/L', [90, 180]]], ['hoursFollow', '距基線時數', 'number', 0, ['小時', [0.1, 168]]]] }
  ];
  const RANGE_ERR = '超出合理範圍，請確認單位';

  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 私密模式等無法儲存時仍可使用 */ } }
  };
  let state = {};
  try { state = JSON.parse(store.get('hyponatremiaWizard', '{}')) || {}; } catch { state = {}; }
  let cur = Math.min(Math.max(parseInt(store.get('hyponatremiaStep', '0'), 10) || 0, 0), steps.length - 1);
  const save = () => { store.set('hyponatremiaWizard', JSON.stringify(state)); store.set('hyponatremiaStep', String(cur)); };

  const empty = v => Array.isArray(v) ? v.length === 0 : (v === undefined || String(v).trim() === '');
  function outOfRange(f) {
    if (f[2] !== 'number' || empty(state[f[0]])) return false;
    const v = Number(state[f[0]]), r = f[4][1];
    return !Number.isFinite(v) || (r && (v < r[0] || v > r[1]));
  }
  // 選填欄位不阻擋完成；必填欄位需有值且數值在合理範圍
  const full = f => !f[3] || (!empty(state[f[0]]) && !outOfRange(f));
  const done = i => steps[i].fields.every(full) && !steps[i].fields.some(outOfRange);
  const firstOpen = () => { const i = steps.findIndex((_, n) => !done(n)); return i < 0 ? steps.length - 1 : i; };
  const optionalEmpty = i => steps[i].fields.some(f => !f[3] && empty(state[f[0]]));

  function upd(id, val, go = true) {
    if (empty(val)) delete state[id]; else state[id] = val;
    save(); paintSide(); summary(); validate();
    if (go) auto();
  }
  // 必填完成後自動前進；若本步還有空白選填欄位則停留，避免跳過
  let timer;
  function auto() {
    clearTimeout(timer);
    if (!done(cur) || cur >= steps.length - 1 || optionalEmpty(cur)) return;
    timer = setTimeout(() => { if (done(cur) && !optionalEmpty(cur)) go(cur + 1); }, 450);
  }
  function go(i) { clearTimeout(timer); cur = i; save(); render(); $('#wizardForm').scrollIntoView({ block: 'start', behavior: 'smooth' }); }

  function field(f) {
    const [id, label, type, req, opts, wide] = f;
    // checkbox 群組用 fieldset：<label> 內含多個 input 時點標題會勾到第一個選項
    const box = document.createElement(type === 'checks' ? 'fieldset' : 'label');
    box.className = 'field' + (wide ? ' full' : '');
    const cap = document.createElement(type === 'checks' ? 'legend' : 'span');
    cap.className = 'field-label';
    cap.innerHTML = `${label}${type === 'number' && opts[0] ? ` (${opts[0]})` : ''} ${req ? '<span class="required">*</span>' : '<span class="optional">選填</span>'}`;
    box.appendChild(cap);
    let c;
    if (type === 'select') {
      c = document.createElement('select');
      c.innerHTML = '<option value="">請選擇</option>' + opts.map(o => `<option>${o}</option>`).join('');
      c.value = state[id] || '';
      c.onchange = () => upd(id, c.value);
    } else if (type === 'checks') {
      c = document.createElement('div');
      c.className = 'choice-grid';
      opts.forEach(o => {
        const l = document.createElement('label');
        l.className = 'choice' + (o === '無' ? ' choice-none' : '');
        l.innerHTML = `<input name="${id}" type="checkbox" value="${o}" ${arr(state[id]).includes(o) ? 'checked' : ''}><span>${o}</span>`;
        l.querySelector('input').onchange = e => {
          let n = arr(state[id]).filter(x => x !== o);
          if (e.target.checked) n = o === '無' ? ['無'] : n.filter(x => x !== '無').concat(o);
          // 「無」與其他選項互斥，需同步畫面
          c.querySelectorAll('input').forEach(i => { i.checked = n.includes(i.value); });
          upd(id, n);
        };
        c.appendChild(l);
      });
    } else if (type === 'textarea') {
      c = document.createElement('textarea');
      c.value = state[id] || '';
      c.oninput = () => upd(id, c.value, false);
      c.onchange = () => auto();
    } else {
      c = document.createElement('input');
      c.type = 'number'; c.step = 'any'; c.inputMode = 'decimal';
      if (opts[1]) { c.min = opts[1][0]; c.max = opts[1][1]; }
      c.value = state[id] ?? '';
      c.oninput = () => { upd(id, c.value, false); box.classList.toggle('invalid', outOfRange(f)); err.textContent = outOfRange(f) ? RANGE_ERR : ''; };
      c.onchange = () => auto();
    }
    if (type !== 'checks') { c.id = c.name = id; }
    box.appendChild(c);
    const err = document.createElement('small');
    err.className = 'field-error';
    if (outOfRange(f)) { err.textContent = RANGE_ERR; box.classList.add('invalid'); }
    box.appendChild(err);
    if (type === 'textarea' && opts[0]) {
      const h = document.createElement('small');
      h.className = 'field-help'; h.textContent = opts[0];
      box.appendChild(h);
    }
    return box;
  }

  function paintSide() {
    const ol = $('#stepList'), open = firstOpen();
    ol.innerHTML = '';
    steps.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = 'step-item' + (i === cur ? ' is-current' : '') + (done(i) ? ' is-complete' : '') + (i > open ? ' is-locked' : '');
      li.innerHTML = `<button type="button" ${i > open ? 'disabled' : ''} ${i === cur ? 'aria-current="step"' : ''}><span class="step-index">${done(i) ? '✓' : i + 1}</span><span><strong>${s.short}</strong><span>${s.title}</span></span></button>`;
      li.querySelector('button').onclick = () => { if (i <= firstOpen()) go(i); };
      ol.appendChild(li);
    });
    $('#statusHeadline').textContent = HN.classify(state);
    $('#statusDetail').textContent = `${HN.tonicity(state).text}；病因方向：${HN.etiology(state).text}`;
  }

  function summary() {
    const cna = HN.correctedNa(state), eff = HN.effectiveOsm(state), fr = HN.furst(state), sev = HN.severity(state);
    const list = k => HN.arr(state[k]).join('、') || '未填';
    const out = [
      `血鈉分類：${HN.classify(state)}`,
      `校正鈉：${Number.isFinite(cna) ? cna + ' mEq/L' : '尚未計算'}${Number.isFinite(eff) ? `；有效 Osm：${eff}` : ''}`,
      `張力判讀：${HN.tonicity(state).text}`,
      `病因方向：${HN.etiology(state).text}`,
      '',
      '關鍵資料',
      `- ${state.age || '?'} 歲 ${state.sex || ''}${state.weight ? `，${state.weight} kg` : ''}`,
      `- 症狀：${sev.label || '未填'}（${list('symptoms')}）；發生時間：${state.onset || '未填'}`,
      `- Serum Na / Osm / Glucose / BUN：${state.serumNa || '?'} / ${state.serumOsm || '?'} / ${state.glucose || '?'} / ${state.bun || '-'}`,
      `- Urine Osm / Na / K：${state.urineOsm || '?'} / ${state.urineNa || '?'} / ${state.urineK || '-'}${Number.isFinite(fr) ? `（Furst ${fr}）` : ''}`,
      `- 體液狀態：${state.volumeStatus || '未填'}；水腫線索：${list('edemaSigns')}；流失線索：${list('lossSigns')}`,
      `- 腎功能：${state.kidneyFunction || '未填'}；甲狀腺：${state.thyroid || '未填'}；腎上腺：${state.adrenal || '未填'}；利尿劑：${state.diuretics || '未填'}`,
      `- 藥物：${list('medications')}；影像/病史：${list('imaging')}`,
      `- ODS 風險：${HN.odsHigh(state) ? '高' : '一般'}（${list('odsRisk')}）`,
      '',
      '治療提示',
      ...HN.plan(state).map(x => '- ' + x)
    ];
    $('#liveSummary').textContent = out.join('\n');
  }

  function validate() {
    const miss = steps[cur].fields.filter(f => f[3] && empty(state[f[0]])).map(f => f[1]);
    const bad = steps[cur].fields.filter(outOfRange).map(f => f[1]);
    const v = $('.validation'), n = $('#nextBtn');
    if (v) {
      v.classList.toggle('ok', !miss.length && !bad.length);
      v.textContent = bad.length ? '數值需確認：' + bad.join('、')
        : miss.length ? '請先完成：' + miss.join('、')
        : cur === steps.length - 1 ? '資料已完成，可查看下方摘要或複製。'
        : optionalEmpty(cur) ? '必填已完成；可補選填欄位，或按「下一步」。' : '必填資料已完成，流程會自動前進。';
    }
    if (n) n.disabled = !done(cur);
  }

  function render() {
    const s = steps[cur];
    $('#stepTitle').textContent = s.title;
    $('#hintText').innerHTML = '<ul>' + s.hints.map(h => `<li>${h}</li>`).join('') + '</ul>';
    $('#wizardForm').innerHTML = `<div class="step-intro"><p>${s.desc}</p><div><span class="tag">${HN.classify(state)}</span><span class="tag">${HN.tonicity(state).text}</span></div></div><div class="fields"></div><div class="validation" aria-live="polite"></div><div class="nav-row"><button class="text-button" type="button" id="backBtn">上一步</button><button class="primary-button" type="button" id="nextBtn">${cur === steps.length - 1 ? '查看摘要' : '下一步'}</button></div>`;
    const fs = $('.fields');
    s.fields.forEach(f => fs.appendChild(field(f)));
    $('#backBtn').disabled = cur === 0;
    $('#backBtn').onclick = () => { if (cur > 0) go(cur - 1); };
    $('#nextBtn').onclick = () => {
      if (!done(cur)) return;
      if (cur < steps.length - 1) go(cur + 1);
      else { const r = $('.result-box'); r.scrollIntoView({ behavior: 'smooth', block: 'start' }); r.classList.add('flash'); setTimeout(() => r.classList.remove('flash'), 1200); }
    };
    paintSide(); summary(); validate();
  }

  $('#resetBtn').onclick = () => {
    if (Object.keys(state).length && !confirm('清除所有已填資料並重新開始？')) return;
    state = {}; go(0);
  };
  $('#copyBtn').onclick = async () => {
    const text = $('#liveSummary').textContent, btn = $('#copyBtn');
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    btn.classList.add('copied'); btn.title = '已複製';
    setTimeout(() => { btn.classList.remove('copied'); btn.title = '複製摘要'; }, 1500);
  };
  // 舊版儲存的衍生欄位不再使用
  delete state.correctedNa;
  render();
})();
