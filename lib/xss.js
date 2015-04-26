//
// # XSS
//
// Filter XSS using JSDOM.
//

/* jslint node: true */
'use strict';

var jsdom = require('jsdom');
var url   = require('url');

// Default options
module.exports = function filter(html, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options  = {};
  }

  var whitelist = options.whitelist || module.exports.defaultWhitelist;
  var nofollow  = options.nofollow  || module.exports.noFollowLinks;
  var attrs     = options.attrs     || module.exports.attributeOK;

  jsdom.env({
    html: html,
    done: function (err, window) {
      if (err) {
        callback(err);
        return;
      }

      var body = window.document.getElementsByTagName('body')[0];
      var all = body.getElementsByTagName('*');
      for (var i = all.length - 1; i >= 0; i--) {
        var e   = all[i];
        var tag = e.tagName.toLowerCase();

        // Remove unwanted tags
        if (whitelist.indexOf(tag) === -1) {
          e.parentNode.removeChild(e);
        }

        // Remove unwanted attributes
        for (var j = e.attributes.length - 1; j >= 0; j--) {
          var attr = e.attributes[j];
          if (attr.specified && attrs.indexOf(attr.name) === -1) {
            e.removeAttribute(attr.name);
          }

          // Also validate any href attribute, only allow http protocols.
          if (attr.name === 'href') {
            var parsed = url.parse(attr.value);
            var regex = /^https?:$/;
            if (parsed.protocol && !regex.test(parsed.protocol)) {
              e.removeAttribute('href');
            }
          }
        }

        // Add rel="nofollow" to links
        if (nofollow) {
          if (tag === 'a') {
            e.setAttribute('rel', 'nofollow');
          }
        }
      }

      var result = body.innerHTML;
      callback(null, result);
    }
  });
};

module.exports.defaultWhitelist = ['a', 'p', 'strong', 'em', 'b', 'i'];
module.exports.attributeOK      = ['href'];
module.exports.noFollowLinks    = true;
