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
var xss      = require('./lib/xss');
var uglify   = require('uglify-js2');

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
  ].map(function (item) {
    return path.join(assetPath, item);
  });

  //var minified = uglify.minify(files);
  //reply(minified.code)
  //  .type('text/javascript');

  var data = [];
  function loadFile(file, cb) {
    if (!file) {
      cb(null, data);
      return;
    }

    fs.readFile(file, 'utf8', function (err, txt) {
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
  //*/
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

  var keys = ['username', 'email', 'comment', 'resource', 'url'];
  function protectXSS(_key, done) {
    if (typeof data[_key] !== 'string') {
      _key = keys.shift();
    }

    if (!_key) {
      done();
      return;
    }

    xss(data[_key], {}, function (err, value) {
      if (err) {
        done(err);
        return;
      }

      data[_key] = value;
      protectXSS(keys.shift(), done);
    });
  }

  function doneFiltering(err) {
    if (err) {
      var response = reply({
        success: false,
        message: 'Content filter failed.'
      });
      response.code(500);
      return;
    }

    var key = [namespace, data.timestamp].join('~');
    var db = request.server.settings.app.db();
    db.put(key, data, {}, function (err) {
      var response = reply({
        success: !!!err,
        message: err ? err.message : 'comment saved'
      });
      response.code(!!!err ? 200 : 500);


      if (response.statusCode === 200) {
        if (request.server.plugins.mail) {
          request.server.plugins.mail.send(
            'New comment!',
            [
              'A new comment has been posted on your blog!',
              'The comment was posted by: ' + data.username,
              'The users email is: ' + data.email,
              'Contents of the comment were: ' + data.comment,
              'The message can be viewd at: ' + data.url
            ].join('\n')
          );
        }
      }
    });
  }

  protectXSS(keys.shift(), doneFiltering);
};

//
// ## Get Comments
//
// Get comments for the specified resource.
//
// @TODO: Might need pagination.
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

