/* globals DTMF, telephone, bridge , BroadcastChannel*/

'use strict';

(function () {
  var numberInput = document.querySelector('input#number');
  var eraseButton = document.getElementById('erase');
  var callButton = document.getElementById('call');
  var keypad = document.getElementById('keypad');
  var acceptButton = document.getElementById('accept');
  var rejectButton = document.getElementById('reject');
  var hangupButton = document.getElementById('hangup');
  var callStatus = document.querySelector('#call-status h3');

  numberInput.dataset.hasValue = numberInput.value.length !== 0;

  function sanitizeNumber(number) {
    return number;
  }

  function insertNumber(val, replace = false) {
    if (replace) {
      numberInput.value = sanitizeNumber(val);
    } else {
      var id = DTMF.play(val);
      setTimeout(() => {
        DTMF.stop(id);
      }, 200);
      numberInput.value = sanitizeNumber(numberInput.value + val);
    }

    numberInput.dataset.hasValue = numberInput.value.length !== 0;
  }

  function eraseNumber() {
    var val = numberInput.value;
    numberInput.value = val.substr(0, val.length - 1);
    numberInput.dataset.hasValue = numberInput.value.length !== 0;
  }

  keypad.addEventListener('click', (evt) => {
    if (evt.target.dataset.value) {
      insertNumber(evt.target.dataset.value);
    }
  });

  eraseButton.addEventListener('click', eraseNumber);

  numberInput.addEventListener('keypress', (evt) => {
    if (/[\#\*\d]/.test(evt.key)) {
      evt.preventDefault();
      insertNumber(evt.key);
    } else if (evt.key === 'Backspace') {
      eraseNumber();
    }
  });

  callButton.addEventListener('click', () => {
    telephone.call(numberInput.value);
    numberInput.value = '';
  });

  acceptButton.addEventListener('click', () => {
    telephone.accept();
  });

  rejectButton.addEventListener('click', () => {
    telephone.reject();
  });

  hangupButton.addEventListener('click', () => {
    telephone.hangup();
  });

  addEventListener('phone-inbound', (evt) => {
    document.location.hash = '#dialer';
    document.querySelector('#call-info h1')
      .textContent = evt.detail.contact;
    callStatus.textContent = 'Incoming';
    document.body.classList.add('incall');
    document.body.classList.add('inbound');
  });

  addEventListener('phone-outbound', (evt) => {
    document.querySelector('#call-info h1')
      .textContent = evt.detail.contact;
    callStatus.textContent = 'Connecting';
    document.body.classList.add('incall');
    document.body.classList.add('outbound');
  });

  var callTimer;
  var startTime;

  function timerTick() {
    var delta = new Date(Date.now() - startTime);
    var t = [];
    var seconds = delta.getSeconds();
    t.unshift(seconds < 10 ? '0' + seconds : seconds + '');
    var minutes = delta.getMinutes();
    t.unshift(minutes < 10 ? '0' + minutes : minutes + '');
    var hours = delta.getHours() - (new Date(0))
      .getHours();
    if (hours) {
      t.unshift(hours);
    }
    callStatus.textContent = t.join(':');
  }

  addEventListener('phone-connect', (evt) => {
    startTime = Date.now();
    timerTick();
    callTimer = setInterval(timerTick, 1000);
  });

  addEventListener('phone-disconnect', (evt) => {
    clearInterval(callTimer);
    document.body.classList.remove('incall');
    document.body.classList.remove('inbound');
    document.body.classList.remove('outbound');
  });

  /* Dialer service */

  bridge.service('dialer')
    .listen(new BroadcastChannel('ps-channel'))
    .
  method('dial', (number, call) => {
    document.location.hash = '#dialer';
    if (call) {
      telephone.call(number);
      numberInput.value = '';
    } else {
      numberInput.value = number;
      numberInput.dataset.hasValue = numberInput.value.length !== 0;
    }
  });
})();