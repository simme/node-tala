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
  db: path.join(__dirname, 'db'),
  cors: false
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
  var cors    = domains ? { origin: domains } : false;

  // Create server
  var server = new hapi.Server(config.port, {
    app: {
      db: function () {
        return db;
      }
    },
    cors: cors
  });

  var joi = hapi.types;
  server.route([
    {
      path: '/js',
      method: 'GET',
      handler: api.js,
      config: {
        cache: {
          privacy: 'public',
          expiresIn: 24 * 3600 * 1000
        }
      }
    },
    {
      path: '/comment',
      method: 'POST',
      handler: api.post,
      config: {
        payload: {
          output: 'data',
          parse: true
        },
        validate: {
          // @TODO: Make comment length configurable?
          payload: {
            username: joi.string().min(1).max(32),
            email: joi.string().email(),
            comment: joi.string().min(1).max(1024*3),
            resource: joi.string().min(1)
          }
        }
      }
    },
    {
      path: '/comments/{resource}',
      method: 'GET',
      handler: api.get,
    }
  ]);

  // Register plugins
  var plugins = ['spam'];
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
    server.pack.register(plug, config[plugin] || {}, function () {
      var next = plugins.shift();
      registerPlugin(next, done);
    });
  }

  registerPlugin(plugins.shift(), function () {
    server.start(function () {
      console.log('Server listening on port: ', config.port);
    });
  });

  var socketManager = new sm(server.listener, db);
}

