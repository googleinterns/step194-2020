let assert = require('assert'); // eslint-disable-line no-undef
let autoUpdateTriggered = false;

// Resets all mocks
function reset() {
  player.reset();
  doc.reset();
  queueCollection.reset();
  thumbnailDisplay = 'none';
  vidDisplay = 'block';
  justJoined = true;
  nextVidID = '';
  nextThumbnail = '';
  nextDocID = '';
}

// player mock
const player = {
  playerState: 5,
  playbackRate: 1,
  timestamp: 0,
  duration: 60,
  videoPlaying: '',
  getPlaybackRate: function() {
    return this.playbackRate;
  },
  setPlaybackRate: function(newRate) {
    this.playbackRate = newRate;
  },
  getPlayerState: function() {
    return this.playerState;
  },
  playVideo: function() {
    this.playerState = 1;
  },
  pauseVideo: function() {
    this.playerState = 2;
  },
  bufferVideo: function() {
    this.playerState = 3;
  },
  endVideo: function() {
    this.playerState = 0;
  },
  seekTo: function(newTime, x) {
    this.timestamp = newTime;
    if (this.timestamp >= this.duration) {
      this.endVideo();
      this.timestamp = 0;
    }
  },
  getCurrentTime: function() {
    return this.timestamp;
  },
  getDuration: function() {
    return this.duration;
  },
  reset: function() {
    this.playerState = 5;
    this.playbackRate = 1;
    this.timestamp = 0;
    this.duration = 60;
    this.videoPlaying = '';
  },
};

// playback firestore mock
const doc = {
  docData: {
    timestamp: 0,
    isPlaying: false,
    videoSpeed: 1,
    videoId: '',
    numPeopleWatching: 0,
  },
  data: function() {
    return this.docData;
  },
  addViewer: function() {
    this.docData.numPeopleWatching++;
  },
  removeViewer: function() {
    this.docData.numPeopleWatching--;
  },
  update: function(x) {
    if (x.timestamp || x.timestamp === 0) {
      doc.docData.timestamp = x.timestamp;
    }
    if (x.videoSpeed) {
      doc.docData.videoSpeed = x.videoSpeed;
    }
    if (x.isPlaying || x.isPlaying === false) {
      doc.docData.isPlaying = x.isPlaying;
    }
    if (x.numPeopleWatching || x.numPeopleWatching === 0) {
      doc.docData.numPeopleWatching = x.numPeopleWatching;
    }
    if (x.videoId || x.videoId === '') {
      doc.docData.videoId = x.videoId;
    }
  },
  changeFirestore: function(timestamp, videoSpeed, isPlaying) {
    doc.docData.timestamp = timestamp;
    doc.docData.videoSpeed = videoSpeed;
    doc.docData.isPlaying = isPlaying;
  },
  reset: function() {
    this.docData = {
      timestamp: 0,
      isPlaying: false,
      videoSpeed: 1,
      videoId: '',
      numPeopleWatching: 0
    }
  },
};

// queue firestore mock
const queueCollection = {
  queueDocs: [],
  addToQueue: function(iD, thumbnail) {
    const vidToAdd = {videoId: iD, videoThumbnail: thumbnail};
    this.queueDocs.push(vidToAdd);
  },
  delete: function() {
    this.queueDocs.shift();
  },
  data: function() {
    if (this.queueDocs.length === 0) return null;
    return this.queueDocs[0];
  },
  reset: function() {
    this.queueDocs = [];
  },
};

function catchUpAsserts(time, speed, state) {
  assert.equal(player.timestamp, time);
  assert.equal(player.playbackRate, speed);
  assert.equal(player.playerState, state);
  assert.equal(player.videoPlaying, 'ExampleVideo');
  assert.equal(doc.data().numPeopleWatching, 1);
}

describe('Catch Up on Start', function() { // eslint-disable-line no-undef
  it('should catch up to paused firestore when first played',
      function() { // eslint-disable-line no-undef
    doc.changeFirestore(10, 1.5, false); // timestamp, videoSpeed, isPlaying
    queueCollection.addToQueue('ExampleVideo', '"ExampleThumbnail"');
    updateQueue();
    onPlayerReady();
    player.playVideo();
    onPlayerStateChange(); // Play state change
    onPlayerStateChange(); // Pause state change
    catchUpAsserts(10, 1.5, 2);
    assert(!autoUpdateTriggered);
    clearInterval(pauseInterval);
  });

  it('should move a bit ahead of playing firestore when first played',
      function() { // eslint-disable-line no-undef
    reset();
    doc.changeFirestore(20, 0.5, true); // playing at 20 sec, half speed
    queueCollection.addToQueue('ExampleVideo', '"ExampleThumbnail"');
    updateQueue();
    onPlayerReady();
    player.playVideo();
    onPlayerStateChange(); // play state change
    const seekAhead = 20 + SYNC_WINDOW * SLOW_UPDATE_FACTOR;
    catchUpAsserts(seekAhead, 0.5, 1);
    assert(autoUpdateTriggered);
    autoUpdateTriggered = false;
  });
});

describe('Sending Information To Firestore',
    function() { // eslint-disable-line no-undef
  describe('Sending on Play',
      function() { // eslint-disable-line no-undef
    it('should send info when pressing play on a paused video',
        function() { // eslint-disable-line no-undef
      doc.changeFirestore(15, 1, false); // paused at 15 sec, default speed
      player.timestamp = 15;
      player.playVideo();
      onPlayerStateChange(); // play state change
      assert.equal(doc.data().timestamp, 15);
      assert.equal(doc.data().isPlaying, true);
      assert(autoUpdateTriggered);
      autoUpdateTriggered = false;
    });

    it('should send info on seek', function() { // eslint-disable-line no-undef
      doc.changeFirestore(15, 1, true);
      player.timestamp = 30;
      player.playVideo();
      onPlayerStateChange(); // play state change
      assert.equal(doc.data().timestamp, 30);
      assert.equal(doc.data().isPlaying, true);
      assert(autoUpdateTriggered);
      autoUpdateTriggered = false;
    });
  });

  describe('Sending on pause', function () { // eslint-disable-line no-undef
    it('should send info to Firestore on pause',
        function() { // eslint-disable-line no-undef
      doc.changeFirestore(20, 1, true);
      player.timestamp = 40;
      player.pauseVideo();
      onPlayerStateChange(); // pause state change
      assert.equal(doc.data().timestamp, 40);
      assert.equal(doc.data().isPlaying, false);
      assert(!autoUpdateTriggered);
      clearInterval(pauseInterval);
    });
  });

  describe('Sending new info while paused',
       function() { // eslint-disable-line no-undef
    it('should send info to Firestore when seeking while paused',
        function() { // eslint-disable-line no-undef
      setTimeout(function() {
        reset();
        doc.changeFirestore(10, 1.5, false);
        queueCollection.addToQueue('ExampleVideo', '"ExampleThumbnail"');
        updateQueue();
        onPlayerReady();
        player.playVideo();
        onPlayerStateChange(); // play state change
        onPlayerStateChange(); // pause state change
        assert(!autoUpdateTriggered);
        player.seekTo(11, true);
        setTimeout(function() {
          assert.equal(doc.data().timestamp, 11);
          assert.equal(doc.data().isPlaying, false);
          assert(!autoUpdateTriggered);
          clearInterval(pauseInterval);
        }, 3000);
      }, 3000);
    });
  });

  // Note: runs after all other tests and checks both that the buffering
  // client does not send new information and that it catches up to the
  // Firestore information.
  describe('Not Sending While Behind',
      function() { // eslint-disable-line no-undef
    it('shouldn\'t send updates after buffering for 5 seconds',
        function() { // eslint-disable-line no-undef
      setTimeout(function() {
        reset();
        doc.changeFirestore(20, 0.5, true);
        queueCollection.addToQueue('ExampleVideo', '"ExampleThumbnail"');
        updateQueue();
        onPlayerReady();
        player.playVideo();
        onPlayerStateChange(); // play state change
        player.bufferVideo();
        onPlayerStateChange(); // buffer state change
        doc.changeFirestore(55, 1, false);
        setTimeout(function() {
          player.seekTo(40, true);
          player.playVideo();
          onPlayerStateChange(); // play state change
          assert.equal(doc.data().timestamp, 55);
          assert.equal(doc.data().isPlaying, false);
          assert.equal(doc.data().videoSpeed, 1);
          assert.equal(player.timestamp, 55);
          assert.equal(player.playerState, 2);
          assert.equal(player.playbackRate, 1);
        }, 5000);
      }, 8000);
    });
  });

  describe('Sending Info on End',
      function() { // eslint-disable-line no-undef
    it('should start by displaying YTLounge logo',
        function() { // eslint-disable-line no-undef
      reset();
      onPlayerReady();
      assert.equal(thumbnailDisplay, '/images/LoungeLogo.png');
      assert.equal(vidDisplay, 'none');
    });

    it('should display the first video once queue updates',
        function() { // eslint-disable-line no-undef
      doc.addViewer(); // add another viewer who adds two videos
      doc.changeFirestore(0, 1, true);
      queueCollection.addToQueue('Video1', '"Thumbnail1"');
      queueCollection.addToQueue('Video2', '"Thumbnail2"');
      updateQueue();
      getCurrentVideo(); // would've been called on timeout in real code
      player.playVideo();
      onPlayerStateChange(); // play state change
      assert.equal(thumbnailDisplay, 'none');
      assert.equal(vidDisplay, 'block');
    });

    it('should send an update when it ends',
        function() { // eslint-disable-line no-undef
      player.seekTo(player.getDuration(), true);
      onPlayerStateChange(); // end state change
      assert.equal(doc.data().timestamp, 60);
    });

    it('should display the next video thumbnail',
        function() { // eslint-disable-line no-undef
      assert.equal(thumbnailDisplay, 'Thumbnail2');
      assert.equal(vidDisplay, 'none');
    });

    it('should move on to the next video once every viewer is ready',
        function() { // eslint-disable-line no-undef
      getRealtimeUpdates(); // don't go when not everyone's ready
      assert.notEqual(doc.data().videoId, 'Video2');
      doc.removeViewer();
      getRealtimeUpdates();
      assert.equal(doc.data().numPeopleWatching, 1);
      assert.equal(doc.data().timestamp, 0);
      assert.equal(doc.data().videoId, 'Video2');
      assert(autoUpdateTriggered);
      autoUpdateTriggered = false;
    });

    it('should display the next video',
        function() { // eslint-disable-line no-undef
      assert.equal(thumbnailDisplay, 'none');
      assert.equal(vidDisplay, 'block');
    });
  });
});

describe('Retrieving Information from Firestore',
    function() { // eslint-disable-line no-undef
  describe('Update on Play', function() { // eslint-disable-line no-undef
    it('should begin playing when paused',
        function() { // eslint-disable-line no-undef
      reset();
      doc.changeFirestore(0, 1, false); // timestamp, videoSpeed, isPlaying
      player.timestamp = 0;
      player.playVideo();
      onPlayerStateChange(); // play state change
      onPlayerStateChange(); // pause state change
      clearTimeouts();
      doc.changeFirestore(20, 1.5, true);
      getRealtimeUpdates();
      onPlayerStateChange(); // play state change
      assert.equal(player.timestamp, 20);
      assert.equal(player.playerState, 1);
      assert.equal(player.playbackRate, 1.5);
      assert(autoUpdateTriggered);
      autoUpdateTriggered = false;
    });

    it('should continue playing on playing seek',
        function() { // eslint-disable-line no-undef
      doc.changeFirestore(40, 0.5, true);
      getRealtimeUpdates();
      onPlayerStateChange(); // play state change
      assert.equal(player.timestamp, 40);
      assert.equal(player.playerState, 1);
      assert.equal(player.playbackRate, 0.5);
      assert(!autoUpdateTriggered);
    });
  });

  describe('Update on Pause',
      function() { // eslint-disable-line no-undef
    it('should pause when playing',
        function() { // eslint-disable-line no-undef
      doc.changeFirestore(10, 1, false);
      getRealtimeUpdates();
      onPlayerStateChange(); // pause state change
      assert.equal(player.timestamp, 10);
      assert.equal(player.playerState, 2);
      assert.equal(player.playbackRate, 1);
      assert(!autoUpdateTriggered);
    });

    it('should remain paused on seek while paused',
        function() { // eslint-disable-line no-undef
      doc.changeFirestore(30, 1, false);
      getRealtimeUpdates();
      onPlayerStateChange(); // pause state change
      assert.equal(player.timestamp, 30);
      assert.equal(player.playerState, 2);
      assert.equal(player.playbackRate, 1);
      assert(!autoUpdateTriggered);
    });
  });

  describe('Playing Seek Boundaries',
      function() { // eslint-disable-line no-undef
    it('should not seek for less than 5 second time difference' +
        'when playing', function() { // eslint-disable-line no-undef
      doc.changeFirestore(31, 1, true);
      getRealtimeUpdates();
      onPlayerStateChange();
      assert.equal(player.timestamp, 30);
    });

    it('should not seek for 5 second time difference when playing',
        function() { // eslint-disable-line no-undef
      doc.changeFirestore(35, 1, true);
      getRealtimeUpdates();
      onPlayerStateChange();
      assert.equal(player.timestamp, 30);
    });

    it('should halve sync window when playing at half speed',
        function() { // eslint-disable-line no-undef
      doc.changeFirestore(33, 0.5, true); // add only 3 seconds (> 2.5)
      getRealtimeUpdates();
      onPlayerStateChange();
      assert.equal(player.timestamp, 33);
      // still updates because at halfspeed
      // 5 realtime seconds is 2.5 video seconds
    });

    it('should double sync widnow when playing at double speed',
        function() { // eslint-disable-line no-undef
      doc.changeFirestore(40, 2, true); // add 7 seconds (< 10 seconds)
      getRealtimeUpdates();
      onPlayerStateChange();
      assert.equal(player.timestamp, 33);
      autoUpdateTriggered = false;
    });
    // Note that when I say double or halve sync window, I mean solely
    // in the case of deciding whether or not to move the user's playhead.
    // Playback speed has no effect on other uses for sync window (i.e.
    // how often auto updates are sent).
  });
});

// ATTENTION!!!

// Below is modified version of code to work with mocks
// I have a version which includes commented out lines
// to help see more of the difference between this and the
// real code, but this PR was already too long,
// so I thought it'd be better to not include it.

let videoUpdating; // is video currently updating to match Firestore info?
let autoUpdate; // max time between updates
const SYNC_WINDOW = 5; // max time diff between client and Firestore
// These factors shorten the sync window variable in cases where time
// for Firestore has to be accounted for or a call must be made
// faster on one client than others.
const SLOW_UPDATE_FACTOR = 0.85;
let thumbnailDisplay = 'none';

let nextVidID;
let nextThumbnail;
function updateQueue() {
  nextVidID = '';
  nextThumbnail = '';
  const queueData = queueCollection.data();
  if (!!queueData) {
    nextVidID = queueData.videoId;
    const thumbnailString = queueData.videoThumbnail;
    const thumbnailURL = thumbnailString.substring(1,
        thumbnailString.length - 1);
    nextThumbnail = thumbnailURL;
  }
}
updateQueue();

function getCurrentVideo() {
  const vidData = doc.data();
  if (vidData.videoId !== ('')) { // There's a video playing
    player.videoPlaying = vidData.videoId; // replace loading vid ID
    switchDisplay();
    addOneViewer();
    stopUpdating = false;
  } else { // No video is currently playing
    getFirstVidFromQueue();
  }
}

function getFirstVidFromQueue() {
  if (nextVidID === '') {
    console.log('add videos to the queue!');
  } else {
    const firstVid = nextVidID;
    player.videoPlaying = firstVid; // replace loading vid ID
    switchDisplay();
    addOneViewer();
    stopUpdating = false;
    updateVidPlaying(firstVid);
    queueCollection.delete(); // replace firestore delete
    updateQueue(); // Because there's no onSnapshot
  }
}

let catchingUp; // Does this vid need to catch up to Firestore?
function onPlayerReady() {
  switchDisplay();
  getCurrentVideo();
  catchingUp = true;
}

// Move playhead slightly ahead of updated timestamp when needed
function seek(vidData) {
  if (vidData.isPlaying) {
    const seekAhead = vidData.timestamp + SYNC_WINDOW * SLOW_UPDATE_FACTOR;
    player.seekTo(seekAhead, true);
  } else {
    player.seekTo(vidData.timestamp, true);
  }
}

function aboutToEnd() {
  return (player.getDuration() - player.getCurrentTime() < SYNC_WINDOW);
}

// switches to thumbnails between videos
let vidDisplay = 'block';
function switchDisplay() {
  if (vidDisplay === 'none') {
    vidDisplay = 'block';
  } else {
    vidDisplay = 'none';
  }

  if (thumbnailDisplay === 'none') {
    if (nextThumbnail !== '') thumbnailDisplay = nextThumbnail;
    else thumbnailDisplay = '/images/LoungeLogo.png';
  } else {
    thumbnailDisplay = 'none';
  }
}

function resetPlaybackInfo() {
  doc.update({
    isPlaying: true,
    timestamp: 0,
    videoSpeed: 1,
    videoId: '',
  });
}

function updateVidPlaying(currentVid) {
  doc.update({
    videoId: currentVid,
  });
}

function removeOneViewer() {
  doc.removeViewer();
}

function addOneViewer() {
  doc.addViewer();
}

let justJoined = true;
function alignWithFirestore() {
  if (justJoined) {
    justJoined = false;
    getRealtimeUpdates();
  }
  if (catchingUp) {
    videoUpdating = true;
    catchUserUp();
    catchingUp = false;
    videoUpdating = false;
  }
}

// Holds client off from starting next video until
// everyone is ready.
function waitForOthers(vidData) {
  if (vidData.numPeopleWatching === 0) {
    vidOver = false;
    resetPlaybackInfo();
    getCurrentVideo();
  }
}

// return true if player timestamp is within 5 realtime
// seconds of firestore
function timesInRange(firestoreVidTime) {
  return Math.abs(player.getCurrentTime() - firestoreVidTime) <=
      SYNC_WINDOW * player.getPlaybackRate();
}

// return true if player state is different than Firestore state
function differentStates(firestoreVidIsPlaying) {
  if (isVideoPlaying()) {
    if (firestoreVidIsPlaying) {
      return false;
    }
    return true;
  }
  if (!firestoreVidIsPlaying) {
    return false;
  }
  return true;
}

// Return true if player is not paused
function isVideoPlaying() {
  return (player.getPlayerState() !== 2);
}

// Sends new info to Firestore and then repeatedly calls itself
// until stopped by user or Firestore.
function updateInfo(goal) {
  // if (!stopUpdating && !videoUpdating) {
     doc.update({
      isPlaying: isVideoPlaying(),
      timestamp: player.getCurrentTime(),
      videoSpeed: player.getPlaybackRate(),
    });
        if (!stopUpdating && !aboutToEnd() && isVideoPlaying()) {
          // updateInfo('auto');
          autoUpdateTriggered = true;
        }
}

// keeps firestore updated on pause
let lastTime;
let pauseInterval;
function setPauseInterval() {
  lastTime = player.getCurrentTime();
  pauseInterval = setInterval(function() {
    if (player.getCurrentTime() !== lastTime && videoUpdating === false) {
      updateInfo('Update on Pause Seek');
      lastTime = player.getCurrentTime();
    }
    videoUpdating = false;
  }, 2000);
}

let pauseTimeout; // Differentiates pause from seek
let bufferTimeout; // Finds when user's video has fallen behind
let stopUpdating = false; // makes code ignore ended videos
let vidOver = false; // limits checks to start next video

function clearTimeouts() {
  clearTimeout(pauseTimeout);
  clearTimeout(bufferTimeout);
  clearTimeout(autoUpdate);
  clearInterval(pauseInterval);
}

function onPlayerStateChange() {
  clearTimeouts();
  if (!stopUpdating) {
    switch (player.getPlayerState()) {
      case 1: // Playing
        if (!videoUpdating && !catchingUp) updateInfo('play');
        alignWithFirestore();
        break;
      case 2: // paused
        if (!videoUpdating && !catchingUp) {
          updateInfo('pause'); // no timeout for tests
        }
        setPauseInterval();
        break;
      case 3: // Buffering
        bufferTimeout = setTimeout(function() {
          catchingUp = true;
        }, SYNC_WINDOW*1000);
        break;
      case 0: // Ended
        stopUpdating = true;
        vidOver = true;
        doc.update({
          timestamp: player.getDuration(),
          isPlaying: true,
        });
        switchDisplay();
        removeOneViewer();
    }
    videoUpdating = false;
  }
}

function onPlayerPlaybackRateChange() {
  if (!videoUpdating && !catchingUp) {
    updateInfo('Change Speed');
  }
}

function catchUserUp() {
      const vidData = doc.data();
      seek(vidData);
      player.setPlaybackRate(vidData.videoSpeed);
      if (vidData.isPlaying) player.playVideo();
      else player.pauseVideo();
    if (isVideoPlaying()) {
      autoUpdateTriggered = true;
    }
}

function getRealtimeUpdates() {
    clearTimeout(autoUpdate);
      const vidData = doc.data();
      if (!stopUpdating) {
        if (player.getPlaybackRate() != vidData.videoSpeed) {
          videoUpdating = true;
          player.setPlaybackRate(vidData.videoSpeed);
        }
        if (!timesInRange(vidData.timestamp)) {
          videoUpdating = true;
          player.seekTo(vidData.timestamp, true);
          lastTime = vidData.timestamp;
        }
        if (differentStates(vidData.isPlaying, isVideoPlaying())) {
          videoUpdating = true;
          switch (vidData.isPlaying) {
            case true:
              player.playVideo();
              break;
            case false:
              player.pauseVideo();
              player.seekTo(vidData.timestamp, true);
          }
        }
      }
      if (vidOver) waitForOthers(vidData);
    if (isVideoPlaying()) {
      autoUpdateTriggered;
    }
}
