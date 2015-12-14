(function() {
  function WebPhone() {
    Twilio.Device.setup(TWILIO_TOKEN);
    this.ready = new Promise((resolve, reject) => {
      Twilio.Device.ready(resolve);
    });

    Twilio.Device.connect((conn) => {
      console.log('connect');
      dispatchEvent(new CustomEvent("phone-connect"));
    });

    Twilio.Device.disconnect(() => {
      console.log('disconnect');
      dispatchEvent(new CustomEvent("phone-disconnect"));
    });

    Twilio.Device.incoming((connection) => {
      this.incomingConnection = connection;
      console.log('incoming from', connection.parameters.From);
      dispatchEvent(new CustomEvent("phone-inbound",
        { detail: { contact: connection.parameters.From } }));
    });
  }

  WebPhone.prototype = {
    call: function(number) {
      var formatedNumber = phoneUtils.formatE164(
        number, phoneUtils.getRegionCodeForNumber(TWILIO_NUMBER));
      dispatchEvent(new CustomEvent("phone-outbound",
        { detail: { contact: formatedNumber } }));
      Twilio.Device.connect(
        {number: formatedNumber, callerId: TWILIO_NUMBER});
    },

    hangup: function() {
      console.log('hangup');
      Twilio.Device.disconnectAll();
    },

    accept: function() {
      console.log('accept');
      if (this.incomingConnection) {
        this.incomingConnection.accept();
        this.incomingConnection = null;
      }
    },

    reject: function() {
      console.log('reject');
      if (this.incomingConnection) {
        this.incomingConnection.reject();
        this.incomingConnection = null;
      } else {
        this.hangup();
      }
    }
  };

  window.telephone = new WebPhone();
})();