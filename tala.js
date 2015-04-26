//
// # Comments
//

/* jslint node: true */
'use strict';

var hapi     = require('hapi');
var levelup  = require('levelup');
var path     = require('path');
var _        = require('lodash');
var api      = require('./api');
var SocketManager = require('./lib/socket');
var joi      = require('joi');

//
// ## Setup Configuration
//
var defaults = {
  port: 3000,
  db: path.join(__dirname, 'db'),
  cors: false,
  mail: false,
  domains: ['*']
};

var config = {};
try {
  config = require(path.join(__dirname, 'config.json'));
} catch (err) {}

config = _.defaults(config, defaults);

//
// ## Setup Database
//
var db = levelup(config.db, { valueEncoding: 'json' }, startServer);

//
// ## Configure Hapi
//
function startServer() {
  // Read CORS config
  var domains = config.domains || false;
  var cors    = domains ? { origin: config.domains } : true;

  // Create server
  var server = new hapi.Server({
    app: {
      db: function () {
        return db;
      }
    }
  });
  server.connection({ port: config.port });

  server.route([
    {
      path: '/js',
      method: 'GET',
      handler: api.js,
      config: {
        cache: {
          privacy: 'public',
          expiresIn: 24 * 3600 * 1000
        },
        cors: cors
      }
    },
    {
      path: '/comment',
      method: 'POST',
      handler: api.post,
      config: {
        cors: cors,
        payload: {
          output: 'data',
          parse: true
        },
        validate: {
          payload: {
            username: joi.string().min(1).max(32).required(),
            email: joi.string().email().required(),
            comment: joi.string().min(1).max(1024 * 3).required(),
            resource: joi.string().min(1).required(),
            url: joi.string().uri()
          }
        }
      }
    },
    {
      path: '/comments/{resource}',
      method: 'GET',
      handler: api.get,
      config: {
        cors: cors
      }
    }
  ]);

  // Register plugins
  var plugins = ['spam'];
  if (config.mail) {
    plugins.push('mail');
  }
  function registerPlugin(plugin, done) {
    if (!plugin) {
      done();
      return;
    }

    var module = require('./lib/' + plugin);
    var plug   = {
      name: plugin,
      version: '1.0.0',
      register: module.register
    };
    server.register(plug, config[plugin] || {}, function () {
      var next = plugins.shift();
      registerPlugin(next, done);
    });
  }

  registerPlugin(plugins.shift(), function () {
    server.start(function () {
      console.log('Server started on: %s', server.info.uri);
    });
  });

  /* jshint nonew: false */
  new SocketManager(server.listener, db);
}
