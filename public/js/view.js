(function() {
  var viewManager = bridge.client('view-manager', new BroadcastChannel('ps-channel'));
  addEventListener('focus', evt => {
    viewManager.method('show', document.location.pathname.substr(1));
  });
})();