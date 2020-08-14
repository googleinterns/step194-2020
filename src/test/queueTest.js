var assert = require('assert');
var mockQueue = require('../test/MockQueue.js');
const { parseTime } = require('../test/MockQueue.js');
var roomParameters;

describe('Verification', function() {
  describe('#verifyURLStructure(url)', function() {
    it('should return true if url is valid YT link', function() {
      assert.equal(true, mockQueue
          .verifyURLStructure('https://www.youtube.com/watch?v=BZFYXNxrWi0'));
    });
    it('should return false if url isn\'t valid YT link', function() {
      assert.equal(false, mockQueue.verifyURLStructure('google.com'));
    });
  });
});

describe('Time Parsing', function() {
  describe('#parseTime(duration)', function() {
    it('should return only hour with 0 seconds and minutes', function() {
      assert.equal('1:00:00', mockQueue.parseTime(3600));
    });
    it('should only return less than 10 minutes with 0 hours and seconds',
      function() {
        assert.equal('06:00', mockQueue.parseTime(360));
    });
    it('should only return minutes with 0 hours and seconds', function() {
        assert.equal('10:00', mockQueue.parseTime(600));
    });
    it('should only return less than 10 seconds with 0 hours and minutes',
      function() {
        assert.equal('00:05', mockQueue.parseTime(5));
    });
    it('should only return seconds with 0 hours and minutes', function() {
        assert.equal('00:12', mockQueue.parseTime(12));
    });
    it('should only return all zeroes', function() {
        assert.equal('00:05', mockQueue.parseTime(5));
    });
    it('should only return minutes and seconds', function() {
        assert.equal('01:20', mockQueue.parseTime(80));
    });
    it('should only return hours and seconds', function() {
        assert.equal('1:00:01', mockQueue.parseTime(3601));
    });
    it('should only return hours and minutes', function() {
        assert.equal('1:01:00', mockQueue.parseTime(3660));
    });
  });
});