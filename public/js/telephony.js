/* globals Twilio */

'use strict';

(function () {
  function WebPhone() {
    window.utilsClient.method('getTwilioInfo')
    .then(info => {
      this.info = info;
      Twilio.Device.setup(info.token);
    });
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
      this.ready.then(() => {
        window.utilsClient.method('formatE164', number)
          .then(formatted_number => {
            window.dispatchEvent(new CustomEvent('phone-outbound', {
              detail: {
                contact: formatted_number
              }
            }));
            Twilio.Device.connect({
              number: formatted_number,
              callerId: this.info.number
            });
          });
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