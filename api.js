//
// # API
//
// The exposed route handlers.
//

/* jslint node: true */
'use strict';

var API = module.exports = {};

var fs       = require('fs');
var path     = require('path');
var jstream  = require('JSONStream');
var _        = require('lodash');
var md5      = require('MD5');
var comments = require('./lib/commentstream');

//
// ## JavaScript
//
// Serves JavaScript resources.
//
// @TODO: Add versioning
//
API.js = function js(request, reply) {
  var assetPath = path.join(__dirname, 'assets', 'js');
  var files = [
    'client.js'
  ];

  var data = [];
  function loadFile(file, cb) {
    if (!file) {
      cb(null, data);
      return;
    }

    fs.readFile(path.join(assetPath, file), 'utf8', function (err, txt) {
      if (err) {
        cb(err);
        return;
      }

      data.push(txt);
      loadFile(files.shift(), cb);
    });
  }

  loadFile(files.shift(), function (err, data) {
    reply(data.join('\n'))
      .type('text/javascript');
  });
};

//
// ## Post Comment
//
// Saves a comment to the database.
//
API.post = function postComment(request, reply) {
  var data = request.payload;
  data.timestamp = Date.now();
  var namespace = data.resource;
  delete(data.namespace);

  var key = [namespace, data.timestamp].join('~');
  var db = request.server.settings.app.db();
  db.put(key, data, {}, function (err) {
    var response = reply({
      success: !!!err,
      message: err ? err.message : 'comment saved'
    });
    response.code(!!!err ? 200 : 500);
  });
};

//
// ## Get Comments
//
// Get comments for the specified resource.
//
// @TODO: Might need pagination.
// @TODO: Hide user emails.
//
API.get = function getComments(request, reply) {
  var key = request.params.resource;
  var db = request.server.settings.app.db();
  var stream = db.createReadStream({
    start: key,
    end: key + '\xFF'
  });

  var responseStream = jstream.stringify();
  var commentStream  = new comments();
  stream.pipe(commentStream).pipe(responseStream);

  var response = reply(responseStream)
    .type('application/json');
};

