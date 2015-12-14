'use strict';

(function () {
  function smsNotificationSound () {
    this.context = new AudioContext();
    this._incomingSound = this._loadSound('/resources/notifier_chime.opus');
    this._outgoingSound = this._loadSound('/resources/notifier_plickle.opus');
  }

  smsNotificationSound.prototype = {
    _loadSound: function(uri) {
      return fetch(uri).then(response => response.arrayBuffer()).then(array_buffer => {
        return new Promise((resolve, reject) => {
          this.context.decodeAudioData(array_buffer, function(buffer) {
            resolve(buffer);
          });
        });
      });
    },

    _play: function(soundPromise) {
      soundPromise.then(buffer => {
        var source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start(0);
      });
    },

    incoming: function() {
      this._play(this._incomingSound);
    },

    outgoing: function() {
      this._play(this._outgoingSound);
    }
  };

  try {
    window.smsNotificationSound = new smsNotificationSound();
  } catch(e) {
    console.warn(e);
  }
})();