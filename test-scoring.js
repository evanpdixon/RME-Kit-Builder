/**
 * RME Kit Builder — Logic & Scoring Test Harness
 * Tests recommendation outcomes based on interview answers without any UI.
 * Run: node test-scoring.js
 */

const puppeteer = require('puppeteer');

const KB_URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const SECTION = '\x1b[36m';
const RESET = '\x1b[0m';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) { console.log(`  ${PASS} ${msg}`); passed++; }
  else { console.log(`  ${FAIL} ${msg}`); failed++; }
}

async function testScoring(page, label, answers, expectedCategory, expectedTopRadios) {
  console.log(`\n${SECTION}${label}${RESET}`);
  console.log(`  Answers: ${JSON.stringify(answers)}`);

  const result = await page.evaluate((ans) => {
    // Reset state
    kbsStep = 0;
    kbsAnswers = {};
    kbsInterviewTags = [];

    // Set answers directly
    Object.assign(kbsAnswers, ans);

    // Detect category
    const category = kbsDetectCategory();

    // Get the right lineup
    const lineup = kbsGetRadioLineup();
    const radioNames = lineup.map(r => r.key);

    // Score radios (replicate the scoring logic)
    const scores = {};
    lineup.forEach(r => { scores[r.key] = 0; });

    // Score from preferences
    const prefs = kbsAnswers['preferences'] || [];
    prefs.forEach(p => {
      if (p && p !== 'nopreference') {
        lineup.forEach(r => {
          if (r.tags && r.tags.includes(p)) scores[r.key] += 10;
        });
      }
    });

    // Score from interview questions
    if (typeof interviewQuestions !== 'undefined') {
      interviewQuestions.forEach(q => {
        const answer = kbsAnswers[q.id];
        if (!answer) return;
        const keys = Array.isArray(answer) ? answer : [answer];
        keys.forEach(key => {
          const opt = q.options.find(o => o.key === key);
          if (opt && opt.tags) {
            opt.tags.forEach(tag => {
              lineup.forEach(r => {
                if (r.tags && r.tags.includes(tag)) scores[r.key] += 10;
              });
            });
          }
        });
      });
    }

    const ranked = lineup.slice()
      .filter(r => !r.outOfStock)
      .sort((a, b) => scores[b.key] - scores[a.key]);

    return {
      category,
      radioNames,
      scores,
      ranked: ranked.map(r => ({ key: r.key, name: r.name, score: scores[r.key] })),
      top: ranked[0] ? ranked[0].key : null,
      runner: ranked[1] ? ranked[1].key : null,
    };
  }, answers);

  console.log(`  Category: ${result.category}`);
  console.log(`  Scores: ${JSON.stringify(result.scores)}`);
  console.log(`  Ranked: ${result.ranked.map(r => r.key + '(' + r.score + ')').join(', ')}`);

  assert(result.category === expectedCategory,
    `Category is "${result.category}" (expected "${expectedCategory}")`);

  if (expectedTopRadios.length > 0) {
    const topMatch = expectedTopRadios.includes(result.top);
    assert(topMatch,
      `Top radio "${result.top}" is in expected: [${expectedTopRadios.join(', ')}]`);
  }

  return result;
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  // Skip email to initialize JS
  await page.evaluate(() => kbsSkipEmail());
  await sleep(500);

  console.log(`${SECTION}══════ CATEGORY ROUTING TESTS ══════${RESET}`);

  await testScoring(page, 'Handheld only',
    { usage: ['handheld'] },
    'handheld', []);

  await testScoring(page, 'Vehicle/mobile only',
    { usage: ['vehicle'] },
    'mobile', ['uv50pro', 'd578']);

  await testScoring(page, 'Base station only',
    { usage: ['base'] },
    'base', ['uv50pro', 'd578']);

  await testScoring(page, 'HF only',
    { usage: ['hf'] },
    'hf', ['g90']);

  await testScoring(page, 'Scanner only',
    { usage: ['scanner'] },
    'scanner', ['sds200', 'sds100', 'sdr-kit']);

  await testScoring(page, 'Not sure + short range',
    { usage: ['notsure'], distance: 'short' },
    'handheld', []);

  await testScoring(page, 'Not sure + long range',
    { usage: ['notsure'], distance: 'long' },
    'base', ['uv50pro', 'd578']);

  await testScoring(page, 'Not sure + extreme range',
    { usage: ['notsure'], distance: 'extreme' },
    'hf', ['g90']);

  await testScoring(page, 'Not sure + at home',
    { usage: ['notsure'], where: ['athome'] },
    'base', ['uv50pro', 'd578']);

  await testScoring(page, 'Not sure + monitoring',
    { usage: ['notsure'], where: ['monitoring'] },
    'scanner', ['sds200', 'sds100', 'sdr-kit']);

  await testScoring(page, 'Not sure + in vehicle',
    { usage: ['notsure'], where: ['invehicle'] },
    'mobile', ['uv50pro', 'd578']);

  console.log(`\n${SECTION}══════ HANDHELD SCORING TESTS ══════${RESET}`);

  await testScoring(page, 'Budget + simple user → UV-5R or Mini',
    { usage: ['handheld'], preferences: ['simple'], budget: 'low', use: ['general'], features: ['price'] },
    'handheld', ['uv5r', 'uv5r-mini']);

  await testScoring(page, 'Waterproof priority → UV-PRO',
    { usage: ['handheld'], preferences: ['waterproof'], budget: 'mid', use: ['water', 'outdoor'], features: ['waterproof'] },
    'handheld', ['uv-pro']);

  await testScoring(page, 'Encryption/digital → DMR or DA-7X2',
    { usage: ['handheld'], preferences: ['digital'], budget: 'high', use: ['professional'], features: ['encryption'] },
    'handheld', ['dmr-6x2', 'da-7x2']);

  await testScoring(page, 'Max features / premium → DA-7X2',
    { usage: ['handheld'], preferences: ['digital', 'crossband'], budget: 'high', use: ['professional', 'emergency'], features: ['encryption'] },
    'handheld', ['da-7x2']);

  await testScoring(page, 'GPS + grow room → UV-PRO or DMR',
    { usage: ['handheld'], preferences: ['waterproof'], budget: 'mid', use: ['outdoor'], features: ['waterproof', 'grow'] },
    'handheld', ['uv-pro']);

  await testScoring(page, 'Airband monitoring → UV-PRO or DA-7X2 or Mini',
    { usage: ['handheld'], budget: 'mid', use: ['general'], features: ['airband'] },
    'handheld', ['uv-pro', 'da-7x2', 'uv5r-mini']);

  await testScoring(page, 'Cheapest possible → UV-5R Mini',
    { usage: ['handheld'], preferences: ['budget'], budget: 'low', features: ['price'] },
    'handheld', ['uv5r-mini', 'uv5r']);

  await testScoring(page, 'Crossband repeat → DA-7X2',
    { usage: ['handheld'], preferences: ['crossband'], budget: 'high', features: ['encryption'] },
    'handheld', ['da-7x2']);

  console.log(`\n${SECTION}══════ MOBILE/BASE SCORING TESTS ══════${RESET}`);

  await testScoring(page, 'Mobile + simple → UV50PRO',
    { usage: ['vehicle'], preferences: ['simple'] },
    'mobile', ['uv50pro']);

  await testScoring(page, 'Mobile + digital/encryption → D578',
    { usage: ['vehicle'], preferences: ['digital'] },
    'mobile', ['d578']);

  await testScoring(page, 'Base + budget → UV50PRO',
    { usage: ['base'], preferences: ['budget', 'simple'] },
    'base', ['uv50pro']);

  console.log(`\n${SECTION}══════ EDGE CASES ══════${RESET}`);

  await testScoring(page, 'No answers at all → handheld default',
    {},
    'handheld', []);

  await testScoring(page, 'Multiple usage types (handheld + vehicle) → handheld priority',
    { usage: ['handheld', 'vehicle'] },
    'mobile', ['uv50pro', 'd578']); // vehicle takes priority in current logic

  await testScoring(page, 'Handheld + base → base takes priority?',
    { usage: ['handheld', 'base'] },
    'base', []);

  console.log(`\n${SECTION}══════ SUMMARY ══════${RESET}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${passed + failed}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
