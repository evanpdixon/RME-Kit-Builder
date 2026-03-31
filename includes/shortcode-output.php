<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<div id="rme-kit-builder">

  <!-- EMAIL CAPTURE (shown first) -->
  <div id="email-capture-phase" class="needs-phase">
    <div class="needs-landing" style="text-align:center">
      <h2>Let's Build Your Perfect Radio Kit</h2>
      <p>Every Radio Made Easy kit ships pre-programmed and ready to use. Enter your email to get started — we'll save your progress and send helpful follow-ups if you need more time.</p>
      <div style="max-width:380px;margin:28px auto 0;">
        <input type="text" id="kb-lead-name" placeholder="Your name (optional)" style="width:100%;padding:14px 16px;margin-bottom:10px;background:var(--rme-surface,#1a1a1a);border:1px solid var(--rme-border,#333);border-radius:10px;color:var(--rme-text,#e0e0e0);font-size:15px;font-family:inherit;outline:none;">
        <input type="email" id="kb-lead-email" placeholder="Your email address" style="width:100%;padding:14px 16px;margin-bottom:16px;background:var(--rme-surface,#1a1a1a);border:1px solid var(--rme-border,#333);border-radius:10px;color:var(--rme-text,#e0e0e0);font-size:15px;font-family:inherit;outline:none;">
        <button onclick="captureEmailAndStart()" style="width:100%;padding:16px;border-radius:12px;border:none;background:var(--rme-gold,#d4a843);color:#0c0c0c;font-size:16px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity 0.15s;" id="kb-start-btn">Get Started</button>
        <div style="margin-top:14px;">
          <a href="#" onclick="skipEmailCapture();return false;" style="color:var(--rme-muted,#888);font-size:13px;text-decoration:none;">Skip for now</a>
        </div>
      </div>
    </div>
  </div>

  <!-- NEEDS ASSESSMENT PHASE -->
  <div id="needs-phase" class="needs-phase" style="display:none">
    <div id="needs-landing" class="needs-landing">
      <h2>What Radios Do You Need?</h2>
      <p>Handhelds, vehicle mobiles, base stations, HF — or a combination. Every Radio Made Easy kit ships pre-programmed and ready to use. Let's figure out the right setup for you.</p>
      <div class="selector-paths">
        <div class="selector-path" onclick="startNeedsAssessment()">
          <div class="sp-icon">&#x1F9ED;</div>
          <h3>Help Me Figure It Out</h3>
          <p>Answer a few quick questions about distance, vehicles, and use case — we'll recommend the right radios and build a plan.</p>
        </div>
        <div class="selector-path" onclick="showCategoryPicker()">
          <div class="sp-icon">&#x1F4CB;</div>
          <h3>I Know What I Need</h3>
          <p>Pick your categories — handheld, mobile, base, or HF — set quantities, and build each kit step by step.</p>
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
      <p>Every Radio Made Easy kit comes pre-programmed and ready to use out of the box. Pick your radio and customize it with antennas, batteries, and accessories — we'll handle the rest.</p>
      <div class="selector-paths">
        <div class="selector-path" onclick="startInterview()">
          <div class="sp-icon">&#x1F9ED;</div>
          <h3>Help Me Choose</h3>
          <p>Answer a few quick questions and we'll recommend the best radio for your needs.</p>
        </div>
        <div class="selector-path" onclick="showRadioPicker()">
          <div class="sp-icon">&#x1F4FB;</div>
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
        <div style="color:#444;font-size:13px;text-align:center">Radio Kit</div>
      </div>
      <div class="hero-info">
        <h1 id="hero-title">Kit</h1>
        <div class="base-price" id="hero-price">$0.00</div>
        <div class="desc" id="hero-desc"></div>
        <div class="includes" id="hero-includes"></div>
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

</div><!-- /rme-kit-builder -->

<!-- Sticky bottom bar -->
<div class="rme-kb-bottom-bar" id="rme-kb-bottom-bar">
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
      <button class="modal-btn-add" onclick="adapterModalAdd()">Add adapter to my order — $5</button>
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
      <button class="modal-btn-cancel" onclick="adapterWarnRemoveOnly()" style="font-size:12px">Remove adapter only — I'll supply my own</button>
    </div>
  </div>
</div>

<!-- CONSULTATION FOOTER (shown during wizard) -->
<div id="consultation-footer" style="display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(26,26,26,0.95);backdrop-filter:blur(8px);border-top:1px solid #333;padding:10px 16px;z-index:9998;text-align:center;">
  <a href="#" id="consultation-link" target="_blank" style="color:var(--rme-muted,#888);font-size:13px;text-decoration:none;">
    Not sure what to pick? <span style="color:var(--rme-gold,#d4a843);text-decoration:underline;">Book a consultation</span>
  </a>
</div>

<!-- CONSULTATION BANNER (triggered by inactivity) -->
<div id="consultation-banner" style="display:none;position:fixed;bottom:60px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:480px;background:#1a1a1a;border:1px solid var(--rme-gold,#d4a843);border-radius:16px;padding:24px;z-index:9999;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
  <div style="font-size:15px;font-weight:600;color:var(--rme-text,#e0e0e0);margin-bottom:8px;">Not sure which option to pick?</div>
  <div style="font-size:13px;color:var(--rme-muted,#888);margin-bottom:20px;line-height:1.5;">Our team can help you build the perfect radio kit. No obligation.</div>
  <div style="display:flex;gap:10px;justify-content:center;">
    <a href="#" id="banner-consult-link" target="_blank" style="padding:12px 24px;border-radius:10px;background:var(--rme-gold,#d4a843);color:#0c0c0c;font-size:14px;font-weight:600;text-decoration:none;">Book a Consultation</a>
    <button onclick="dismissConsultBanner()" style="padding:12px 24px;border-radius:10px;border:1px solid #333;background:transparent;color:var(--rme-muted,#888);font-size:14px;cursor:pointer;font-family:inherit;">Keep Building</button>
  </div>
</div>

<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <div class="lb-close">&times;</div>
  <img src="" alt="Product image">
  <div class="lb-caption"></div>
</div>
