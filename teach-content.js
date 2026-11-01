// 示範病例、考題、心智圖內容。病例表格由 HN 引擎即時計算；expect 與 calc 由 tests.cjs 核對，內文數字改動時要一起改。
(() => {
  const pm = id => `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
  const pmc = id => `https://pmc.ncbi.nlm.nih.gov/articles/PMC${id}/`;
  const SOURCES = {
    ese: { label: 'ESE 2014', url: pm(24569125), cite: 'Spasovski G, et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. Eur J Endocrinol 2014;170:G1–47.' },
    us: { label: 'US panel 2013', url: pm(24074529), cite: 'Verbalis JG, et al. Diagnosis, evaluation, and treatment of hyponatremia: expert panel recommendations. Am J Med 2013;126(10 Suppl 1):S1–42.' },
    sterns24: { label: 'Sterns 2024', url: pmc(10843202), cite: 'Sterns RH, et al. Treatment Guidelines for Hyponatremia: Stay the Course. CJASN 2024;19:129–135.' },
    sterns18: { label: 'Sterns 2018', url: pmc(5968908), cite: 'Sterns RH. Treatment of Severe Hyponatremia. CJASN 2018;13:641–649.' },
    salsa: { label: 'SALSA 2021', url: pmc(7589081), cite: 'Baek SH, et al. Risk of overcorrection in rapid intermittent bolus vs slow continuous infusion therapies of hypertonic saline. JAMA Intern Med 2021;181:81–92.' },
    krisanapan: { label: 'Krisanapan 2020', url: pm(32199708), cite: 'Krisanapan P, et al. EFFUSE-FLUID. Am J Kidney Dis 2020;76:203–212（僅讀摘要）。' },
    garrahy: { label: 'Garrahy 2020', url: pm(32879954), cite: 'Garrahy A, et al. Fluid restriction vs no treatment in chronic SIAD. J Clin Endocrinol Metab 2020;105:dgaa619（僅讀摘要）。' },
    refardt: { label: 'Refardt 2020', url: pmc(7062212), cite: 'Refardt J, et al. Empagliflozin in SIADH. J Am Soc Nephrol 2020;31:615–624（僅讀摘要）。' },
    seetha: { label: 'Seethapathy 2023', url: pm(38320180), cite: 'Seethapathy H, et al. Severe hyponatremia correction, mortality, and central pontine myelinolysis. NEJM Evid 2023;2:EVIDoa2300107.' },
    ayus: { label: 'Ayus 2025', url: pmc(11574719), cite: 'Ayus JC, et al. Correction rates and clinical outcomes in hospitalized adults with severe hyponatremia: meta-analysis. JAMA Intern Med 2025;185:38–51.' },
    peria: { label: 'Perianayagam 2008', url: pmc(2390955), cite: 'Perianayagam A, et al. DDAVP is effective in preventing and reversing inadvertent overcorrection of hyponatremia. CJASN 2008;3:331–336.' },
    sood: { label: 'Sood 2013', url: pm(23266328), cite: 'Sood L, et al. Hypertonic saline and desmopressin: a simple strategy for safe correction of severe hyponatremia. Am J Kidney Dis 2013;61:571（僅讀摘要）。' },
    lewellyn: { label: 'Lewellyn 2025', url: pm(40288608), cite: 'Lewellyn 等。Tolvaptan 7.5 mg 統合分析。Endocr Pract 2025;31:956（僅讀摘要）。' },
    hew: { label: 'Hew-Butler 2015', url: pm(26227507), cite: 'Hew-Butler T, et al. Third International EAH Consensus Development Conference. Br J Sports Med 2015;49:1432–46.' },
    samsca: { label: 'Samsca 仿單', url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=samsca', cite: 'Samsca (tolvaptan) US prescribing information, DailyMed（2026-05-07 版）。' },
    morris: { label: 'Morris 2018', url: pm(29478867), cite: 'Morris JH, et al. Tolvaptan in SIADH: overcorrection and lower starting doses. Am J Kidney Dis 2018;71:772.' },
    fenske: { label: 'Fenske 2008', url: pm(18477658), cite: 'Fenske W, et al. Fractional excretion of uric acid in hyponatremia and diuretic use. J Clin Endocrinol Metab 2008;93:2991（僅讀摘要）。' },
    maesaka: { label: 'Maesaka 2023', url: pm(37103959), cite: 'Maesaka JK, et al. Cerebral/renal salt wasting vs SIADH. Kidney360 2023（作者立場，此鑑別仍有爭議）。' },
    hillier: { label: 'Hillier 1999', url: pm(10225241), cite: 'Hillier TA, et al. Hyponatremia: evaluating the correction factor for hyperglycemia. Am J Med 1999;106:399–403（僅讀摘要）。' },
    gross: { label: 'Gross 2012', url: pm(23148195), cite: 'Gross P. Clinical management of SIADH. Ther Adv Endocrinol Metab 2012（Furst 分層的二手來源；Furst 2000 原文未讀）。' },
    adrogue: { label: 'Adrogué 2000', url: pm(10824078), cite: 'Adrogué HJ, Madias NE. Hyponatremia. N Engl J Med 2000;342:1581–9（原文未讀，公式依二手文獻核對）。' },
    hwang: { label: 'Hwang 2010', url: pm(21468197), cite: 'Hwang KS, Kim GH. Thiazide-induced hyponatremia. Electrolyte Blood Press 2010.' },
    filippone: { label: 'Filippone 2020', url: pm(31606239), cite: 'Filippone EJ, et al. Thiazide-associated hyponatremia. Am J Kidney Dis 2020;75:256（僅讀摘要）。' },
    sanghvi: { label: 'Sanghvi 2007', url: pm(17900468), cite: 'Sanghvi SR, et al. Beer potomania. Am J Kidney Dis 2007;50:673（僅讀前言）。' },
    grace: { label: 'Martin-Grace 2022', url: pmc(9282351), cite: 'Martin-Grace J, et al. Approach to the Patient: Hyponatremia and SIAD. J Clin Endocrinol Metab 2022;107:2362–2376.' }
  };

  const ALL_RX = ['限水', '3% 高張鹽水', 'loop diuretic', '鹽錠/補溶質', 'urea', 'DDAVP', 'D5W', 'tolvaptan/Samsca', '補充 cortisol/甲狀腺治療'];
  const OK_ENDO = { thyroid: '已排除嚴重低下', adrenal: '已排除 adrenal insufficiency' };
  const NONE = { pseudoRisk: ['無'], fluidIntake: ['無'], edemaSigns: ['無'], lossSigns: ['無'], medications: ['無'], imaging: ['無'], odsRisk: ['無'], tolvaptanContra: ['無'], diuretics: '無', kidneyFunction: '正常/接近正常', availableTherapy: ALL_RX, monitoring: '病房 q4-6h' };

  const CASES = [
    {
      id: 'eah', tag: '急性・嚴重症狀', title: '馬拉松終點抽搐：先治療，不等鑑別',
      stem: '34 歲女性，52 kg，完賽全馬後 1 小時嘔吐、頭痛，隨後全身性抽搐。賽中每個補給站都喝水，體重比賽前略增。Na 118，血糖 110，Osm 250，尿 Osm 410，尿 Na 62，尿 K 30。平時健康、無用藥。',
      facts: ['發生 <48 小時', 'Na 118', 'Osm 250', '尿 Osm 410', '尿 Na 62'],
      question: '第一步該等 cortisol、TSH 結果，還是先給藥？給多少？能不能用生理食鹽水代替？',
      base: { ...NONE, age: 34, sex: '女性', weight: 52, onset: '<48 小時', symptomSeverity: '嚴重症狀', symptoms: ['嘔吐', '頭痛', '癲癇'], serumNa: 118, glucose: 110, serumOsm: 250, urineOsm: 410, urineNa: 62, urineK: 30, volumeStatus: '等容積', fluidIntake: ['大量飲水', '耐力運動'], thyroid: '尚未檢查', adrenal: '尚未檢查', monitoring: 'ICU/高頻抽血 q2-4h', initialNote: '完賽全馬後發作' },
      expect: { classify: 'profound', etiology: 'adrenal', tonicity: 'hypo', sevLevel: 2, chronic: false, tbw: 26, d3: 14.6, dns: 1.3, furst: 0.78 },
      read: [
        '抽搐屬 ESE 嚴重症狀，急性發生代表腦水腫風險是眼前問題。工具的病因方向停在「需先排除 adrenal insufficiency」，這是演算法照 SIADH 條件走的結果，不是要你等報告才治療。',
        '情境（耐力賽＋大量飲水＋體重增加）指向運動相關低血鈉：非滲透性 AVP 分泌加上喝水過量，所以尿液並未稀釋。'
      ],
      plan: [
        '立刻給 3% NaCl。ESE：150 mL over 20 分鐘，驗 Na 後重複（約 2 mL/kg ≈ 104 mL）。EAH 共識：100 mL 推注，可再重複 2 次，間隔建議 10 分鐘。兩種都合理，依院內流程，不要因選劑量延誤。',
        '目標是第一小時上升約 5 mmol/L，或症狀改善即停。',
        '排尿恢復前限制低張與等張液體，此時的尿液仍濃縮。',
        '抽血留 cortisol、TSH 不影響給藥。ESE 第一小時處置不分急慢性；急性者工具不設慢性上限，但仍要密集追蹤血鈉。'
      ],
      pitfall: '把運動員的低血鈉當成脫水而灌生理食鹽水。尿 Osm 410 高於輸液的 308，等張液可能反而使血鈉下降。',
      src: ['ese', 'hew', 'us', 'sterns18']
    },
    {
      id: 'siadh', tag: '慢性・等容積', title: '小細胞肺癌的 SIADH：限水預期會失敗',
      stem: '68 歲男性，64 kg，小細胞肺癌化療前發現低血鈉，近 1 週噁心、頭痛。無水腫、無姿勢性低血壓。Na 119，血糖 98，Osm 248，尿 Osm 560，尿 Na 92，尿 K 48。早上 cortisol 與 TSH 正常，腎功能正常，無利尿劑。',
      facts: ['慢性', 'Na 119', '尿 Osm 560', '尿 Na＋K 140', '24 h 尿量 1200 mL'],
      question: '住院醫師開了限水 1 L/day。這張處方有幾成機會成功？下一步要準備什麼？',
      base: { ...NONE, ...OK_ENDO, age: 68, sex: '男性', weight: 64, onset: '>=48 小時', symptomSeverity: '中度症狀', symptoms: ['噁心', '頭痛'], serumNa: 119, glucose: 98, serumOsm: 248, urineOsm: 560, urineNa: 92, urineK: 48, volumeStatus: '等容積', imaging: ['肺癌/惡性腫瘤'] },
      expect: { classify: 'profound', etiology: 'siadh', tonicity: 'hypo', sevLevel: 1, max24: 10, odsHigh: false, tbw: 32, d3: 11.9, dns: 1.1, furst: 1.18 },
      read: [
        'US panel 列的限水失敗預測因子，這位病人符合三項：尿 Osm >500、(尿 Na＋尿 K)/血 Na >1、24 h 尿量 <1500 mL。',
        '尿液陽離子濃度已高於血鈉，排尿不會排出自由水，少喝也難以讓血鈉上升。',
        '中度症狀，ESE 建議可給單次 3% 150 mL，目標 24 小時上升約 5。'
      ],
      plan: [
        '單次 3% 後開始病因治療；化療是根本處置，先與腫瘤科討論時機。',
        '第二線依 ESE：urea 0.25–0.5 g/kg/day（此病人約 16–32 g/day），或低劑量 loop＋口服 NaCl。',
        'Tolvaptan 兩邊立場不同：ESE 反對用於 SIAD（1C），US panel 可用。仿單起始 15 mg，須住院開始，首 24 小時避免限水。',
        '慢性、無 ODS 風險因子：目標 +4–8，首 24 小時上限 10。'
      ],
      pitfall: '以為「第二線都差不多」。EFFUSE-FLUID（n=92）限水加 furosemide、再加 NaCl 3 g/day，第 4 天升幅三組都約 +5，AKI 與低鉀反而較多。ESE 的 loop＋NaCl 建議等級僅 2D，選用時要知道證據有限。',
      src: ['ese', 'us', 'krisanapan', 'garrahy', 'samsca', 'gross']
    },
    {
      id: 'thiazide', tag: '慢性・ODS 高風險', title: 'Thiazide 老婦：12 小時升了 10',
      stem: '79 歲女性，46 kg，高血壓服用 hydrochlorothiazide，近日食慾差、意識混亂，來急診。Na 110，K 2.9，血糖 105，Osm 232，尿 Osm 380，尿 Na 46，尿 K 24。給 3% 150 mL 一次、KCl 補充並停藥。12 小時後 Na 120，尿量明顯變多。',
      facts: ['發生時間不明', 'Na 110 → 120（12 h）', 'K 2.9', '尿 Osm 380', '營養不良'],
      question: '這個速度超過上限了嗎？KCl 算不算升鈉治療？現在該做什麼？',
      base: { ...NONE, ...OK_ENDO, age: 79, sex: '女性', weight: 46, onset: '不明', symptomSeverity: '中度症狀', symptoms: ['混亂'], serumNa: 110, glucose: 105, serumOsm: 232, urineOsm: 380, urineNa: 46, urineK: 24, volumeStatus: '等容積', diuretics: 'thiazide', odsRisk: ['低血鉀', '營養不良'], monitoring: 'ICU/高頻抽血 q2-4h', naFollow: 120, hoursFollow: 12 },
      expect: { classify: 'profound', etiology: 'diuretic-kidney', tonicity: 'hypo', sevLevel: 1, max24: 8, odsHigh: true, tbw: 20.7, d3: 18.6, dns: 2, furst: 0.64, follow: 'over', delta: 10 },
      read: [
        '時間不明一律當慢性。低血鉀與營養不良使她屬 ODS 高風險，上限是任何 24 小時 8 mmol/L；12 小時 +10 已超過。',
        '公式估 150 mL 3% 只會升約 2.8，實際多出來的來自兩處：補鉀與水利尿。補鉀升鈉的程度與補鈉相當（US panel）。停 thiazide 後腎臟稀釋能力恢復，尿量增加正是警訊。',
        '尿 Na >30 但有利尿劑，尿鈉無法判讀，不能下 SIADH 診斷。'
      ],
      plan: [
        '停止一切升鈉治療，KCl 重新計算是否需要繼續及濃度。',
        'ESE 建議與專家討論：不含電解質的水 10 mL/kg over 1 小時（D5W ≈ 460 mL），併 desmopressin 2 µg IV，不短於每 8 小時。US panel 劑量寫 2–4 µg。',
        '監測血糖與 Na，把 Na 拉回 24 小時限制內。回溯性小型研究（Perianayagam n=20，其中 11 人主動 re-lowering）未見嚴重不良反應，但並非對照試驗。',
        '出院前：病歷註記不再使用 thiazide。US panel 建議不要再挑戰。'
      ],
      pitfall: '只盯著 3% 的毫升數而忽略 KCl。也別因為「剛開始用 thiazide 才會出事」而放過長期使用者：多在 2 週內發生，但也有用藥數月至數年才出現。',
      src: ['us', 'ese', 'peria', 'hwang', 'filippone', 'adrogue']
    },
    {
      id: 'cirrhosis', tag: '慢性・高容積', title: '肝硬化腹水 Na 121：不是每個低血鈉都要拉高',
      stem: '58 歲男性，72 kg，酒精性肝硬化 Child-Pugh C，大量腹水與下肢水腫，服 furosemide 與 spironolactone。無意識改變，Na 121，血糖 110，Osm 258，尿 Osm 340，尿 Na 9。',
      facts: ['腹水＋水腫', 'Na 121', '尿 Na 9', '晚期肝病', '無急性神經症狀'],
      question: '家屬問能否打生理食鹽水或開 tolvaptan 把鈉拉高，你怎麼回答？',
      base: { ...NONE, ...OK_ENDO, age: 58, sex: '男性', weight: 72, onset: '>=48 小時', symptomSeverity: '無症狀/輕微', symptoms: ['無'], serumNa: 121, glucose: 110, serumOsm: 258, urineOsm: 340, urineNa: 9, volumeStatus: '高容積/水腫', edemaSigns: ['肝硬化/腹水', '下肢水腫'], diuretics: 'loop', odsRisk: ['晚期肝病'], tolvaptanContra: ['肝病/肝損傷風險'] },
      expect: { classify: 'profound', etiology: 'hypervol', tonicity: 'hypo', sevLevel: 0, max24: 8, odsHigh: true, tbw: 43.2, d3: 8.9, dns: 0.7 },
      read: [
        '低尿鈉＋水腫＝有效動脈血量不足伴細胞外液增加。全身鈉其實過多，低血鈉是水滯留得更多。',
        '晚期肝病本身就是 ODS 高風險因子，即使 Na 121 也要用 8 mmol/L 的上限。'
      ],
      plan: [
        'ESE：輕中度低血鈉不建議只為了升鈉而治療（1C）；可限水（2D）；反對 vaptan（1C）與 demeclocycline（1D）。',
        'Tolvaptan 仿單：避免用於含肝硬化在內的肝病。',
        '檢視利尿劑是否需要調整，並評估感染、腸胃道出血等誘因。白蛋白與利尿劑細節請依肝病科指引，本頁未核對。',
        '工具的高容積提示是通用文字（含 loop diuretic），用在肝硬化前要依腎功能與 Na 判斷，不能照單開立。'
      ],
      pitfall: '看到 Na 121 就開 0.9% NaCl。這只會加重腹水與水腫。',
      src: ['ese', 'us', 'samsca']
    },
    {
      id: 'hypovol', tag: '慢性・低容積', title: '腹瀉四天：補液後尿量暴增',
      stem: '72 歲女性，55 kg，腹瀉 4 天，口乾、姿勢性低血壓。Na 120，血糖 92，BUN 38，Osm 252，尿 Osm 480，尿 Na 14，尿 K 40。給 0.9% NaCl 後 8 小時，尿量升到 250 mL/h，Na 128。',
      facts: ['低容積', 'Na 120 → 128（8 h）', '尿 Na 14', '尿量 250 mL/h', 'BUN 38'],
      question: '公式說 1 L 生理食鹽水只升 1.3，為什麼 8 小時就升了 8？',
      base: { ...NONE, ...OK_ENDO, age: 72, sex: '女性', weight: 55, onset: '>=48 小時', symptomSeverity: '無症狀/輕微', symptoms: ['無'], serumNa: 120, glucose: 92, bun: 38, serumOsm: 252, urineOsm: 480, urineNa: 14, urineK: 40, volumeStatus: '低容積', lossSigns: ['腹瀉'], naFollow: 128, hoursFollow: 8 },
      expect: { classify: 'profound', etiology: 'hypovol', tonicity: 'hypo', sevLevel: 0, max24: 10, odsHigh: false, tbw: 24.8, dns: 1.3, eff: 238, follow: 'near', delta: 8 },
      read: [
        '容積補足後，非滲透性 AVP 刺激消失，腎臟開始排稀釋尿。Adrogué–Madias 不計尿液流失，這時會嚴重低估。',
        '上限 10，還剩 2 mmol/L 的空間，卻還有 16 小時才滿 24 小時，而且尿量仍高。'
      ],
      plan: [
        'ESE：0.9% NaCl 或平衡晶體液 0.5–1 mL/kg/h（此病人約 28–55 mL/h），不是大量推注。',
        '尿量突然增加時立刻加驗 Na、驗尿 Osm。',
        '已接近上限：減停輸液，考慮 desmopressin＋D5W。Sood（n=25，無同期對照）用 DDAVP 1–2 µg q6–8h 的 clamp 策略，但屬小型研究。'
      ],
      pitfall: '把公式當處方。它不含尿量，低容積、停藥、補皮質醇這幾種會突然水利尿的情境最不準。',
      src: ['ese', 'sterns18', 'sood', 'adrogue']
    },
    {
      id: 'beer', tag: '低溶質・ODS 高風險', title: '只喝啤酒的人：Na 108 與稀釋尿',
      stem: '52 歲男性，58 kg，長期酗酒，兩週幾乎只喝啤酒未進食，意識混亂但可對答。Na 108，K 3.0，血糖 80，Osm 226，尿 Osm 72，尿 Na 8。夜間僅有 q6h 的抽血能力。',
      facts: ['Na 108', '尿 Osm 72', '酗酒', '營養不良', '低血鉀'],
      question: '尿 Osm 72 代表 AVP 有分泌嗎？開始進食和補水後會發生什麼事？',
      base: { ...NONE, ...OK_ENDO, age: 52, sex: '男性', weight: 58, onset: '不明', symptomSeverity: '中度症狀', symptoms: ['混亂'], serumNa: 108, glucose: 80, serumOsm: 226, urineOsm: 72, urineNa: 8, volumeStatus: '等容積', fluidIntake: ['啤酒大量攝取', '低蛋白低鹽飲食', '營養不良'], odsRisk: ['低血鉀', '酗酒', '營養不良'] },
      expect: { classify: 'profound', etiology: 'water', tonicity: 'hypo', sevLevel: 1, max24: 8, odsHigh: true, tbw: 34.8, d3: 11.3, dns: 1.3 },
      read: [
        '尿 Osm ≤100 表示腎臟已在最大稀釋：問題是溶質不足，排水量受限於攝取的溶質量，不是 AVP 不當分泌。',
        '只要給溶質（進食、輸液、鉀），尿量立刻增加，所以是過度矯正風險最高的族群之一。'
      ],
      plan: [
        '目標 +4–6，任何 24 小時上限 8。有症狀先考慮單次 3%。',
        '工具提示監測強度不足：這位病人需要可 q2–4h 抽血的單位，應轉出。',
        '補鉀要計入升鈉量。給 thiamine 等酒精戒斷與營養處置；再進食要循序（本頁未涵蓋細節）。',
        '尿量增加或尿 Osm 下降時，考慮 DDAVP 預防或救援。'
      ],
      pitfall: '覺得「他意識還好，慢慢補就好」後放回普通病房。Seethapathy 世代中 CPM 集中在極低血鈉（Na ≤105：1.3%；106–110：1.2%），且 7 例中有 5 例校正未超過 8 mmol/L/24 h；Na 108 加上多重風險，上限不是安全保證。',
      src: ['ese', 'us', 'sanghvi', 'seetha']
    },
    {
      id: 'hhs', tag: '非低張性', title: 'HHS 的 Na 122：這不是低血鈉要治療的對象',
      stem: '74 歲男性，80 kg，第二型糖尿病，感染後嗜睡。Na 122，血糖 900，BUN 56，Osm 330，尿 Osm 520，尿 Na 40。急診有人喊要備 3% NaCl。',
      facts: ['血糖 900', 'Osm 330', 'Na 122', 'BUN 56', '嗜睡'],
      question: '「嗜睡」是嚴重症狀，那要給 3% 嗎？校正鈉到底是多少？',
      base: { ...NONE, ...OK_ENDO, age: 74, sex: '男性', weight: 80, onset: '不明', symptomSeverity: '嚴重症狀', symptoms: ['嗜睡'], serumNa: 122, glucose: 900, bun: 56, serumOsm: 330, urineOsm: 520, urineNa: 40, volumeStatus: '低容積', pseudoRisk: ['高血糖'], lossSigns: ['無'], monitoring: 'ICU/高頻抽血 q2-4h' },
      expect: { classify: 'profound', etiology: 'nonhypo', tonicity: 'hyper', sevLevel: 2, cna: 141.2, eff: 310, tbw: 40 },
      read: [
        '先算張力：Osm 330、有效 Osm ≈ 310，細胞是脫水而非水腫，3% 只會更高張。',
        '校正鈉（Hillier 2.4）= 122 + 2.4 × 8 = 141.2，已不算低。',
        'Hillier 的受試者只有 6 位健康人，血糖 >400 時他們建議係數 4.0；照兩段算（≤400 用 1.6，>400 用 4.0）約 146.8。臨床上把校正鈉當區間看。'
      ],
      plan: [
        '依 HHS 處置：補液、胰島素、找感染（細節不在本頁範圍）。',
        '血糖下降時 Na 應該上升，若 Na 不升反降要重新評估輸液張力。',
        '嗜睡是高滲透壓與感染的表現，不是低血鈉腦水腫。'
      ],
      pitfall: '症狀分級套錯地方。嚴重症狀的 3% 路徑只適用於低張性低血鈉，所以永遠先看張力。',
      src: ['ese', 'hillier']
    },
    {
      id: 'adrenal', tag: '內分泌・假性 SIADH', title: '免疫治療後頭痛：長得像 SIADH 的腎上腺不足',
      stem: '61 歲男性，70 kg，黑色素瘤接受 ipilimumab＋nivolumab 第 3 次後，頭痛、噁心、疲倦。BP 92/58，無水腫。Na 116，K 4.2，血糖 68，Osm 240，尿 Osm 420，尿 Na 55，尿 K 25。尚未驗 cortisol；TSH 低、free T4 偏低但無黏液水腫表現。',
      facts: ['Na 116', '血糖 68', 'BP 92/58', 'K 4.2', '尿 Na 55'],
      question: '數據完全符合 SIADH。還缺哪一項才可以下診斷？補了類固醇後要注意什麼？',
      base: { ...NONE, age: 61, sex: '男性', weight: 70, onset: '不明', symptomSeverity: '中度症狀', symptoms: ['噁心', '頭痛'], serumNa: 116, glucose: 68, serumOsm: 240, urineOsm: 420, urineNa: 55, urineK: 25, volumeStatus: '等容積', thyroid: '已排除嚴重低下', adrenal: '疑似/確認 adrenal insufficiency', medications: ['其他'], monitoring: 'ICU/高頻抽血 q2-4h', supportLabs: 'TSH 低、free T4 偏低；cortisol/ACTH 待驗' },
      expect: { classify: 'profound', etiology: 'adrenal', tonicity: 'hypo', sevLevel: 1, max24: 10, odsHigh: false, tbw: 42, d3: 9.2, dns: 0.9, furst: 0.69 },
      read: [
        'SIADH 是排除性診斷。低血糖、低血壓、頭痛加上免疫檢查點抑制劑，要先想到腦下垂體炎造成的次發性腎上腺不足。',
        'K 4.2 未升高：次發性不足不缺 mineralocorticoid，所以外觀是等容積，與原發性的低容積、高血鉀不同。',
        '皮質醇不足時 AVP 分泌增加，補類固醇後這個機轉解除，水排除能力恢復（Martin-Grace 2022、Perianayagam 2008）。'
      ],
      plan: [
        '抽 cortisol／ACTH 後不等報告，先給 hydrocortisone（血壓低、低血糖，不能等）。',
        'TSH 低、free T4 偏低要想到中樞性甲狀腺低下：先補皮質醇，再補甲狀腺素。',
        '補類固醇後密集驗 Na、記尿量，可能出現水利尿；若接近上限照過度校正處理。',
        '會診內分泌與腫瘤科處理 irAE。'
      ],
      pitfall: '只驗 TSH 就寫 SIADH 並開限水。在腎上腺不足的低血壓病人身上限水很危險。',
      src: ['ese', 'grace', 'peria', 'us']
    }
  ];

  // answer 為 0–3；calc 由 tests.cjs 用引擎重算核對
  const QUIZ = [
    { level: '基礎', stem: '依 ESE 2014，下列哪一個症狀屬於「嚴重」而非「中度」？', options: ['噁心但沒有嘔吐', '嘔吐', '頭痛', '意識混亂'], answer: 1, why: '嚴重：嘔吐、心肺窘迫、異常且深度嗜睡、癲癇、昏迷（GCS ≤8）。中度：噁心未嘔吐、混亂、頭痛。', src: ['ese'] },
    { level: '基礎', stem: '低張性低血鈉，尿 Osm 75 mOsm/kg，最合理的方向是？', options: ['相對水分過多或溶質攝取不足', 'SIADH', 'Thiazide 相關低血鈉', '腎上腺功能不足'], answer: 0, why: '尿 Osm ≤100 代表腎臟有在最大稀釋，AVP 不是主因：原發性多喝水、低溶質攝取、beer potomania。', src: ['ese'] },
    { level: '基礎', stem: '肝硬化腹水、下肢水腫，尿 Na 9 mmol/L，尿 Osm 340。如何分類？', options: ['低容積且腎性失鈉', 'SIADH', '尿 Osm 不足以判讀，需先做等張輸液試驗', '有效動脈血量不足的高容積低血鈉'], answer: 3, why: '尿 Na ≤30＋細胞外液增加：HF、肝硬化、腎病症候群。這裡不適合輸液試驗。', src: ['ese'] },
    { level: '基礎', stem: '慢性低血鈉病人突發癲癇，ESE 的第一線處置是？', options: ['立即限水並驗尿 Osm', '0.9% NaCl 1 L 快速輸注', '3% NaCl 150 mL over 20 分鐘，驗 Na 後可重複', 'Tolvaptan 15 mg 口服'], answer: 2, why: '不論急慢性，嚴重症狀都先推 3%；目標第一小時升 5 mmol/L。US panel 版本是 100 mL over 10 分鐘，最多 3 次。', src: ['ese', 'us'] },
    { level: '基礎', stem: 'Na 124、血糖 700 mg/dL，用 Hillier 係數 2.4 算校正鈉，約為？', options: ['126.4', '133.6', '138.4', '145.2'], answer: 2, calc: { fn: 'correctedNa', input: { serumNa: 124, glucose: 700 }, value: 138.4 }, why: '124 + 2.4 × (700 − 100)/100 = 138.4。', src: ['hillier', 'ese'] },
    { level: '基礎', stem: '多發性骨髓瘤病人 Na 126，實測 Osm 286，血糖正常、BUN 正常。下一步？', options: ['以直接離子電極（血氣機）重驗鈉', '3% NaCl 100 mL 推注', '先限水 1 L/day', '驗尿 Na 後開始 urea'], answer: 0, why: '滲透壓正常要懷疑偽性低血鈉：高蛋白使間接 ISE 的稀釋樣本低估，直接電位法不受影響。不需治療血鈉本身。', src: ['ese'] },
    { level: '基礎', stem: '中度 SIADH，已排除腎上腺與甲狀腺問題，ESE 的第一線是？', options: ['Demeclocycline', 'Tolvaptan', '0.9% NaCl', '限水'], answer: 3, why: 'ESE：限水為第一線（2D）；urea 或低劑量 loop＋NaCl 為第二線。ESE 反對 lithium 與 demeclocycline（1D），vaptan 也不建議（1C）。', src: ['ese', 'garrahy'] },
    { level: '基礎', stem: 'ESE 對慢性低血鈉校正速率的上限是？', options: ['首 24 小時 6，之後每 24 小時 6', '首 24 小時 10，之後每 24 小時 8，直到 130', '首 24 小時 12，48 小時 24', '不設上限，以症狀為準'], answer: 1, why: 'ESE：10／8。US panel：一般風險 10–12（48 小時 18），高風險任何 24 小時 8。', src: ['ese', 'us'] },
    { level: '基礎', stem: '符合等容積、尿 Osm >100、尿 Na >30。要下 SIADH 診斷前，還必須排除什麼？', options: ['高血壓與高血脂', '貧血與低白蛋白', '腎上腺不足、嚴重甲狀腺低下、腎病、近期利尿劑', '肝炎與血小板低下'], answer: 2, why: 'SIADH 是排除性診斷。次發性腎上腺不足外觀最像 SIADH，見示範病例 8。', src: ['ese', 'grace'] },
    { level: '基礎', stem: '下列何者不是 US panel 列出的 ODS 高風險因子？', options: ['Na ≤105', '低血鉀', '酗酒', '年齡 ≥65 歲'], answer: 3, why: '高風險：Na ≤105、低血鉀、酗酒、營養不良、晚期肝病。年齡不在列表內。', src: ['us'] },

    { level: '高階', stem: 'SIADH 病人 Na 120，尿 Na 110、尿 K 50、尿 Osm 610、24 h 尿量 1100 mL。對限水 1 L/day 的判斷？', options: ['Ratio 1.33，多項失敗預測因子成立，應準備第二線', 'Ratio 0.42，限水應有效', 'Ratio 0.92，應改限水 1.5 L/day', 'Ratio 1.33，應改用 0.9% NaCl'], answer: 0, calc: { fn: 'furst', input: { urineNa: 110, urineK: 50, serumNa: 120 }, value: 1.33 }, why: '(110 + 50)/120 = 1.33。US panel 的失敗預測因子：尿 Osm >500、比值 >1、尿量 <1500 mL/day、限水 24–48 小時 Na 升 <2。0.5–1 的分層來自二手文獻，Furst 原文未讀。', src: ['us', 'gross'] },
    { level: '高階', stem: '46 kg 女性，低血鉀合併營養不良，Na 110，12 小時後 Na 120 且尿量大增。合適處置？', options: ['再觀察，因為未滿 24 小時，尚未超過上限', '補 0.9% NaCl 維持尿量', '停升鈉治療；與專家討論 D5W 約 460 mL over 1 h＋desmopressin 2 µg IV', '給 furosemide 促進排水'], answer: 2, calc: { fn: 'followUpStatus', input: { serumNa: 110, odsRisk: ['低血鉀', '營養不良'], onset: '不明', naFollow: 120, hoursFollow: 12 }, value: 'over' }, why: '高風險上限是「任何 24 小時 8」，12 小時 +10 已超過。ESE：水 10 mL/kg over 1 h、DDAVP 2 µg 不短於 q8h；US panel 寫 2–4 µg。證據是小型回溯研究。', src: ['ese', 'us', 'peria'] },
    { level: '高階', stem: '透析前病人 Na 124，實測 Osm 292，BUN 112 mg/dL，血糖正常。張力如何判讀？', options: ['等張：偽性低血鈉', '低張：有效 Osm 約 252', '高張：滲透物造成移水', '無法判斷，需先透析'], answer: 1, calc: { fn: 'effectiveOsm', input: { serumOsm: 292, bun: 112 }, value: 252 }, why: '尿素可自由穿膜，不造成張力。有效 Osm = 292 − 112/2.8 = 252，仍是低張。', src: ['ese'] },
    { level: '高階', stem: '60 kg、70 歲女性（TBW 27 L），Na 120。用 Adrogué–Madias 估 150 mL 3% NaCl 的升幅，約為？', options: ['0.2', '0.8', '5.0', '2.1'], answer: 3, calc: { fn: 'adrogue513', input: { serumNa: 120, weight: 60, sex: '女性', age: 70 }, value: 14 }, why: '(513 − 120)/(27 + 1) = 14 per L，×0.15 L ≈ 2.1。公式不計尿量與補鉀，水利尿時會嚴重低估。', src: ['adrogue', 'sterns18'] },
    { level: '高階', stem: 'SIADH 尿 Osm 固定 600 mOsm/kg，輸 1 L 0.9% NaCl（308 mOsm）。溶質完全排出時，水的去向？', options: ['全部 1 L 水隨尿排出，Na 不變', '約 0.5 L 隨尿排出，約 0.5 L 水留在體內，Na 下降', '水全留體內，Na 上升', '約 2 L 水隨尿排出，Na 上升'], answer: 1, why: '308 ÷ 600 ≈ 0.51 L 尿就能把溶質排完，剩約 0.49 L 自由水留下，這就是 desalination。所以尿 Osm 高於 308 時生理食鹽水可能讓血鈉更低。', src: ['sterns18'] },
    { level: '高階', stem: '關於 tolvaptan，下列何者符合美國仿單？', options: ['起始 15 mg，須住院開始，首 24 小時避免限水，使用不超過 30 天', '起始 7.5 mg 是仿單建議劑量', '肝硬化低血鈉是首選適應症', '低容積性低血鈉可使用'], answer: 0, why: '7.5 mg 不在仿單內，屬 off-label；統合分析中 7.5 mg 仍有約 31% 升幅 ≥10。禁忌：無法感覺或反應口渴、低容積、強 CYP3A 抑制劑、無尿。避免用於含肝硬化在內的肝病。', src: ['samsca', 'morris', 'lewellyn'] },
    { level: '高階', stem: 'SALSA 試驗（Na ≤125，n=178）比較 3% 間歇推注與緩慢連續輸注，結果為何？', options: ['推注組 ODS 發生率明顯較高', '連續輸注組過度矯正明顯較少', '主要終點（過度矯正）無顯著差異，但推注組需要 re-lowering 較少', '兩組死亡率差 10% 以上'], answer: 2, why: '過度矯正 17.2% vs 24.2%（P=.26）；re-lowering 41.4% vs 57.1%（P=.04）；兩組 ODS 皆 0。主要終點是陰性的，不要說成「推注較不易過度矯正」。', src: ['salsa'] },
    { level: '高階', stem: '服 thiazide 的低血鈉病人，尿 Na 不可靠。尿酸分率排泄 FE-urate 14%，如何解讀？', options: ['排除 SIADH', '必為低容積', '只有在停藥 2 週後才有意義', '支持 SIADH，且在用利尿劑者仍有參考價值'], answer: 3, why: 'Fenske 2008（n=86，57 人用利尿劑）：cutoff 12%，AUC 0.96，PPV 100%。屬單一研究，僅讀摘要，cutoff 請與臨床一起判斷。', src: ['fenske'] },
    { level: '高階', stem: 'Seethapathy 2023（n=3274，Na <120）及 Ayus 2025 統合分析都顯示校正較快者死亡率較低。正確解讀是？', options: ['可取消速率上限', '屬觀察性資料，有干擾且無法區分慢性；不足以推翻現行上限，但支持不必為了求慢而過度保守', '已證明快速校正降低死亡', '已證明 ODS 不存在'], answer: 1, why: 'Ayus 16 個世代中 11 個偏誤風險嚴重；Seethapathy 作者明言僅是相關。Sterns 2024（評論另一篇大型世代）主張維持上限：Na ≤120 不超過 10／24 h、18／48 h，高風險 8。這是仍在進行中的爭論。', src: ['seetha', 'ayus', 'sterns24'] },
    { level: '高階', stem: 'SAH 第 6 天 Na 124，體重下降、CVP 低、尿量多，尿 Na 90、尿 Osm 480。最不應該做的是？', options: ['限水', '0.9% NaCl 補充容積', '追蹤尿量與體重，鑑別 CSW 與 SIADH', '做 FE-urate 當輔助'], answer: 0, calc: { fn: 'etiologyKey', input: { serumNa: 124, serumOsm: 258, urineOsm: 480, urineNa: 90, volumeStatus: '低容積', kidneyFunction: '正常/接近正常', diuretics: '無', thyroid: '已排除嚴重低下', adrenal: '已排除 adrenal insufficiency' }, value: 'hypovol-renal' }, why: '有低容積證據時限水會加重腦血流不足。CSW 與 SIADH 的鑑別仍有爭議（Maesaka 主張矯正後 FE-urate 持續 >11% 支持腎性失鹽）。', src: ['ese', 'maesaka'] }
  ];

  const MAP = {
    center: ['低血鈉', 'Na <135 mEq/L'],
    branches: [
      { title: '確認與分級', color: '#127b7b', leaves: ['輕度 130–134', '中度 125–129', '重度 <125', '急性 <48 h；不明視為慢性', '中度症狀：噁心、頭痛、混亂', '嚴重：嘔吐、抽搐、昏迷、心肺窘迫、深度嗜睡'] },
      { title: '先看張力', color: '#315f9e', leaves: ['Osm <275：低張，往下走', 'Osm 275–295：偽性、等張沖洗液（TURP）', 'Osm >295：高血糖、mannitol', '校正鈉 = Na + 2.4 × (血糖−100)/100', '有效 Osm = Osm − BUN/2.8', '非低張不給 3%'] },
      { title: '尿液兩問', color: '#7a5ea8', leaves: ['尿 Osm ≤100：多喝水、低溶質、啤酒', '尿 Osm >100：AVP 有作用', '尿 Na ≤30：有效血量不足', '尿 Na >30：先問利尿劑與腎病', '同時採血尿、輸液前採'] },
      { title: '容積與病因', color: '#3f7652', leaves: ['低容積＋尿 Na ≤30：腹瀉、第三空間', '低容積＋尿 Na >30：嘔吐、原發腎上腺不足、CSW', '高容積：HF、肝硬化、腎病症候群', '等容積：SIADH、次發腎上腺不足、甲狀腺低下', 'SIADH 需先排除 cortisol、TSH、腎、利尿劑'] },
      { title: '依症狀處置', color: '#b44a3e', leaves: ['嚴重：3% 150 mL/20 min，可重複 2 次', '目標第一小時 +5 或症狀改善', 'US panel：100 mL/10 min ×3', '中度：單次 3% 150 mL，24 h +5', '無症狀：找病因，不急著給 3%'] },
      { title: '依病因治療', color: '#a86a1f', leaves: ['低容積：0.9%／平衡液 0.5–1 mL/kg/h', '高容積：限水；ESE 反對 vaptan', 'SIADH：限水 → urea 0.25–0.5 g/kg/d 或 loop＋NaCl', '限水失敗預測：尿 Osm >500、比值 >1、尿量 <1.5 L', '腎上腺不足：先補 hydrocortisone', 'Tolvaptan：仿單 15 mg、住院開始、肝硬化避免'] },
      { title: '速率與 ODS', color: '#0b5556', leaves: ['一般：目標 +4–8；ESE 首 24 h 上限 10，之後 8', 'US panel 一般風險 10–12／24 h，18／48 h', '高風險：目標 +4–6，任何 24 h 上限 8', '高風險：Na ≤105、低鉀、酗酒、營養不良、晚期肝病', '補鉀也算升鈉', '公式不計尿量，會低估'] },
      { title: '過度校正', color: '#8c3a52', leaves: ['警訊：尿量突增、尿 Osm 下降', '高危：低容積補足、停 thiazide、補皮質醇、低溶質', '停止升鈉治療', 'D5W 10 mL/kg over 1 h', 'Desmopressin 2 µg IV，不短於 q8h', '預防策略：DDAVP clamp（小型研究）'] }
    ]
  };

  const content = { SOURCES, CASES, QUIZ, MAP };
  if (typeof module !== 'undefined') module.exports = content;
  else window.HNTeach = content;
})();
