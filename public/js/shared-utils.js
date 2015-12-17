/* globals bridge, phoneUtils */

'use strict';

importScripts('/bower/libphonenumber/dist/libphonenumber.js',
  '/bower/bridge/bridge.min.js');

let getTwilioInfo = fetch('/twilio/info', { credentials: 'include' })
  .then(response => response.json());

let getRegion = getTwilioInfo.then(info => {
  return phoneUtils.getRegionCodeForNumber(info.number);
});

bridge.service('phone-utils')
  .method('formatE164', number => {
    return getRegion.then(region => {
      return phoneUtils.formatE164(number, region);
    });
  })
  .method('formatForDisplay', number => {
    if (number.startsWith('+')) {
      try {
        return phoneUtils.formatInternational(number);
      } catch (e) {
        return number;
      }
    } else {
      return getRegion.then(region => {
        try {
          return phoneUtils.formatNational(number, region);
        } catch (e) {
          return number;
        }
      });
    }
  })
  .method('getTwilioInfo', () => getTwilioInfo)
  .listen();
