//
// # WebSocket Manager
//

/* jslint node: true */
'use strict';

var ws  = require('ws');
var md5 = require('md5');

var SocketManager = module.exports = function (server, db) {
  this.channels = [];
  this.socket   = new ws.Server({ server: server });

  this.socket.on('connection', this.connection.bind(this));
  db.on('put', this.dbListener.bind(this));
};

//
// ## Register a connection
//
SocketManager.prototype.connection = function connection(client) {
  var self = this;
  client.on('close', function closeHandler() {
    self.close(client);
  });
  client.on('message', function messageHandler(msg) {
    self.message(client, msg);
  });
};

//
// ## Close
//
// A connection was closed. Unsubscribe from updates.
//
SocketManager.prototype.close = function close(connection) {
  for (var i in this.channels) {
    var index = this.channels[i].indexOf(connection);
    if (index != -1) {
      this.channels[i].splice(index, 1);
      if (this.channels[i].length === 0) {
        delete(this.channels[i]);
      }
      break;
    }
  }
};

//
// ## Recieved Message
//
// Got a message from the client. Currently only subscribe messages
// are supported.
//
SocketManager.prototype.message = function message(connection, msg) {
  try {
    var obj = JSON.parse(msg);
    if (obj.subscribe) {
      this.subscribe(obj.subscribe, connection);
    }
  }
  catch (err) {
    connection.send({ error: 'Invalid socket message.' });
  }
};

//
// ## Subscribe
//
// Add a client to a specific channel.
//
SocketManager.prototype.subscribe = function subscribe(channel, connection) {
  if (!this.channels[channel]) {
    this.channels[channel] = [];
  }

  this.channels[channel].push(connection);
};

//
// ## DB Listener
//
// Listen to events from the database and broadcast new comments.
//
SocketManager.prototype.dbListener = function (key, value) {
  var channel = this.channels[key.split('~')[0]];
  if (!channel) return;

  var i = channel.length - 1;
  for (i; i >= 0; i--) {
    // The email filtering should probably be in another layer.
    var client = channel[i];
    value.email = md5(value.email);
    client.send(JSON.stringify(value));
  }
};

