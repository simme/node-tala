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
var sm       = require('./lib/socket');

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
    },
    cors: true
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

  var socketManager = new sm(server.listener, db);
}

