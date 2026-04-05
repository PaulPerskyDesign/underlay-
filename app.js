const baselineTogEl = document.getElementById('baselineTog');
const baselineSoftEl = document.getElementById('baselineSoft');
const targetTogEl = document.getElementById('targetTog');
const targetSoftEl = document.getElementById('targetSoft');
const resultsEl = document.getElementById('results');
const evaluateBtn = document.getElementById('evaluateBtn');

const coreEl = document.getElementById('core');
const latticeEl = document.getElementById('lattice');
const densityEl = document.getElementById('density');
const densityValueEl = document.getElementById('densityValue');
const recommendBtn = document.getElementById('recommendBtn');
const recommendationEl = document.getElementById('recommendation');

function pctDrop(from, to) {
  return ((from - to) / from) * 100;
}

function pctGain(from, to) {
  return ((to - from) / from) * 100;
}

function evaluateConcept() {
  const baselineTog = Number(baselineTogEl.value);
  const baselineSoft = Number(baselineSoftEl.value);
  const targetTog = Number(targetTogEl.value);
  const targetSoft = Number(targetSoftEl.value);

  if ([baselineTog, baselineSoft, targetTog, targetSoft].some((n) => !Number.isFinite(n) || n <= 0)) {
    resultsEl.textContent = 'Please enter valid positive values for all metrics.';
    resultsEl.className = 'results bad';
    return;
  }

  const togImprovement = pctDrop(baselineTog, targetTog);
  const softImprovement = pctGain(baselineSoft, targetSoft);

  const meetsBar = togImprovement >= 30 && softImprovement >= 12;

  resultsEl.innerHTML = `Tog reduction: <strong>${togImprovement.toFixed(1)}%</strong>\nSoftness increase: <strong>${softImprovement.toFixed(1)}%</strong>\n\n${
    meetsBar
      ? '<span class="good">Pass: concept is significantly better on both axes.</span>'
      : '<span class="bad">Needs work: increase softness and/or lower tog further.</span>'
  }`;
  resultsEl.className = `results ${meetsBar ? 'good' : 'bad'}`;
}

function generateRecommendation() {
  const density = Number(densityEl.value);
  const core = coreEl.value;
  const lattice = latticeEl.value;

  let risk = 'Medium';
  if (density < 45) risk = 'High';
  if (density >= 45 && density <= 65 && core.includes('aerogel') && lattice.includes('Graded')) risk = 'Low';

  recommendationEl.textContent = [
    `Recommended Concept Build`,
    `- Core: ${core}`,
    `- Comfort architecture: ${lattice}`,
    `- Density target: ${density} kg/m³`,
    `- Estimated development risk: ${risk}`,
    '',
    `Next action: produce prototype coupons and run thermal + indentation testing.`
  ].join('\n');
}

densityEl.addEventListener('input', () => {
  densityValueEl.textContent = densityEl.value;
});

evaluateBtn.addEventListener('click', evaluateConcept);
recommendBtn.addEventListener('click', generateRecommendation);

evaluateConcept();
generateRecommendation();
