<div id="rme-kit-builder-scroll" class="rme-kit-builder-scroll">
<!-- Inner wrapper provides #rme-kit-builder scope so base CSS component styles apply -->
<div id="rme-kit-builder">

  <!-- SECTION 1: Email Capture -->
  <div class="kb-section kb-section--active" data-section="email" id="sec-email" role="region" aria-label="Email capture" aria-expanded="true">
    <div class="kb-section__header">
      <span class="kb-section__number">1</span>
      <h2>Let's Get Started</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Every Radio Made Easy kit ships pre-programmed and ready to use. Enter your email so we can save your progress, or skip to jump right in.</p>
      <div class="kb-email-form">
        <input type="text" id="kbs-lead-name" placeholder="Your name (optional)">
        <input type="email" id="kbs-lead-email" placeholder="Your email address">
        <button class="kb-btn kb-btn--primary" onclick="kbsSubmitEmail()">Get Started</button>
        <a href="#" onclick="kbsSkipEmail();return false" class="kb-skip-link">Skip for now</a>
      </div>
    </div>
  </div>

  <!-- SECTION 2: Interview / Direct Pick -->
  <div class="kb-section kb-section--locked" data-section="interview" id="sec-interview" role="region" aria-label="Find your radio" aria-expanded="false" aria-disabled="true">
    <div class="kb-section__header">
      <span class="kb-section__number">2</span>
      <h2>Find Your Radio</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <div id="kbs-interview-choice" class="kbs-choice-screen">
        <div class="kbs-choice-card" onclick="kbsStartGuided()" tabindex="0" role="button">
          <span class="kbs-choice-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="currentColor" stroke="none"/></svg></span>
          <div class="kbs-choice-text">
            <h3>Help Me Choose</h3>
            <p>Answer a few quick questions and we'll recommend the best radio for your needs.</p>
          </div>
        </div>
        <div class="kbs-choice-card" onclick="kbsStartDirect()" tabindex="0" role="button">
          <span class="kbs-choice-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>
          <div class="kbs-choice-text">
            <h3>I Know What I Want</h3>
            <p>Jump straight to our lineup and pick your radio.</p>
          </div>
        </div>
        <div style="text-align:center;margin-top:16px;grid-column:1/-1">
          <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
        </div>
      </div>
      <div id="kbs-interview-stack" style="display:none"></div>
    </div>
  </div>

  <!-- SECTION 3: Radio Selection -->
  <div class="kb-section kb-section--locked" data-section="radio" id="sec-radio" role="region" aria-label="Choose your radio" aria-expanded="false" aria-disabled="true">
    <div class="kb-section__header">
      <span class="kb-section__number">3</span>
      <h2>Choose Your Radio</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <div id="kbs-recommendation"></div>
      <div id="kbs-radio-grid" class="radio-grid"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('radio')">Back</button>
        <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
      </div>
    </div>
  </div>

  <!-- SECTION 4: Radio Mounting (vehicle/base only, hidden for handheld) -->
  <div class="kb-section kb-section--locked" data-section="mounting" id="sec-mounting" role="region" aria-label="Radio mounting" aria-expanded="false" aria-disabled="true" style="display:none">
    <div class="kb-section__header">
      <span class="kb-section__number">4</span>
      <h2>Radio Mounting</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Your kit includes a factory mounting bracket. Upgrade for a more secure install.</p>
      <div class="options-grid" id="mounting-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('mounting')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('mounting')">Continue</button>
      </div>
    </div>
  </div>

  <!-- SECTION 5: Antennas -->
  <div class="kb-section kb-section--locked" data-section="antennas" id="sec-antennas" role="region" aria-label="Antennas" aria-expanded="false" aria-disabled="true">
    <div class="kb-section__header">
      <span class="kb-section__number">5</span>
      <h2>Antennas</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Your kit includes the factory antenna. Upgrade for better performance, or add antennas for specific setups.</p>
      <div class="options-grid" id="antenna-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('antennas')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('antennas')">Continue</button>
        <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
      </div>
    </div>
  </div>

  <!-- SECTION 6: Battery -->
  <div class="kb-section kb-section--locked" data-section="battery" id="sec-battery" role="region" aria-label="Battery upgrade" aria-expanded="false" aria-disabled="true">
    <div class="kb-section__header">
      <span class="kb-section__number">6</span>
      <h2>Battery Upgrade</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Your kit includes the factory battery. Add spares for extended runtime in the field.</p>
      <div class="options-grid" id="battery-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('battery')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('battery')">Continue</button>
        <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
      </div>
    </div>
  </div>

  <!-- SECTION 7: Accessories -->
  <div class="kb-section kb-section--locked" data-section="accessories" id="sec-accessories" role="region" aria-label="Accessories" aria-expanded="false" aria-disabled="true">
    <div class="kb-section__header">
      <span class="kb-section__number">7</span>
      <h2>Accessories</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Speakermics, cables, protective gear, and more.</p>
      <div class="options-grid" id="accessory-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('accessories')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('accessories')">Continue</button>
        <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
      </div>
    </div>
  </div>

  <!-- SECTION 8: Programming -->
  <div class="kb-section kb-section--locked" data-section="programming" id="sec-programming" role="region" aria-label="Custom programming" aria-expanded="false" aria-disabled="true">
    <div class="kb-section__header">
      <span class="kb-section__number">8</span>
      <h2>Custom Programming</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Every Radio Made Easy kit comes custom programmed and ready to use out of the box, with local channels and weather alerts for your area.</p>
      <div class="options-grid" id="programming-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('programming')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('programming')">Continue</button>
        <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
      </div>
    </div>
  </div>

  <!-- SECTION 9: Review & Cart -->
  <div class="kb-section kb-section--locked" data-section="review" id="sec-review" role="region" aria-label="Review your kit" aria-expanded="false" aria-disabled="true">
    <div class="kb-section__header">
      <span class="kb-section__number">9</span>
      <h2>Review Your Kit</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <div id="review-list"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('review')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('review')">Continue to Checkout</button>
        <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
      </div>
    </div>
  </div>

  <!-- SECTION 10: Quantity & Volume Discount -->
  <div class="kb-section kb-section--locked" data-section="quantity" id="sec-quantity" role="region" aria-label="Kit quantity" aria-expanded="false" aria-disabled="true">
    <div class="kb-section__header">
      <span class="kb-section__number">10</span>
      <h2>How Many?</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Need more than one of this exact kit? Add more to save.</p>
      <div id="kbs-qty-picker"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('quantity')">Back</button>
        <button class="kb-btn kb-btn--primary kb-btn--cart" onclick="kbsAddToCart()">Add to Cart</button>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <div class="modal-overlay" id="adapter-modal">
    <div class="modal-box">
      <h3>BNC Adapter Needed</h3>
      <p>This antenna uses a BNC connector. Your radio has an SMA connector, so you'll need an SMA-F to BNC-F Adapter ($5) to use it.</p>
      <div class="modal-actions">
        <button class="kb-btn kb-btn--primary" onclick="adapterModalAdd()">Add Adapter + Antenna</button>
        <button class="kb-btn kb-btn--secondary" onclick="adapterModalSkip()">I Have One Already</button>
        <button class="kb-btn kb-btn--secondary kbs-modal-cancel" onclick="adapterModalCancel()">Cancel</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="mismatch-modal">
    <div class="modal-box" id="mismatch-content"></div>
  </div>

  <div class="modal-overlay" id="adapter-warn-modal">
    <div class="modal-box">
      <h3>BNC Adapter Reminder</h3>
      <p>You've removed the BNC adapter, but these antennas in your kit need one:</p>
      <ul id="adapter-warn-list"></ul>
      <div class="modal-actions">
        <button class="kb-btn kb-btn--primary" onclick="document.getElementById('adapter-warn-modal').classList.remove('open');toggleAddlAntenna('extraadapter')">Keep the Adapter</button>
        <button class="kb-btn kb-btn--secondary" onclick="removeAllBncAntennas();document.getElementById('adapter-warn-modal').classList.remove('open')">Remove Those Antennas</button>
      </div>
    </div>
  </div>

  <!-- Lightbox -->
  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <div class="lb-close" onclick="closeLightbox()">&times;</div>
    <img src="" alt="">
    <div class="lb-caption"></div>
  </div>

</div><!-- /rme-kit-builder (inner wrapper for base CSS scope) -->
</div><!-- /rme-kit-builder-scroll -->

<!-- Sticky Price Bar -->
<div class="kb-scroll-price-bar" id="kb-scroll-price-bar" style="display:none">
  <div class="kbp-info">
    <span class="kbp-label" id="kbs-radio-name"></span>
    <span class="kbp-subtotal-label">Total</span>
    <span class="kbp-total" id="kbs-total"></span>
  </div>
</div>

<!-- Floating Help Button -->
<a href="#" id="kbs-consult-float" class="kbs-consult-float kbs-consult-link" target="_blank" title="Book a consultation" style="display:none">?</a>
