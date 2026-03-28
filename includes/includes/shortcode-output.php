<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<div id="rme-kit-builder" class="page">

  <!-- Debug panel (staging only) -->
  <div id="rme-kb-debug" style="position:fixed;bottom:60px;left:8px;max-width:400px;background:#111;border:1px solid #333;border-radius:8px;font-size:11px;font-family:monospace;color:#aaa;z-index:99999;display:none;line-height:1.6">
    <div id="rme-kb-debug-header" style="color:#fdd351;font-weight:bold;padding:8px 14px;cursor:pointer;user-select:none;display:flex;align-items:center;gap:8px" onclick="var c=document.getElementById('rme-kb-debug-content');var s=document.getElementById('rme-kb-debug-state');c.style.display=c.style.display==='none'?'block':'none';s.style.display=s.style.display==='none'?'block':'none'">
      <span style="flex:1">Debug</span>
      <span onclick="event.stopPropagation();rmeDebugCopy()" style="cursor:pointer;color:#4caf50;font-size:10px">COPY</span>
      <span id="rme-kb-debug-minmax" onclick="event.stopPropagation();var c=document.getElementById('rme-kb-debug-content');var s=document.getElementById('rme-kb-debug-state');var b=this;if(c.style.display==='none'){c.style.display='block';s.style.display='block';b.textContent='MIN'}else{c.style.display='none';s.style.display='none';b.textContent='MAX'}" style="cursor:pointer;color:#888;font-size:10px">MIN</span>
      <span onclick="event.stopPropagation();if(confirm('Close debug panel? Log data will be lost.')){document.getElementById('rme-kb-debug').style.display='none'}" style="cursor:pointer;color:#e55">&times;</span>
    </div>
    <div id="rme-kb-debug-state" style="padding:4px 14px 8px;font-size:10px;color:#666;border-bottom:1px solid #222"></div>
    <div id="rme-kb-debug-content" style="max-height:200px;overflow-y:auto;padding:0 14px 10px"></div>
  </div>

  <!-- NEEDS ASSESSMENT PHASE -->
  <div id="needs-phase" class="needs-phase">
    <div id="needs-landing" class="needs-landing">
      <h2>What Radios Do You Need?</h2>
      <p>Every Radio Made Easy kit ships pre-programmed and ready to use. Let's figure out the right setup for you.</p>
      <div class="selector-paths">
        <div class="selector-path" onclick="startNeedsAssessment()">
          <div class="sp-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="currentColor" stroke="none"/></svg></div>
          <h3>Help Me Choose</h3>
          <p>Answer a few quick questions and we'll recommend the right radios and build a plan.</p>
        </div>
        <div class="selector-path" onclick="showCategoryPicker()">
          <div class="sp-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></div>
          <h3>Explore All Options</h3>
          <p>Browse our full lineup and build each kit step by step.</p>
        </div>
      </div>
    </div>
    <div id="needs-container" style="display:none"></div>
    <div id="kit-plan-container" style="display:none"></div>
  </div>

  <!-- RADIO SELECTOR PHASE (handheld) -->
  <div id="selector-phase" class="selector-phase" style="display:none">
    <div class="selector-landing" id="selector-landing">
      <h2>Build Your Custom Radio Kit</h2>
      <p>Every Radio Made Easy kit comes pre-programmed and ready to use out of the box. Pick your radio and customize it with antennas, batteries, and accessories. We'll handle the rest.</p>
      <div class="selector-paths">
        <div class="selector-path" onclick="startInterview()">
          <div class="sp-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="currentColor" stroke="none"/></svg></div>
          <h3>Help Me Choose</h3>
          <p>Answer a few quick questions and we'll recommend the best radio for your needs.</p>
        </div>
        <div class="selector-path" onclick="showRadioPicker()">
          <div class="sp-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="6" width="10" height="16" rx="2"/><path d="M9 6V2h2v4"/><line x1="10" y1="10" x2="14" y2="10"/><circle cx="12" cy="16" r="1.5"/><rect x="10" y="12" width="4" height="2" rx="0.5"/></svg></div>
          <h3>I Know What I Want</h3>
          <p>Jump straight to our lineup and pick your radio to start building your kit.</p>
        </div>
      </div>
    </div>
    <div id="interview-container" style="display:none"></div>
    <div id="radio-picker" style="display:none">
      <div style="text-align:center;margin-bottom:8px">
        <h2 style="font-size:22px">Choose Your Radio</h2>
        <p style="color:var(--rme-muted);font-size:14px">Select a radio to start building your kit.</p>
      </div>
      <div class="radio-grid" id="radio-grid"></div>
      <div style="text-align:center;margin-top:20px">
        <button class="btn-nav btn-back" onclick="backToSelectorLanding()">&#8592; Back</button>
      </div>
    </div>
  </div>

  <!-- WIZARD PHASE (hidden until radio selected) -->
  <div id="wizard-phase" style="display:none">
    <div class="hero">
      <div class="hero-img" style="cursor:zoom-in" id="hero-img-container">
        <img src="" alt="Radio Kit" style="display:none">
      </div>
      <div class="hero-info">
        <h1 id="hero-title">Kit</h1>
        <div class="base-price" id="hero-price">$0.00</div>
        <div class="desc" id="hero-desc"></div>
        <div class="includes" id="hero-includes"><ul></ul></div>
      </div>
    </div>

    <div class="step-mobile" id="step-mobile">
      <div class="sm-label" id="sm-label">Step 1 of 6</div>
      <div class="sm-dots" id="sm-dots"></div>
    </div>

    <div class="step-labels" id="step-labels"></div>
    <div class="progress" id="progress"></div>

    <div class="wizard-section" id="step-color" style="display:none">
      <div class="section-head">
        <h2>Choose Your Color</h2>
        <p>The UV-PRO is available in two colors.</p>
      </div>
      <div class="options-grid" id="color-options"></div>
    </div>

    <div class="wizard-section active" id="step-0">
      <div class="section-head">
        <h2>Antenna Upgrades</h2>
        <p>Your kit includes the factory antenna. Add high-performance BNC antennas below.</p>
      </div>
      <div class="options-grid" id="antenna-options"></div>
    </div>

    <div class="wizard-section" id="step-1">
      <div class="section-head">
        <h2>Additional Antennas</h2>
        <p>Supplemental antennas for extended range, mobile use, or body-worn setups.</p>
      </div>
      <div class="options-grid" id="addl-antenna-options"></div>
    </div>

    <div class="wizard-section" id="step-2">
      <div class="section-head">
        <h2>Battery Upgrade</h2>
        <p>Upgrade to a USB-C rechargeable battery.</p>
      </div>
      <div class="options-grid" id="battery-options"></div>
    </div>

    <div class="wizard-section" id="step-3">
      <div class="section-head">
        <h2>Add Accessories</h2>
        <p>Speakermics, cables, protective gear, and more.</p>
      </div>
      <div class="options-grid" id="accessory-options"></div>
    </div>

    <div class="wizard-section" id="step-4">
      <div class="section-head">
        <h2>Custom Programming</h2>
        <p>Every Radio Made Easy kit comes custom programmed with GMRS, FRS, NOAA weather, and local repeaters for your area.</p>
      </div>
      <div class="options-grid" id="programming-options"></div>
    </div>

    <div class="wizard-section" id="step-5">
      <div class="section-head">
        <h2>Review Your Kit</h2>
        <p>Here's everything in your customized kit.</p>
      </div>
      <div class="review-list" id="review-list"></div>
    </div>
  </div><!-- /wizard-phase -->

  <!-- MOBILE FLOW PHASE -->
  <div id="mobile-phase" class="selector-phase" style="display:none"></div>

  <!-- BASE STATION FLOW PHASE -->
  <div id="base-phase" class="selector-phase" style="display:none"></div>

  <!-- HF FLOW PHASE -->
  <div id="hf-phase" class="selector-phase" style="display:none"></div>
  <!-- SCANNER / SDR FLOW PHASE -->
  <div id="scanner-phase" class="selector-phase" style="display:none"></div>

</div><!-- /rme-kit-builder -->

<!-- Sticky bottom bar -->
<div class="rme-kb-bottom-bar" id="rme-kb-bottom-bar" style="display:none">
  <div class="bb-summary">
    <div><div class="bb-base">Base kit: $59</div><div class="bb-adds" id="bb-adds">+ $0 add-ons</div></div>
    <div class="bb-divider"></div>
    <div><div class="bb-total" id="bb-total">$59</div><div class="bb-items" id="bb-items">Base kit only</div></div>
  </div>
  <div class="bb-divider"></div>
  <button class="btn-nav btn-back" id="btn-back" onclick="prevStep()" style="display:none">Back</button>
  <button class="btn-nav btn-next" id="btn-next" onclick="nextStep()">Next &#8594;</button>
</div>

<!-- Modals -->
<div class="modal-overlay" id="adapter-modal">
  <div class="modal-box">
    <h3>BNC Adapter Needed</h3>
    <p>This antenna connects via BNC and requires an SMA-F to BNC-F Adapter to work with your radio.</p>
    <div class="modal-btns" style="flex-direction:column;gap:8px">
      <button class="modal-btn-add" onclick="adapterModalAdd()">Add adapter to my order ($5)</button>
      <button class="modal-btn-cancel" onclick="adapterModalSkip()">I already have one</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="mismatch-modal">
  <div class="modal-box"></div>
</div>

<div class="modal-overlay" id="adapter-warn-modal">
  <div class="modal-box">
    <h3>&#9888; Adapter Required</h3>
    <p>The following antennas in your kit require an SMA-F to BNC-F Adapter:</p>
    <ul id="adapter-warn-list" style="text-align:left;margin:0 auto 16px;max-width:280px;font-size:14px;color:var(--rme-red);list-style:none;padding:0;line-height:1.8"></ul>
    <div class="modal-btns" style="flex-direction:column;gap:8px">
      <button class="modal-btn-add" onclick="adapterWarnKeep()">Keep adapter in my kit</button>
      <button class="modal-btn-cancel" onclick="adapterWarnRemoveAll()">Remove adapter and all BNC antennas</button>
      <button class="modal-btn-cancel" onclick="adapterWarnRemoveOnly()" style="font-size:12px">Remove adapter only (I'll supply my own)</button>
    </div>
  </div>
</div>

<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <div class="lb-close">&times;</div>
  <img src="" alt="Product image">
  <div class="lb-caption"></div>
</div>
