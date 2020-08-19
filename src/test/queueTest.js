/* eslint-disable */
let assert = require('assert');
let mockQueue = require('../test/MockQueue.js');

const queueVid1 = {
  title: 'FTC',
  channelName: 'Joji',
  id: 'test1',
  duration: 180,
}

const queueVid2 = {
  title: 'Don\'t Care',
  channelName: '88Rising',
  id: 'test2',
  duration: 220,
}

const queueVid3 = {
  title: 'Lose',
  channelName: '88Rising',
  id: 'test3',
  duration: 256,
}

const fakeVid = {
  title: 'FAKE',
  channelName: 'FAKECHANNEL',
  id: 'FAKEID',
  duration: -1,
}

describe('Add', function() {
  describe('#addToQueue(video)', function() {
    it('should return false if given bad id', function() {
      assert.equal(false, mockQueue.queue.addToQueue(fakeVid))
    });
    it('should return the queue with one video added', function() {
      const result = new Array();
      mockQueue.queue.initialize();
      result.push(queueVid1);
      assert.equal(result.toString(), mockQueue.queue
          .addToQueue(queueVid1).toString());
      mockQueue.queue.clearQueue();
    });
    it('should return the queue with two videos added', function() {
      const result = new Array();
      mockQueue.queue.initialize();
      result.push(queueVid1);
      result.push(queueVid2);
      mockQueue.queue.addToQueue(queueVid1);
      assert.equal(result.toString(), mockQueue.queue
          .addToQueue(queueVid2).toString());
      mockQueue.queue.clearQueue();
    })
  });
});

describe('Remove', function() {
  describe('#removeVideo(video)', function() {
    it('should return false if the video isn\'t in the queue', function() {
      assert.equal(false, mockQueue.queue.removeVideo(queueVid2));
    });
    it('should return the queue if video was removed', function() {
      mockQueue.queue.addToQueue(queueVid1);
      assert.equal(new Array().toString(), mockQueue.queue.removeVideo(queueVid1).toString());
      mockQueue.queue.clearQueue();
    })
  })
})

describe('GetData', function() {
  describe('#getVideoData(id)', function() {
    it('should return false if given empty id', function() {
      assert.equal(false, mockQueue.queue.getVideoData(''));
    });
    it('should return video object if given id is real', function() {
      mockQueue.queue.initialize();
      mockQueue.queue.addToQueue(queueVid3);
      assert.equal(queueVid3.toString(), mockQueue.queue.getVideoData(queueVid3.id));
      mockQueue.queue.clearQueue();
    });
    it('should return false if id isn\'t found', function() {
      assert.equal(false, mockQueue.queue.getVideoData('BAD ID'));
    });
  });
});

describe('Verification', function() {
  describe('#verifyURLStructure(url)', function() {
    it('should return true if url is valid YT link', function() {
      assert.equal(true, mockQueue.queue
          .verifyURLStructure('https://www.youtube.com/watch?v=BZFYXNxrWi0'));
    });
    it('should return false if url isn\'t valid YT link', function() {
      assert.equal(false, mockQueue.queue.verifyURLStructure('google.com'));
    });
  });
});

describe('Time Parsing', function() {
  describe('#parseTime(duration)', function() {
    it('should return only hour with 0 seconds and minutes', function() {
      assert.equal('1:00:00', mockQueue.queue.parseTime(3600));
    });
    it('should only return less than 10 minutes with 0 hours and seconds',
        function() {
          assert.equal('06:00', mockQueue.queue.parseTime(360));
        });
    it('should only return minutes with 0 hours and seconds', function() {
        assert.equal('10:00', mockQueue.queue.parseTime(600));
    });
    it('should only return less than 10 seconds with 0 hours and minutes',
        function() {
          assert.equal('00:05', mockQueue.queue.parseTime(5));
        });
    it('should only return seconds with 0 hours and minutes', function() {
        assert.equal('00:12', mockQueue.queue.parseTime(12));
    });
    it('should only return all zeroes', function() {
        assert.equal('00:05', mockQueue.queue.parseTime(5));
    });
    it('should only return minutes and seconds', function() {
        assert.equal('01:20', mockQueue.queue.parseTime(80));
    });
    it('should only return hours and seconds', function() {
        assert.equal('1:00:01', mockQueue.queue.parseTime(3601));
    });
    it('should only return hours and minutes', function() {
        assert.equal('1:01:00', mockQueue.queue.parseTime(3660));
    });
  });
});