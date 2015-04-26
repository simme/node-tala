//
// # Comment Stream
//
// Stream LevelDB read streams trough this to make data transforms before
// sending data to the client.
//

/* jslint node: true */
'use strict';

var inherit   = require('util').inherits;
var Transform = require('stream').Transform;
var md5       = require('MD5');

var CommentStream = module.exports = function () {
  if (!(this instanceof CommentStream)) {
    return new CommentStream();
  }

  Transform.call(this, { objectMode: true });
};

inherit(CommentStream, Transform);

CommentStream.prototype._transform = function _transform(chunk, encoding, done) {
  chunk.value.email = md5(chunk.value.email);
  this.push(chunk);
  done();
};
