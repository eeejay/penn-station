(function() {
  if (document.location.hash.length > 1) {
    document.body.dataset.tab = document.location.hash.substr(1);
  } else {
    document.body.dataset.tab = 'dialer';
  }

  addEventListener('hashchange', (e) => {
    document.body.dataset.tab = document.location.hash.substr(1);
  });

  bridge.service('view-manager').listen(new BroadcastChannel('ps-channel')).
    method('show', panel => {
      document.location.hash = '#' + panel;
    });
})();