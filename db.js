var client;
if (process.env.REDIS_URL) {
  var redis = require('redis');
  client = redis.createClient(process.env.REDIS_URL);
} else {
  var level = require('level');
  client = level('.db', {valueEncoding: 'json'});
  client.hgetall = client.get;
  client.set = client.put;
  client.smembers = client.get;
  client.expire = (key, exp, cb) => {
    // no-op
    if (cb) {
      cb();
    }
  };

  client.hmset = (key, dict, cb) => {
    client.get(key, (err, result) => {
      if (!result) {
        client.put(key, dict, cb);
      } else {
        for (var k in dict) {
          result[k] = dict[k];
        }
        client.put(key, result, cb);
      }
    });
  };

  client.sadd = (key, item, cb) => {
    client.get(key, (err, result) => {
      if (!result) {
        client.put(key, [item], cb);
      } else {
        var s = new Set(result);
        s.add(item);
        client.put(key, Array.from(s), cb);
      }
    });
  };

  client.srem = (key, item, cb) => {
    client.get(key, (err, result) => {
      if (result) {
        var s = new Set(result);
        s.delete(item);
        client.put(key, Array.from(s), cb);
      } else if (cb) {
        cb();
      }
    });
  };
}

module.exports = client;
