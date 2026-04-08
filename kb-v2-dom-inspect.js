const { chromium } = require('playwright');

const URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Dump the main content area HTML
  const html = await page.evaluate(() => {
    const main = document.querySelector('.kb-v2-container, .kit-builder-v2, #kb-v2, .kb-wrapper, .entry-content, main, article');
    if (main) return main.innerHTML.substring(0, 10000);
    return document.body.innerHTML.substring(0, 10000);
  });
  console.log('=== MAIN HTML ===');
  console.log(html);

  // Check for all clickable elements with text
  const clickables = await page.evaluate(() => {
    const els = document.querySelectorAll('button, a, [role="button"], [onclick], .clickable, [data-action], .kb-card, .path-card, .kb-path-option');
    return Array.from(els).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().substring(0, 80),
      classes: el.className,
      id: el.id,
      href: el.href || '',
      disabled: el.disabled,
      type: el.type || '',
    }));
  });
  console.log('\n=== CLICKABLE ELEMENTS ===');
  clickables.forEach(c => console.log(`${c.tag} | text="${c.text}" | class="${c.classes}" | id="${c.id}" | disabled=${c.disabled}`));

  // Find email input
  const inputs = await page.evaluate(() => {
    const els = document.querySelectorAll('input, textarea');
    return Array.from(els).map(el => ({
      tag: el.tagName,
      type: el.type,
      name: el.name,
      placeholder: el.placeholder,
      id: el.id,
      classes: el.className,
    }));
  });
  console.log('\n=== INPUT ELEMENTS ===');
  inputs.forEach(i => console.log(`${i.tag} type=${i.type} name="${i.name}" placeholder="${i.placeholder}" class="${i.classes}" id="${i.id}"`));

  // Check for React/Vue/Alpine data
  const framework = await page.evaluate(() => {
    const root = document.querySelector('#kb-v2-app, [data-v-app], [x-data], [data-reactroot]');
    if (root) return 'Found framework root: ' + root.tagName + ' ' + root.className + ' ' + root.id;

    // Check for Alpine.js
    const alpine = document.querySelectorAll('[x-data]');
    if (alpine.length) return 'Alpine.js: ' + alpine.length + ' components';

    // Check for Vue
    if (window.__VUE__) return 'Vue detected';

    // Check for jQuery click handlers
    const hasJquery = !!window.jQuery;
    return 'jQuery: ' + hasJquery;
  });
  console.log('\n=== FRAMEWORK ===');
  console.log(framework);

  await browser.close();
}

main().catch(console.error);
