/* globals Twilio, TWILIO_NUMBER, TWILIO_TOKEN, phoneUtils */

'use strict';

(function () {
  function WebPhone() {
    Twilio.Device.setup(TWILIO_TOKEN);
    this.ready = new Promise((resolve, reject) => {
      Twilio.Device.ready(resolve);
    });

    Twilio.Device.offline((conn) => {
    });

    Twilio.Device.error((err) => {
    });

    Twilio.Device.connect((conn) => {
      window.dispatchEvent(new CustomEvent('phone-connect'));
    });

    Twilio.Device.disconnect(() => {
      window.dispatchEvent(new CustomEvent('phone-disconnect'));
    });

    Twilio.Device.incoming((connection) => {
      this.incomingConnection = connection;
      window.dispatchEvent(new CustomEvent('phone-inbound', {
        detail: {
          contact: connection.parameters.From
        }
      }));
    });
  }

  WebPhone.prototype = {
    call: function (number) {
      var formatedNumber = phoneUtils.formatE164(
        number, phoneUtils.getRegionCodeForNumber(TWILIO_NUMBER));
      window.dispatchEvent(new CustomEvent('phone-outbound', {
        detail: {
          contact: formatedNumber
        }
      }));
      Twilio.Device.connect({
        number: formatedNumber,
        callerId: TWILIO_NUMBER
      });
    },

    hangup: function () {
      Twilio.Device.disconnectAll();
    },

    accept: function () {
      if (this.incomingConnection) {
        this.incomingConnection.accept();
        this.incomingConnection = null;
      }
    },

    reject: function () {
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