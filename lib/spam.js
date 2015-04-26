//
// # Spam
//
// Hapi plugin to prevent spam using Akismet.
//

/* jslint node: true */
'use strict';

var akismet = require('akismet');

module.exports.register = function (plugin, options, next) {
  if (!options.akismet) {
    console.log('******************');
    console.log('No Akismet key in config. Spam protection will be disabled.');
    console.log('******************');
    next();
    return;
  }

  var client = akismet.client(options.akismet);

  plugin.ext('onPreHandler', function (request, reply) {
    if (request.url.path !== '/comment' && request.method !== 'post') {
      reply();
      return;
    }

    var params = {
      user_ip: request.info.remoteAddress,
      user_comment: request.payload.comment,
      user_author: request.payload.username,
      referrer: request.info.referrer,
      user_agent: request.raw.req.headers['user-agent']
    };

    client.checkSpam(params, function (err, isSpam) {
      var code = 500;
      var resp = { success: false, message: '' };
      if (err) {
        resp.message = 'Failed to save comment.';
        console.log(err);
      } else if (isSpam) {
        resp.message = 'Comment rejected.';
      } else {
        code = 200;
        resp.success = true;
        resp.message = 'ya';
      }

      var response = reply(resp);
      response.code(code);
    });

    reply();
  });

  client.verifyKey(function (err, verified) {
    if (err) {
      next(err);
      return;
    }

    if (!verified) {
      err = new Error('Akismet key not authorized.');
      next(err);
      return;
    }

    next();
  });
};

module.exports.register.attributes = {
  name: 'spam',
  version: '1.0.0',
};
