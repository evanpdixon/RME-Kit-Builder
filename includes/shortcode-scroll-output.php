<div id="rme-kit-builder-scroll" class="rme-kit-builder-scroll">
<!-- Inner wrapper provides #rme-kit-builder scope so base CSS component styles apply -->
<div id="rme-kit-builder">

  <!-- SECTION 1: Email Capture -->
  <div class="kb-section kb-section--active" data-section="email" id="sec-email">
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
  <div class="kb-section kb-section--locked" data-section="interview" id="sec-interview">
    <div class="kb-section__header">
      <span class="kb-section__number">2</span>
      <h2>Find Your Radio</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <div id="kbs-interview-choice" class="kbs-choice-screen">
        <div class="kbs-choice-card" onclick="kbsStartGuided()">
          <h3>Help Me Choose</h3>
          <p>Answer a few quick questions and we'll recommend the best radio for your needs.</p>
        </div>
        <div class="kbs-choice-card" onclick="kbsStartDirect()">
          <h3>I Know What I Want</h3>
          <p>Jump straight to our lineup and pick your radio.</p>
        </div>
        <div style="text-align:center;margin-top:16px;grid-column:1/-1">
          <a href="#" class="kbs-consult-escape" target="_blank" class="kbs-consult-link">&#128222; Not sure where to start? Book a consultation</a>
        </div>
      </div>
      <div id="kbs-interview-stack" style="display:none"></div>
    </div>
  </div>

  <!-- SECTION 3: Radio Selection -->
  <div class="kb-section kb-section--locked" data-section="radio" id="sec-radio">
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
        <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">&#128222; Not sure? Book a consultation</a>
      </div>
    </div>
  </div>

  <!-- SECTION 4: Antennas -->
  <div class="kb-section kb-section--locked" data-section="antennas" id="sec-antennas">
    <div class="kb-section__header">
      <span class="kb-section__number">4</span>
      <h2>Antennas</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Your kit includes the factory antenna. Upgrade for better performance, or add antennas for specific setups.</p>
      <div class="options-grid" id="antenna-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('antennas')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('antennas')">Continue</button>
        <a href="#" class="kbs-consult-escape" target="_blank" class="kbs-consult-link">&#128222; Not sure? Book a consultation</a>
      </div>
    </div>
  </div>

  <!-- SECTION 5: Battery -->
  <div class="kb-section kb-section--locked" data-section="battery" id="sec-battery">
    <div class="kb-section__header">
      <span class="kb-section__number">5</span>
      <h2>Battery Upgrade</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <div class="options-grid" id="battery-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('battery')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('battery')">Continue</button>
        <a href="#" class="kbs-consult-escape" target="_blank" class="kbs-consult-link">&#128222; Not sure? Book a consultation</a>
      </div>
    </div>
  </div>

  <!-- SECTION 6: Accessories -->
  <div class="kb-section kb-section--locked" data-section="accessories" id="sec-accessories">
    <div class="kb-section__header">
      <span class="kb-section__number">6</span>
      <h2>Accessories</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Speakermics, cables, protective gear, and more.</p>
      <div class="options-grid" id="accessory-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('accessories')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('accessories')">Continue</button>
        <a href="#" class="kbs-consult-escape" target="_blank" class="kbs-consult-link">&#128222; Not sure? Book a consultation</a>
      </div>
    </div>
  </div>

  <!-- SECTION 7: Programming -->
  <div class="kb-section kb-section--locked" data-section="programming" id="sec-programming">
    <div class="kb-section__header">
      <span class="kb-section__number">7</span>
      <h2>Custom Programming</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <p>Every Radio Made Easy kit comes custom programmed with GMRS, FRS, NOAA weather, and local repeaters for your area.</p>
      <div class="options-grid" id="programming-options"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('programming')">Back</button>
        <button class="kb-btn kb-btn--primary" onclick="kbsCompleteSection('programming')">Continue</button>
        <a href="#" class="kbs-consult-escape" target="_blank" class="kbs-consult-link">&#128222; Not sure? Book a consultation</a>
      </div>
    </div>
  </div>

  <!-- SECTION 8: Review & Cart -->
  <div class="kb-section kb-section--locked" data-section="review" id="sec-review">
    <div class="kb-section__header">
      <span class="kb-section__number">8</span>
      <h2>Review Your Kit</h2>
    </div>
    <div class="kb-section__summary" style="display:none"></div>
    <div class="kb-section__content">
      <div id="review-list"></div>
      <div class="kb-section__actions">
        <button class="kb-btn kb-btn--secondary" onclick="kbsGoBack('review')">Back</button>
        <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">&#128222; Need help? Book a consultation</a>
      </div>
    </div>
  </div>

  <!-- Modals (reused from step-based) -->
  <div class="modal-overlay" id="adapter-modal">
    <div class="modal-box">
      <h3>BNC Adapter Needed</h3>
      <p>This antenna uses a BNC connector. Your radio has an SMA connector, so you'll need an SMA-F to BNC-F Adapter ($5) to use it.</p>
      <div class="modal-actions">
        <button class="btn-nav btn-next" onclick="adapterModalAdd()">Add Adapter + Antenna</button>
        <button class="btn-nav btn-back" onclick="adapterModalSkip()">I Have One Already</button>
        <button class="btn-nav btn-back" onclick="adapterModalCancel()" style="opacity:0.6;font-size:12px">Cancel</button>
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
        <button class="btn-nav btn-next" onclick="document.getElementById('adapter-warn-modal').classList.remove('open');toggleAddlAntenna('extraadapter')">Keep the Adapter</button>
        <button class="btn-nav btn-back" onclick="removeAllBncAntennas();document.getElementById('adapter-warn-modal').classList.remove('open')">Remove Those Antennas</button>
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
    <span class="kbp-total" id="kbs-total"></span>
  </div>
  <a href="#" id="kbs-consult-btn" class="kbp-consult kbs-consult-link" target="_blank">&#128222; <span>Book a consultation</span></a>
  <button class="kb-btn kb-btn--primary kb-btn--cart" id="kbs-cart-btn" disabled onclick="kbsAddToCart()">
    &#128722; Add to Cart
  </button>
</div>
