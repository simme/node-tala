/* globals suite, test */
/* jshint node: true */
'use strict';
var assert = require('assert');
var xss    = require('./../lib/xss');

// Attack vectors copied from https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
//var vectors = require('fs').readFileSync(__dirname + '/tests.txt', 'utf8');

suite('XSS', function () {
  test('Correctly removes non whitelisted tags.', function (done) {
    var html = '<a href="foobar"><script>alert("HEJSAN!");</script><p class="foo">good stuff</p>';
    xss(html, function (err, cleaned) {
      assert(!err);
      assert.equal(cleaned, '<a href="foobar" rel="nofollow"><p>good stuff</p></a>');
      done();
    });
  });

  // @FIXME
  //test('Passes every test in tests.txt', function (done) {
  //  var tests = vectors.split('\n\n');
  //  function t(vector, passed, fn) {
  //    if (!vector) {
  //      fn();
  //      return;
  //    }

  //    xss(vector, function (err, cleaned) {
  //      assert.equal(cleaned, passed);
  //      var parts = tests.shift().split('\n');
  //      t(parts[0], parts[1], fn);
  //    });
  //  }

  //  var parts = tests.shift().split('\n');
  //  t(parts[0], parts[1], done);
  //});
});
