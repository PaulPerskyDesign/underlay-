const baselineTogEl = document.getElementById('baselineTog');
const targetTogEl = document.getElementById('targetTog');
const baselineSoftEl = document.getElementById('baselineSoft');
const targetSoftEl = document.getElementById('targetSoft');
const validationMsgEl = document.getElementById('validationMsg');

const segmentFlexEl = document.getElementById('segmentFlex');
const crosslinkDensityEl = document.getElementById('crosslinkDensity');
const phononScatterEl = document.getElementById('phononScatter');
const interfacialSlipEl = document.getElementById('interfacialSlip');
const poreAnisotropyEl = document.getElementById('poreAnisotropy');
const aiBudgetEl = document.getElementById('aiBudget');

const segmentFlexValEl = document.getElementById('segmentFlexVal');
const crosslinkValEl = document.getElementById('crosslinkVal');
const phononValEl = document.getElementById('phononVal');
const slipValEl = document.getElementById('slipVal');
const poreValEl = document.getElementById('poreVal');

const runAiBtn = document.getElementById('runAiBtn');
const loadPresetBtn = document.getElementById('loadPresetBtn');
const engineLogEl = document.getElementById('engineLog');
const outcomeEl = document.getElementById('outcome');
const stackPlanEl = document.getElementById('stackPlan');
const historyEl = document.getElementById('history');

const runIdEl = document.getElementById('runId');
const goalMatchEl = document.getElementById('goalMatch');
const confidenceEl = document.getElementById('confidence');
const riskEl = document.getElementById('risk');
const progressBarEl = document.getElementById('progressBar');
const progressLabelEl = document.getElementById('progressLabel');

const runHistory = [];

function bindLiveValue(inputEl, displayEl) {
  const sync = () => {
    displayEl.textContent = inputEl.value;
  };
  inputEl.addEventListener('input', sync);
  sync();
}

bindLiveValue(segmentFlexEl, segmentFlexValEl);
bindLiveValue(crosslinkDensityEl, crosslinkValEl);
bindLiveValue(phononScatterEl, phononValEl);
bindLiveValue(interfacialSlipEl, slipValEl);
bindLiveValue(poreAnisotropyEl, poreValEl);

function pctDrop(from, to) {
  return ((from - to) / from) * 100;
}

function pctGain(from, to) {
  return ((to - from) / from) * 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function validateTargets(target) {
  const values = Object.values(target);
  if (values.some((n) => !Number.isFinite(n) || n <= 0)) {
    return 'All target values must be positive numbers.';
  }
  if (target.targetTog >= target.baselineTog) {
    return 'Target tog must be lower than baseline tog.';
  }
  if (target.targetSoft <= target.baselineSoft) {
    return 'Target softness must be higher than baseline softness.';
  }
  return '';
}

function computeCandidateScore(settings, target) {
  const softnessPotential =
    0.34 * settings.segmentFlex +
    0.23 * settings.interfacialSlip +
    0.18 * (100 - settings.crosslinkDensity) +
    0.12 * settings.poreAnisotropy +
    0.13 * settings.phononScatter;

  const thermalPotential =
    0.36 * settings.phononScatter +
    0.24 * settings.poreAnisotropy +
    0.2 * (100 - settings.crosslinkDensity) +
    0.2 * settings.interfacialSlip;

  const predictedTog = clamp(target.baselineTog - thermalPotential / 120, 0.4, target.baselineTog);
  const predictedSoft = clamp(target.baselineSoft + softnessPotential / 4.4, 50, 98);

  const togReduction = pctDrop(target.baselineTog, predictedTog);
  const softIncrease = pctGain(target.baselineSoft, predictedSoft);

  const objectiveDistance =
    Math.abs(predictedTog - target.targetTog) * 50 +
    Math.abs(predictedSoft - target.targetSoft) * 1.6;

  const significantUpliftBonus = togReduction >= 35 && softIncrease >= 15 ? 18 : 0;
  const score = 100 - objectiveDistance + significantUpliftBonus;

  return {
    predictedTog,
    predictedSoft,
    togReduction,
    softIncrease,
    score
  };
}

function mutate(settings) {
  const next = { ...settings };
  Object.keys(next).forEach((key) => {
    const delta = (Math.random() - 0.5) * 18;
    next[key] = clamp(next[key] + delta, 0, 100);
  });
  return next;
}

function runId() {
  return `RUN-${Date.now().toString().slice(-6)}`;
}

function updateHistory(entry) {
  runHistory.unshift(entry);
  const preview = runHistory.slice(0, 6).map((r) => {
    return `${r.id} | ${r.time}\n  tog ${r.tog.toFixed(2)} (${r.togDrop.toFixed(1)}%) | soft ${r.soft.toFixed(1)} (${r.softGain.toFixed(1)}%) | ${r.verdict}`;
  });
  historyEl.textContent = preview.join('\n\n');
}

function setDashboard(metrics) {
  runIdEl.textContent = metrics.id;
  goalMatchEl.textContent = `${metrics.goalMatch.toFixed(1)}%`;
  confidenceEl.textContent = `${metrics.confidence.toFixed(1)}%`;
  riskEl.textContent = metrics.risk;
}

function simulateProgress(generations) {
  let step = 0;
  progressBarEl.value = 0;
  progressLabelEl.textContent = 'Initializing surrogate model...';
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      step += 1;
      const pct = Math.min((step / generations) * 100, 100);
      progressBarEl.value = pct;
      progressLabelEl.textContent = `Generation ${step}/${generations}`;
      if (step >= generations) {
        clearInterval(timer);
        progressLabelEl.textContent = 'Optimization complete';
        resolve();
      }
    }, 25);
  });
}

async function runAiLoop() {
  const target = {
    baselineTog: Number(baselineTogEl.value),
    targetTog: Number(targetTogEl.value),
    baselineSoft: Number(baselineSoftEl.value),
    targetSoft: Number(targetSoftEl.value)
  };

  const validationError = validateTargets(target);
  validationMsgEl.textContent = validationError;
  if (validationError) {
    engineLogEl.textContent = `Validation failed: ${validationError}`;
    return;
  }

  const generations = clamp(Number(aiBudgetEl.value), 5, 80);
  runAiBtn.disabled = true;

  await simulateProgress(generations);

  let candidate = {
    segmentFlex: Number(segmentFlexEl.value),
    crosslinkDensity: Number(crosslinkDensityEl.value),
    phononScatter: Number(phononScatterEl.value),
    interfacialSlip: Number(interfacialSlipEl.value),
    poreAnisotropy: Number(poreAnisotropyEl.value)
  };

  let best = {
    settings: { ...candidate },
    ...computeCandidateScore(candidate, target)
  };

  const logs = [
    'AI pipeline started: surrogate model + multi-objective optimizer',
    `Goal: Tog ${target.baselineTog} → ${target.targetTog}, Softness ${target.baselineSoft} → ${target.targetSoft}`,
    `Exploring ${generations} generations over atom-level chemistry and microstructure controls...`
  ];

  for (let i = 1; i <= generations; i += 1) {
    candidate = mutate(best.settings);
    const scored = computeCandidateScore(candidate, target);

    if (scored.score > best.score) {
      best = { settings: { ...candidate }, ...scored };
      logs.push(
        `Gen ${i}: better frontier point | score ${best.score.toFixed(2)} | tog ${best.predictedTog.toFixed(2)} | soft ${best.predictedSoft.toFixed(1)}`
      );
    } else if (i % 6 === 0) {
      logs.push(`Gen ${i}: explored alternatives; retained current best candidate.`);
    }
  }

  const significantBoth = best.togReduction >= 35 && best.softIncrease >= 15;
  const goalGap = Math.abs(best.predictedTog - target.targetTog) + Math.abs(best.predictedSoft - target.targetSoft) / 100;
  const goalMatch = clamp(100 - goalGap * 65, 0, 100);
  const confidence = clamp(55 + generations * 0.55 - goalGap * 20, 20, 98);
  const risk = significantBoth ? 'Low' : goalMatch > 70 ? 'Medium' : 'High';

  const id = runId();
  setDashboard({ id, goalMatch, confidence, risk });

  logs.push('Optimization complete. Synthesizing atom-level formulation window and stack recommendation...');
  engineLogEl.textContent = logs.join('\n');

  outcomeEl.innerHTML = [
    `<strong>Predicted tog:</strong> ${best.predictedTog.toFixed(2)} (${best.togReduction.toFixed(1)}% reduction)`,
    `<strong>Predicted softness:</strong> ${best.predictedSoft.toFixed(1)} (${best.softIncrease.toFixed(1)}% increase)`,
    `<strong>Outcome quality:</strong> ${significantBoth ? 'Significant uplift achieved on both axes.' : 'Partial uplift; run another iteration.'}`,
    `<strong>What the AI did:</strong> Generated and scored chemistry/structure candidates, optimized for Pareto balance, and selected best-fit settings against your explicit targets.`,
    `<strong>Expected decision:</strong> ${significantBoth ? 'Proceed to pilot roll.' : 'Continue lab optimization before pilot.'}`
  ].join('<br>');

  stackPlanEl.textContent = [
    'Recommended material stack (AI-proposed):',
    '',
    'Layer 1 (0.4-0.6 mm): Soft skin with low-Tg copolymer segments',
    `  - Segment flexibility index: ${best.settings.segmentFlex.toFixed(0)}`,
    '',
    'Layer 2 (6.5-8.0 mm): Open-cell aerogel-like elastomeric core',
    `  - Crosslink density index: ${best.settings.crosslinkDensity.toFixed(0)}`,
    `  - Pore anisotropy index: ${best.settings.poreAnisotropy.toFixed(0)}`,
    '',
    'Layer 3 (0.4-0.8 mm): Interphase decoupling film',
    `  - Interfacial slip index: ${best.settings.interfacialSlip.toFixed(0)}`,
    '',
    'Layer 4 (0.2-0.4 mm): Thermally disruptive nano-filler scrim',
    `  - Phonon-scattering filler index: ${best.settings.phononScatter.toFixed(0)}`,
    '',
    `Predicted outcome: tog ${best.predictedTog.toFixed(2)} | softness ${best.predictedSoft.toFixed(1)} | risk ${risk}`
  ].join('\n');

  updateHistory({
    id,
    time: new Date().toLocaleTimeString(),
    tog: best.predictedTog,
    togDrop: best.togReduction,
    soft: best.predictedSoft,
    softGain: best.softIncrease,
    verdict: significantBoth ? 'Pilot-ready' : 'Needs another cycle'
  });

  runAiBtn.disabled = false;
}

function loadAggressivePreset() {
  segmentFlexEl.value = '82';
  crosslinkDensityEl.value = '34';
  phononScatterEl.value = '74';
  interfacialSlipEl.value = '73';
  poreAnisotropyEl.value = '61';
  aiBudgetEl.value = '36';

  segmentFlexValEl.textContent = segmentFlexEl.value;
  crosslinkValEl.textContent = crosslinkDensityEl.value;
  phononValEl.textContent = phononScatterEl.value;
  slipValEl.textContent = interfacialSlipEl.value;
  poreValEl.textContent = poreAnisotropyEl.value;
}

runAiBtn.addEventListener('click', runAiLoop);
loadPresetBtn.addEventListener('click', () => {
  loadAggressivePreset();
  runAiLoop();
});

runAiLoop();
