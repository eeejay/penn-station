(function() {
  var recentsModel = [];
  var recentsList = document.getElementById('recents-list');

  function formatTime(date) {
    var d = new Date(date);
    d.setMinutes(d.getMinutes() + Math.round(d.getSeconds()/60));
    d.setSeconds(0);
    return d.toLocaleTimeString(navigator.language, {hour: '2-digit', minute: '2-digit'});
  }

  recentsList.configure({
    getSectionName: function(item) {
      return item.day;
    }
  });

  fetch('/twilio/calls', { credentials: 'include' }).then(
    response => response.json()).then(calls => {
      var today = (new Date(Date.now())).toLocaleDateString();
      for (var call of calls.calls) {
        var direction = call.direction.split('-')[0];
        var contact =
          (direction == 'inbound' ? call.to_formatted : call.from_formatted) ||
          'unknown';
        var number = direction == 'inbound' ? call.to : call.from
        var call_time = new Date(call.date_created);
        var day = call_time.toLocaleDateString();
        console.log('yo?');
        recentsModel.push(
          { contact: contact,
            direction: direction,
            phonetype:'unknown',
            timestamp: call_time,
            day: day == today ? 'Today' : day,
            formatted_time: formatTime(call_time),
            number: number });
      }
      recentsList.setModel(recentsModel);
    });

    var dialer = bridge.client('dialer', new BroadcastChannel('ps-channel'));

    recentsList.addEventListener('click', e => {
      console.log(e.target);
      dialer.method('dial', e.target.dataset.number, true);
    });
})();