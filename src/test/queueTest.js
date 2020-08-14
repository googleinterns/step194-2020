var assert = require('assert');
var queue = require('../main/webapp/queue.js');
var roomParamaters;

describe('Verification', function() {
  describe('#verifyURLSTructure(url)', function() {
    it('should return true if url is valid YT link', function() {
      assert.equal(true, queue.verifyURLStructure('https://www.youtube.com/watch?v=BZFYXNxrWi0'));
    });
    it('should return false if url isn\'t valid YT link', function() {
      assert.equals(false, queue.verifyURLSTructure('google.com'));
    });
  });
});