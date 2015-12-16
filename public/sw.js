/* globals clients */

'use strict';

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (e) => {
  postToAllClients(e);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  event.waitUntil(clients.matchAll({
      type: 'window'
    })
    .then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow)
        return clients.openWindow('/');
    }));
});

function postToAllClients(event) {
  var data = event.data ? event.data.json() : {};
  event.waitUntil(clients.matchAll({
      type: 'window'
    })
    .then(function (c) {
      var needNotification = true;
      for (var cl of c) {
        var url = new URL(cl.url);
        if (url.pathname == data.scope) {
          cl.postMessage(data);
          needNotification = cl.visibilityState !== 'visible';
          break;
        }
      }

      if (needNotification) {
          data);
        return self.registration.showNotification(data.data.from, {
          body: data.data.body,
          icon: '/resources/sms.png'
        });
      }
    }));
}