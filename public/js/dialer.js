/* globals telephone, bridge , BroadcastChannel*/

'use strict';

(function () {
  var numberInput = document.querySelector('ps-dialer-input');
  var callButton = document.getElementById('call');
  var keypad = document.querySelector('ps-dialer-keypad');
  var acceptButton = document.getElementById('accept');
  var rejectButton = document.getElementById('reject');
  var hangupButton = document.getElementById('hangup');
  var callStatus = document.querySelector('#call-status h3');

  keypad.addEventListener('dialed', (evt) => {
    numberInput.value += evt.detail;
  });

  numberInput.displayFunction = value => {
    return window.utilsClient.method('formatForDisplay', value);
  };

  addEventListener('keypress', (evt) => {
    if (keypad.press(evt.key)) {
      evt.stopPropagation();
      evt.preventDefault();
    } else if (evt.key === 'Backspace') {
      numberInput.eraseDigit();
      evt.stopPropagation();
      evt.preventDefault();
    }
  }, true);

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
    .method('dial', (number, call) => {
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