/* globals bridge, BroadcastChannel, smsNotificationSound */

'use strict';

(function () {
  var threadsModel = [];
  var threadsMap = new Map();

  var threadsList = document.getElementById('threads-list');
  var convoView = document.getElementById('conversation');
  var inboxView = document.getElementById('inbox');
  var convoList = document.querySelector('#conversation .message-list ul');
  var convoInput = document.querySelector('.compose input');
  var convoButton = document.querySelector('.compose button');
  var toInput = document.querySelector('.to input');

  var psChannel = new BroadcastChannel('ps-channel');
  var dialerClient = bridge.client('dialer', psChannel);

  function formatTime(date) {
    var d = new Date(date);
    d.setMinutes(d.getMinutes() + Math.round(d.getSeconds() / 60));
    d.setSeconds(0);
    return d.toLocaleTimeString(navigator.language, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function resetConvoView() {
    convoView.dataset.threadId = '';
    convoInput.value = '';
    convoButton.disabled = true;
    toInput.value = '';
    convoList.innerHTML = '';
    for (var li of document.querySelectorAll('#threads-list li.selected')) {
      li.classList.remove('selected');
    }
  }

  function markThreadAsRead(thread) {
    if (thread.status == 'read') return;
    var messages = thread.messages.map(m => m.sid);
    var data = new FormData();
    data.append('application/json', JSON.stringify({
      messages: messages
    }));
    fetch('/messages/mark-read', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messages)
      })
      .then(() => {
        thread.status = 'read';
        // Horrible shortcut, should really change model
        var elem = document.querySelector(
          '#threads-list li > a[data-thread=\'' + thread.thread_id + '\']');
        elem.parentNode.classList.remove('unread');
        elem.parentNode.classList.add('read');
      });
  }

  threadsList.configure({
    getSectionName: function (item) {
      return item.day;
    }
  });

  function addMessageToThreads(message, today, latestMessage) {
    var thread = threadsMap.get(message.thread_id);
    var messageDate = new Date(message.date_created);
    var day = messageDate.toLocaleDateString();
    var unread =
      typeof (message.unread) == 'string' ? (message.unread == 'true') :
      message.unread;
    if (thread) {
      thread.messages[latestMessage ? 'push' : 'unshift'](message);
      thread.status =
        thread.status == 'read' && unread ? 'unread' : thread.status;
      if (latestMessage) {
        thread.last_message_body = message.body;
        thread.last_message_time = formatTime(messageDate);
        thread.day = day == today ? 'Today' : day;
        threadsModel.splice(threadsModel.indexOf(thread), 1);
        threadsModel.unshift(thread);
      }
    } else {
      thread = {
        thread_id: message.thread_id,
        messages: [message],
        contact: message.direction == 'inbound' ? message.from : message.to,
        last_message_time: formatTime(messageDate),
        last_message_body: message.body,
        day: day == today ? 'Today' : day,
        status: unread ? 'unread' : 'read'
      };
      threadsMap.set(thread.thread_id, thread);
      threadsModel[latestMessage ? 'unshift' : 'push'](thread);
    }

    return thread;
  }

  function addMessageToConversation(message) {
    var li = document.createElement('li');
    li.classList.add(message.direction);
    li.dataset.icon = 'user';
    li.dataset.l10nId = 'ignore';
    var p = document.createElement('p');
    p.textContent = message.body;
    li.appendChild(p);
    var details = document.createElement('div');
    details.classList.add('details');
    var span = document.createElement('span');
    span.textContent = formatTime(new Date(message.date_created));
    details.appendChild(span);
    li.appendChild(details);
    convoList.appendChild(li);
    return li;
  }

  fetch('/messages/list', {
      credentials: 'include'
    })
    .then(
      response => response.json())
    .then(messages => {
      var today = (new Date(Date.now()))
        .toLocaleDateString();
      for (var message of messages) {
        addMessageToThreads(message, today);
      }
      threadsList.setModel(threadsModel);
    });

  threadsList.addEventListener('click', (evt) => {
    if (evt.target.dataset.thread) {
      setViewToThread(threadsMap.get(evt.target.dataset.thread));
    }
  });

  convoView.querySelector('.onecolumn gaia-header')
    .addEventListener('action', () => {
      convoView.classList.remove('active');
      inboxView.classList.add('active');
    });

  function callContact() {
    var thread = threadsMap.get(convoView.dataset.threadId);
    if (thread) {
      dialerClient.method('dial', thread.contact, true);
    }
  }

  for (var callbutton of document.querySelectorAll('a[data-icon=\'call\']')) {
    callbutton.addEventListener('click', callContact);
  }

  document.querySelector('a[data-icon=\'compose\']')
    .addEventListener('click', () => {
      resetConvoView();
      convoView.querySelector('gaia-header h1')
        .textContent = 'New Message';
      convoView.classList.add('active');
      inboxView.classList.remove('active');
    });

  convoView.addEventListener('input', () => {
    convoButton.disabled = !(convoInput.value &&
      (!convoView.dataset.threadId || toInput.value));
  });

  convoButton.addEventListener('click', sendMessage);
  convoInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  function setViewToThread(thread) {
    resetConvoView();
    convoView.dataset.threadId = thread.thread_id;
    convoView.querySelector('gaia-header h1')
      .textContent = thread.contact;
    markThreadAsRead(thread);
    var lastMessage;
    for (var message of thread.messages) {
      lastMessage = addMessageToConversation(message);
    }
    convoList.parentNode.scrollTop = convoList.parentNode.scrollTopMax;
    convoView.classList.add('active');
    inboxView.classList.remove('active');
    var elem = document.querySelector('#threads-list li > a[data-thread=\'' +
      thread.thread_id + '\']');
    elem.parentNode.classList.add('selected');
  }

  function sendMessage(msg) {
    var thread = threadsMap.get(convoView.dataset.threadId);
    let formatPromise;
    var message = {
      body: convoInput.value
    };
    convoInput.value = '';

    if (!thread) {
      formatPromise = window.utilsClient.method('formatE164', toInput.value);
    } else {
      formatPromise = Promise.resolve(thread.contact);
      message.thread_id = thread.thread_id;
    }

    return formatPromise.then(formattedNumber => {
      message.to = formattedNumber;
      return fetch('/messages/send', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        })
        .then(response => response.json())
        .then(msg => {
          messageHandler(msg)
            .then(newThread => {
              if (!thread) {
                setViewToThread(newThread);
              }
              convoList.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
              });
              smsNotificationSound.outgoing();
            });
        });
      });
  }

  function messageHandler(msg) {
    var today = (new Date(Date.now()))
      .toLocaleDateString();
    var thread = addMessageToThreads(msg, today, true);
    var p = threadsList.setModel(threadsModel);
    if (convoView.classList.contains('active') &&
      convoView.dataset.threadId == thread.thread_id) {
      addMessageToConversation(msg);
      requestAnimationFrame(() => {
        convoList.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      });
      markThreadAsRead(thread);
    }

    return p.then(() => thread);
  }
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      navigator.serviceWorker.addEventListener('message', (e) => {
        messageHandler(e.data.data)
          .then(() => {
            smsNotificationSound.incoming();
          });
      });
      return subscribeOrResubscribePush(registration);
    })
    .catch(e => {
    });

  function updateEndpoint(sub, remove) {
    var key = sub.getKey('p256dh');
    var payload = {
      url: sub.endpoint,
      remove: remove || false,
      key: btoa(String.fromCharCode.apply(null, new Uint8Array(key)))
    };

    return fetch('/push-endpoint', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }

  function subscribeOrResubscribePush(registration) {
    return registration.pushManager.getSubscription()
      .then(subscription => {
        if (subscription) {
          return updateEndpoint(subscription, true)
            .then(() => {
              return subscription.unsubscribe()
                .then(() => {
                  return registration.pushManager.subscribe()
                    .then((sub) => {
                      return updateEndpoint(sub);
                    });
                });
            });
        } else {
          return registration.pushManager.subscribe()
            .then((sub) => {
              return updateEndpoint(sub);
            });
        }
      });
  }
})();