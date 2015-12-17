(function(window) {
/*jshint maxlen:false*/
'use strict';

var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  var shadowRoot = this.createShadowRoot();
  shadowRoot.innerHTML =
`<style>
  #container {
    padding: 0;
    display: flex;
    background-color: #27c8c2;
    font-size: 10px;
    height: 100%;
    width: 100%;
  }

  #container > input {
    width: 100%;
    min-width: 0;
    display: block;
    font-size: 3rem;
    background-color: transparent;
    border: none;
    padding: 0 0 0 12px;
    -moz-appearance: none;
    color: #fff;
  }

  #container > button {
    display: flex;
    width: 6rem;
    font-size: 4rem;
    color: rgba(255, 255, 255, 0.75);
    background-color: transparent;
    border: none;
    visibility: hidden;
    padding: 0;
    justify-content: center;
    align-items: center;
    -moz-appearance: none;
  }

  #container.hasvalue > button {
    visibility: visible;
  }

  button:before {
    font-family: "gaia-icons";
    content: 'clear-input';
    display: inline-block;
    font-weight: 500;
    font-style: normal;
    text-decoration: inherit;
    text-transform: none;
    text-rendering: optimizeLegibility;
    font-size: 4rem;
    -webkit-font-smoothing: antialiased;
  }
</style>
<div id="container">
  <input data-has-value="false" id="number" readonly="readonly" data-value="" type="tel">
  <button id="erase" aria-label="Delete" data-icon="clear-input" data-l10n-id="ignore"></button>
</div>`;

  var $id = shadowRoot.getElementById.bind(shadowRoot);

  this.els = {
    container: $id('container'),
    button: $id('erase'),
    input: $id('number')
  };

  this.els.button.addEventListener('click', () => this.eraseDigit());

  this.els.input.addEventListener('keypress', (evt) => {
    if (evt.key.length === 1 && evt.key.match(/[\d\+\#]/)) {
      this.value += evt.key;
      evt.preventDefault();
    } else if (evt.key === 'Backspace') {
      this.eraseDigit();
      evt.preventDefault();
    }
  });
};

proto.attachedCallback = function() {
};

proto.detachedCallback = function() {
};

proto.attributeChangedCallback = function(attr, oldVal, newVal) {
  switch (attr) {
    case 'value':
      this.els.container.classList.toggle('hasvalue', !!newVal.length);
      if (this._displayFunction) {
        this._displayFunction(newVal).then(displayedValue => {
          this.els.input.value = displayedValue;
        });
      } else {
        this.els.input.value = newVal;
      }
      this.dispatchEvent(new CustomEvent('change', {
        detail: { oldValue: oldVal, newValue: newVal }
      }));
      break;
  }
};

proto.eraseDigit = function() {
  let val = this.value;
  if (val) {
    this.value = val.substr(0, val.length - 1);
  }
};

Object.defineProperty(proto, 'value', {
  get: function() {
    return this.getAttribute('value') || '';
  },

  set: function(value) {
    let filtered = value.toString().replace(/[^\d\+\#]/g, '');
    this.setAttribute('value', filtered);
  }
});

Object.defineProperty(proto, 'displayedValue', {
  get: function() {
    return this.els.input.value;
  }
});

Object.defineProperty(proto, 'displayFunction', {
  get: function() {
    return this._displayFunction;
  },

  set: function(value) {
    this._displayFunction = value;
    if (this._displayFunction) {
      this._displayFunction(this.value).then(displayedValue => {
        this.els.input.value = displayedValue;
      });
    }
    let filtered = value.toString().replace(/[^\d\+\#]/g, '');
    this.setAttribute('value', filtered);
  }
});

try {
  window.PsDialerInput = document.registerElement('ps-dialer-input', {
    prototype: proto
  });
} catch (e) {
  if (e.name !== 'NotSupportedError') {
    throw e;
  }
}

})(window);
