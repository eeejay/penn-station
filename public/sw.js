self.addEventListener('install', function(event) {
  console.log('install');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  console.log('activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.indexOf('foo') > -1) {
    event.respondWith(new Response('HI, LOSER!!'));
  } else {
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('push', (e) => {
  postToAllClients(e);
});

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  event.notification.close();

  event.waitUntil(clients.matchAll({ type: "window" }).then(function(clientList) {
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
  console.log('postToAllClients!!');
  var data = event.data ? event.data.json() : {};
  event.waitUntil(clients.matchAll({type: "window"}).then(function(c) {
    var needNotification = true;
    for (var cl of c) {
      var url = new URL(cl.url);
      console.log('client', cl.url, cl.visibilityState, cl.focused);
      if (url.pathname == data.scope) {
        console.log('posted!!');
        cl.postMessage(data);
        needNotification = cl.visibilityState !== 'visible';
        break;
      }
    }

    if (needNotification) {
      console.log('nothing active, so I am going to send a notificaiton.', data);
      return self.registration.showNotification(data.data.from, {
        body: data.data.body,
        icon: '/resources/sms.png'
      });
    }
  }));
}