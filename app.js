const baselineTogEl = document.getElementById('baselineTog');
const targetTogEl = document.getElementById('targetTog');
const baselineSoftEl = document.getElementById('baselineSoft');
const targetSoftEl = document.getElementById('targetSoft');

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
const engineLogEl = document.getElementById('engineLog');
const outcomeEl = document.getElementById('outcome');
const stackPlanEl = document.getElementById('stackPlan');

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
  const keys = Object.keys(next);
  keys.forEach((key) => {
    const delta = (Math.random() - 0.5) * 18;
    next[key] = clamp(next[key] + delta, 0, 100);
  });
  return next;
}

function runAiLoop() {
  const target = {
    baselineTog: Number(baselineTogEl.value),
    targetTog: Number(targetTogEl.value),
    baselineSoft: Number(baselineSoftEl.value),
    targetSoft: Number(targetSoftEl.value)
  };

  if (Object.values(target).some((n) => !Number.isFinite(n) || n <= 0)) {
    engineLogEl.textContent = 'Invalid target values. Please enter positive numbers.';
    return;
  }

  const generations = clamp(Number(aiBudgetEl.value), 5, 80);

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
    `Running ${generations} generations of candidate chemistry/structure exploration...`
  ];

  for (let i = 1; i <= generations; i += 1) {
    candidate = mutate(best.settings);
    const scored = computeCandidateScore(candidate, target);

    if (scored.score > best.score) {
      best = { settings: { ...candidate }, ...scored };
      logs.push(
        `Gen ${i}: improved composite score ${best.score.toFixed(2)} | tog ${best.predictedTog.toFixed(2)} | softness ${best.predictedSoft.toFixed(1)}`
      );
    } else if (i % 6 === 0) {
      logs.push(`Gen ${i}: explored alternatives; no better frontier point found.`);
    }
  }

  const significantBoth = best.togReduction >= 35 && best.softIncrease >= 15;

  logs.push('Optimization complete. Synthesizing recommended atom-level formulation window...');
  engineLogEl.textContent = logs.join('\n');

  outcomeEl.innerHTML = [
    `<strong>Predicted tog:</strong> ${best.predictedTog.toFixed(2)} (${best.togReduction.toFixed(1)}% reduction)`,
    `<strong>Predicted softness:</strong> ${best.predictedSoft.toFixed(1)} (${best.softIncrease.toFixed(1)}% increase)`,
    `<strong>Outcome quality:</strong> ${significantBoth ? 'Significant uplift achieved on both axes.' : 'Partial uplift; requires additional iterations.'}`,
    `<strong>What the AI did:</strong> It searched chemistry-structure combinations, estimated thermal/mechanical behavior with a surrogate model, and selected the best Pareto-balanced candidate.`
  ].join('<br>');

  stackPlanEl.textContent = [
    'Recommended material stack (AI-proposed):',
    '',
    'Layer 1 (0.4-0.6 mm): Soft skin with low glass-transition copolymer segments',
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
    'Expected outcome in pilot testing:',
    `  - Tog around ${best.predictedTog.toFixed(2)}`,
    `  - Softness around ${best.predictedSoft.toFixed(1)}`,
    `  - Decision: ${significantBoth ? 'Proceed to pilot roll.' : 'Run another design cycle before pilot.'}`
  ].join('\n');
}

runAiBtn.addEventListener('click', runAiLoop);
runAiLoop();
