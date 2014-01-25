//
// # Comments
//

/* jslint node: true */
'use strict';

var hapi     = require('hapi');
var levelup  = require('levelup');
var path     = require('path');
var _        = require('lodash');
var ws       = require('ws');
var api      = require('./api');
var md5      = require('md5');

//
// ## Setup Configuration
//
var defaults = {
  port: 3000,
  db: path.join(__dirname, 'db')
};

var config = {};
try {
  config = require('./config.json');
} catch (err) {}

config = _.defaults(config, defaults);

//
// ## Setup Database
//
var db = levelup(config.db, { valueEncoding: 'json' }, startServer);

//
// ## Configure Hapi
//
// @TODO: Configure CORS
//
function startServer() {
  var server = new hapi.Server(defaults.port, {
    app: {
      db: function () {
        return db;
      }
    }
  });

  server.route([
    {
      path: '/js',
      method: 'GET',
      handler: api.js,
    },
    // @FIXME: Validate payload.
    {
      path: '/comment',
      method: 'POST',
      handler: api.post,
      config: {
        payload: {
          output: 'data',
          parse: true
        }
      }
    },
    {
      path: '/comments/{resource}',
      method: 'GET',
      handler: api.get,
    }
  ]);

  server.start(function () {
    console.log('Server listening on port: ', config.port);
  });

  var socket = new ws.Server({ server: server.listener });

  socket.on('connection', function (socket) {
    socket.on('message', function (msg) {
      var obj = JSON.parse(msg);
      if (obj.subscribe) {
        socket.__channel = obj.subscribe;
        subscribe(obj.subscribe, socket);
      }
    });

    socket.on('close', function () {
      unsubscribe(socket.__channel, socket);
    });
  });
}

//
// ## Socket API
//
// @TODO: Wrap up in container "class".
//
var channels = {};
function subscribe(channel, client) {
  if (!channels[channel]) {
    channels[channel] = [];
  }

  channels[channel].push(client);
}

// @TODO: Make sure this works with lots of connections...
function unsubscribe(channel, client) {
  if (channels[channel]) {
    for (var i in channels[channel]) {
      if (channels[channel][i] === client) {
        channels[channel].splice(i, 1);
      }
    }
  }
}

db.on('put', function (key, value) {
  var channel = channels[key.split('~')[0]];
  if (!channel) return;

  // @TODO: Filter emails
  var i = channel.length - 1;
  for (i; i >= 0; i--) {
    var client = channel[i];
    value.email = md5(value.email);
    client.send(JSON.stringify(value));
  }
});

