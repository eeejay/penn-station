/* globals bridge, phoneUtils */

'use strict';

importScripts('/bower/libphonenumber/dist/libphonenumber.js',
  '/bower/bridge/bridge.min.js');

let twilioInfoPromise = fetch('/twilio/info', { credentials: 'include' })
  .then(response => response.json());

bridge.service('phone-utils')
  .method('formatE164', number => {
    return twilioInfoPromise.then(info => {
      let region = phoneUtils.getRegionCodeForNumber(info.number);
      return phoneUtils.formatE164(number, region);
    });
  })
  .method('getTwilioInfo', () => twilioInfoPromise.then(info => info))
  .listen();
