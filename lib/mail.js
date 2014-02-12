//
// # Mailer
//
// Send an email when a comment is recieved.
//

/* jslint node: true */
'use strict';

var mailer = require('nodemailer');

module.exports.register = function (plugin, options, next) {
  var t = options.transport.toUpperCase() || 'SMTP';
  var transport = mailer.createTransport(t, options);

  plugin.expose('send', function (subject, msg, callback) {
    var mailOptions = {
      from: options.auth.user,
      to: options.auth.user,
      subject: subject,
      text: msg
    };

    transport.sendMail(mailOptions, callback);
  });
  next();
};

