/* globals bridge, BroadcastChannel */

'use strict';

(function () {
  var viewManager = bridge.client('view-manager', new BroadcastChannel(
    'ps-channel'));
  addEventListener('focus', evt => {
    viewManager.method('show', document.location.pathname.substr(1));
  });

  window.utilsClient = bridge.client('phone-utils',
    new SharedWorker('/js/shared-utils.js'));
})();