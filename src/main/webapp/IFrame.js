// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var videoUpdating; // is video currently updating to match Firestore info?
var updateInterval; // max time between updates
const SYNC_WINDOW = 5; // max time diff between client and Firestore
const VIDEO_QUEUE = ['y0U4sD3_lX4','VYOjWnS4cMY', 'F1B9Fk_SgI0'];
thumbnail = document.getElementById("thumbnailDisplay");
  if (thumbnail.style.display === "none") {
    thumbnail.style.display = "block";
  } else {
    thumbnail.style.display = "none";
}

document.getElementById('ytplayer').src = 
    'https://www.youtube.com/embed/' + VIDEO_QUEUE.shift() + '?enablejsapi=1';

firebase.initializeApp(firebaseConfig); // eslint-disable-line no-undef
const firestore = firebase.firestore(); // eslint-disable-line no-undef

// Hard coded for now, but eventually will update to point
// to current video in queue
const docRef = firestore.doc('CurrentVideo/PlaybackData');

var player; // var representing iframe ytplayer
function onYouTubeIframeAPIReady() { // eslint-disable-line no-unused-vars
  player = new YT.Player('ytplayer', { // eslint-disable-line no-undef
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onPlaybackRateChange': onPlayerPlaybackRateChange,
    },
  });
}

var catchUp; // Does this vid need to catch up to Firestore?
function onPlayerReady() {
  getRealtimeUpdates();
  catchUp = true;
  addOneViewer();
}

function catchUserUp() {
  docRef.get().then(function(doc) {
    if (doc && doc.exists) {
      const vidData = doc.data();
      player.pauseVideo();
      player.seekTo(vidData.timestamp);
      player.setPlaybackRate(vidData.videoSpeed);
      if (vidData.isPlaying) player.playVideo();
    } else {
      console.log('no document to read!');
    }
  }).then(function() {
    resetInterval();
  });
}

function updateInfo(goal) { // send info to Firestore
  clearInterval(updateInterval);
  docRef.update({
    isPlaying: isVideoPlaying(),
    timestamp: player.getCurrentTime(),
    videoSpeed: player.getPlaybackRate(),
  }).then(function() {
    console.log(goal + ' request sent');
  }).catch(function(error) {
    console.log(goal + ' caused an error: ', error);
  });
  resetInterval();
}

function clearAll() {
  clearTimeout(pauseTimeout);
  clearTimeout(bufferTimeout);
  clearInterval(pauseInterval);
}

function setPauseInterval() {
  let lastTime = player.getCurrentTime();
  pauseInterval = setInterval(function() {
    if (player.getCurrentTime() != lastTime) {
      clearInterval(updateInterval);
      pauseStoppedInterval = true;
      lastTime = player.getCurrentTime();
      updateInfo('Update on Pause Seek');
    }
  }, 1000);
}

var pauseTimeout;
var pauseInterval;
var pauseStoppedInterval = false;
var bufferTimeout;
var stopUpdating = false;
var pleaseDoNotCallAgain = true;
function onPlayerStateChange() {
  clearAll();
  if (!stopUpdating) {
    switch (player.getPlayerState()) {
      case 1: // Playing
        if (!videoUpdating && !catchUp) updateInfo('play');
        bufferingChecks();
        break;
      case 2: // paused
        if (!catchUp && !videoUpdating) {
          pauseTimeout = setTimeout(updateInfo, 100, 'pause');
          setPauseInterval();
        }
        break;
      case 3: // Buffering
        bufferTimeout = setTimeout(function() {
          catchUp = true;
          clearInterval(updateInterval);
        }, SYNC_WINDOW*1000);
        break;
      case 0: // Ended
        clearInterval(updateInterval);
        stopUpdating = true;
        pleaseDoNotCallAgain = false;
        switchDisplay();
        removeOneViewer();
    }
  }
}


function switchDisplay() {
  let playerTag = document.getElementById("ytplayer");
  if (playerTag.style.display === "none") {
    playerTag.style.display = "block";
  } else {
    playerTag.style.display = "none";
  }

  if (thumbnail.style.display === "none") {
    // code to get next thumbnail here
    thumbnail.style.display = "block";
  } else {
    thumbnail.style.display = "none";
  }
}

function waitForOthers(vidData) {
  if (vidData.numPeopleWatching === 0) {
    pleaseDoNotCallAgain = true;
    setTimeout(function() { 
      player.loadVideoById({videoId: VIDEO_QUEUE.shift(),});
      switchDisplay();
      resetPlaybackInfo();
      stopUpdating = false;
      catchUserUp(); // is this needed?
      addOneViewer();
    }, 500);
  }
}

function resetPlaybackInfo() {
  docRef.update({
    isPlaying: true,
    timestamp: 0,
    videoSpeed: 1,
  }).then(function() {
    console.log('reset request sent');
  }).catch(function(error) {
    console.log('reset caused an error: ', error);
  });
}

function removeOneViewer() {
  docRef.update({
    numPeopleWatching: firebase.firestore.FieldValue.increment(-1),
  }).then(function() { console.log('removed one viewer'); });
}

function addOneViewer() {
  docRef.update({
    numPeopleWatching: firebase.firestore.FieldValue.increment(1),
  }).then(function() { console.log('added one viewer'); });
}

function bufferingChecks() {
  if (catchUp) {
    videoUpdating = true;
    catchUserUp();
    catchUp = false;
    videoUpdating = false;
  }
  if (pauseStoppedInterval) {
    pauseStoppedInterval = false;
    resetInterval();
  }
}

function onPlayerPlaybackRateChange() {
  if (!videoUpdating && !catchUp) updateInfo('Change Speed');
}

function getRealtimeUpdates() {
  docRef.onSnapshot(function(doc) {
    clearInterval(updateInterval);
    if (doc && doc.exists) {
      videoUpdating = true;
      const vidData = doc.data();
      if (player.getPlaybackRate() != vidData.videoSpeed) {
        player.setPlaybackRate(vidData.videoSpeed);
        console.log('new speed: ' + player.getPlaybackRate());
      }
      if (!timesInRange(vidData.timestamp)) {
        player.seekTo(vidData.timestamp, true);
        console.log('new time: ' + player.getCurrentTime());
      }
      if (differentStates(vidData.isPlaying)) {
        switch (vidData.isPlaying) {
          case true:
            player.playVideo();
            break;
          case false:
            player.pauseVideo();
            player.seekTo(vidData.timestamp, true);
        }
        console.log('new state: ' + player.getPlayerState());
      }
      if (!pleaseDoNotCallAgain) waitForOthers(vidData);
      videoUpdating = false;
    }
    resetInterval();
  });
}

function resetInterval() {
  updateInterval = setInterval(updateInfo, SYNC_WINDOW*1000*0.75, 'update');
}

// return true if player time is within 5 seconds of Firestore time
function timesInRange(firestoreVidTime) {
  return Math.abs(player.getCurrentTime() - firestoreVidTime) < SYNC_WINDOW;
}

// return true if player state is different than Firestore state
function differentStates(firestoreVidIsPlaying) {
  if (player.getPlayerState() != 1) { // player paused
    if (firestoreVidIsPlaying) { // Firestore playing
      return true;
    }
    return false;
  }
  if (!firestoreVidIsPlaying) {
    return true;
  }
  return false;
}

function isVideoPlaying() {
  return (player.getPlayerState() !== 2);
}
