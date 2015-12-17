(function(window) {
/*jshint maxlen:false*/
'use strict';

var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  var shadowRoot = this.createShadowRoot();
  shadowRoot.innerHTML =
`<style>
    #container {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-content: stretch;
  }

  .keypad-row {
    display: flex;
    height: 100%;
  }

  .key {
    width: 100%;
    -moz-appearance: none;
    border: none;
    padding: 0;
    background-color: transparent;
    text-align: initial;
    transition: 0.15s background-color;
  }

  .key:active, .key.active {
    background-color: #9ef2e7;
    color: #fff;
  }

  .key > div {
    display: flex;
    align-items: baseline;
  }

  .key > div > span {
    font-size: 5rem;
    font-family: serif;
    line-height: normal;
    display: block;
    width: 50%;
    text-align: right;
  }

  .key > div > em {
    width: 50%;
    font-weight: 300;
    font-size: 1rem;
    color: #038282;
    font-style: normal;
    text-transform: uppercase;
    display: block;
  }
</style>
<div id="container">
  <div class="keypad-row">
    <button accesskey="1" role="key" data-value="1" class="key">
      <div>
        <span>1</span>
      </div>
    </button>
    <button role="key" data-value="2" class="key">
      <div>
        <span>2</span> <em>abc</em>
      </div>
    </button>
    <button role="key" data-value="3" class="key">
      <div>
        <span>3</span> <em>def</em>
      </div>
    </button>
  </div>
  <div class="keypad-row">
    <button role="key" data-value="4" class="key">
      <div>
        <span>4</span>
        <em>ghi</em>
      </div>
    </button>
    <button role="key" data-value="5" class="key">
      <div>
        <span>5</span>
        <em>jkl</em>
      </div>
    </button>
    <button role="key" data-value="6" class="key">
      <div>
        <span>6</span>
        <em>mno</em>
      </div>
    </button>
  </div>
  <div class="keypad-row">
    <button role="key" data-value="7" class="key">
      <div>
        <span>7</span>
        <em>pqrs</em>
      </div>
    </button>
    <button role="key" data-value="8" class="key">
      <div>
        <span>8</span>
        <em>tuv</em>
      </div>
    </button>
    <button role="key" data-value="9" class="key">
      <div>
        <span>9</span>
        <em>wxyz</em>
      </div>
    </button>
  </div>
  <div class="keypad-row">
    <button role="key" data-value="*" class="key">
      <div>
        <span>*</span>
        <em>’</em>
      </div>
    </button>
    <button role="key" data-value="0" class="key">
      <div>
        <span>0</span>
        <em>+</em>
      </div>
    </button>
    <button role="key" data-value="#" class="key">
      <div>
        <span>#</span>
      </div>
    </button>
  </div>
</div>`;

  var $id = shadowRoot.getElementById.bind(shadowRoot);

  this.els = {
    container: $id('container')
  };

  let dtmfId = 0;
  function playDTMF(value) {
    if (window.DTMF) {
      dtmfId = window.DTMF.play(value);
    }
  }

  function stopDTMF() {
    if (window.DTMF && dtmfId) {
      window.DTMF.stop(dtmfId);
      dtmfId = 0;
    }
  }

  this.els.container.addEventListener('click', evt => {
    let target = evt.target;
    if (target.dataset.value) {
      if (evt.clientX === 0 && evt.clientY === 0) {
        // Keyboard activated. Synthesize DTMF.
        stopDTMF();
        playDTMF(target.dataset.value);
        target.classList.toggle('active', true);
        setTimeout(() => {
          target.classList.toggle('active', false);
          stopDTMF();
        }, 200);
      }
      this.dispatchEvent(
        new CustomEvent('dialed', { detail: evt.target.dataset.value }));
    }
  });

  this.els.container.addEventListener('mousedown', evt => {
    stopDTMF();
    if (evt.target.dataset.value) {
      playDTMF(evt.target.dataset.value);
    }
  });

  this.els.container.addEventListener('mouseup', evt => {
    stopDTMF();
  });
};

proto.attachedCallback = function() {
};

proto.detachedCallback = function() {
};

proto.attributeChangedCallback = function(attr, oldVal, newVal) {
};

proto.press = function(keyval) {
  let key =
    this.els.container.querySelector('.key[data-value=\'' + keyval + '\']');
  if (key) {
    key.click();
    return true;
  }

  return false;
};

try {
  window.PsDialerKeypad = document.registerElement('ps-dialer-keypad', {
    prototype: proto
  });
} catch (e) {
  if (e.name !== 'NotSupportedError') {
    throw e;
  }
}

})(window);
