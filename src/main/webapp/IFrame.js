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

let videoUpdating; // is video currently updating to match Firestore info?
let updateInterval; // max time between updates
const SYNC_WINDOW = 5; // max time diff between client and Firestore
const VIDEO_QUEUE = ['y0U4sD3_lX4','VYOjWnS4cMY', 'F1B9Fk_SgI0'];
y = document.getElementById("thumbnailDisplay");
  if (y.style.display === "none") {
    y.style.display = "block";
  } else {
    y.style.display = "none";
}

const FISRT_VIDEO_ID = VIDEO_QUEUE.shift();
document.getElementById('ytplayer').src = 
    'https://www.youtube.com/embed/' + FISRT_VIDEO_ID + '?enablejsapi=1';

firebase.initializeApp(firebaseConfig); // eslint-disable-line no-undef
const firestore = firebase.firestore(); // eslint-disable-line no-undef

// Hard coded for now, but eventually will update to point
// to current video in queue
const docRef = firestore.doc('CurrentVideo/PlaybackData');

let player; // var representing iframe ytplayer
function onYouTubeIframeAPIReady() { // eslint-disable-line no-unused-vars
  player = new YT.Player('ytplayer', { // eslint-disable-line no-undef
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onPlaybackRateChange': onPlayerPlaybackRateChange,
    },
  });
}

function onPlayerReady(event) {
    catchUserUp(true);
    getRealtimeUpdates();
}

function catchUserUp(justStarting) {
  console.log('does this get called twice? ' + justStarting);
  docRef.get().then(function(doc) {
    if (doc && doc.exists) {
      const vidData = doc.data();
      player.seekTo(vidData.timestamp);
      player.setPlaybackRate(vidData.videoSpeed);
      if (vidData.isPlaying) player.playVideo();
      else player.pauseVideo();
    } else {
      sendInitialInfo('start');
    }
  }).then(function() {
    console.log('hey');
    updateInterval = setInterval(updateInfo, SYNC_WINDOW*1000, 'update');
    if (justStarting) addOneViewer();
  });
}

function sendInitialInfo(goal) { // send info to Firestore
  docRef.set({
    isPlaying: isVideoPlaying(),
    timestamp: player.getCurrentTime(),
    videoSpeed: player.getPlaybackRate(),
    numPeopleWatching: 0,
  }).then(function() {
    console.log(goal + ' request sent');
  }).catch(function(error) {
    console.log(goal + ' caused an error: ', error);
  });
}

function updateInfo(goal) { // send info to Firestore
  docRef.update({
    isPlaying: isVideoPlaying(),
    timestamp: player.getCurrentTime(),
    videoSpeed: player.getPlaybackRate(),
  }).then(function() {
    console.log(goal + ' request sent');
  }).catch(function(error) {
    console.log(goal + ' caused an error: ', error);
  });
}


let catchUp = false; // Does this vid need to catch up to Firestore?

let pauseTimeout;
let bufferTimeout;
let pauseInterval;
let stopUpdating = false;
function onPlayerStateChange() {
  if (!stopUpdating) {
    switch (player.getPlayerState()) {
      case 1: // Playing
        clearTimeout(pauseTimeout);
        clearTimeout(bufferTimeout);
        clearInterval(pauseInterval);
        bufferingChecks();
          if (!videoUpdating) updateInfo('play');
          break;
      case 2: // paused
        if (!catchUp && !videoUpdating) {
          pauseTimeout = setTimeout(updateInfo, 100, 'pause');
          let lastTime = player.getCurrentTime();
          pauseInterval = setInterval(function() {
            if (player.getCurrentTime() != lastTime) {
              lastTime = player.getCurrentTime();
              updateInfo('Update on Pause Seek');
            }
          }, 1000);
        }
        break;
      case 3: // Buffering
        console.log('buffering');
        clearTimeout(pauseTimeout);
        clearInterval(pauseInterval);
        bufferTimeout = setTimeout(function() {
          catchUp = true;
          clearInterval(updateInterval);
        }, SYNC_WINDOW*1000);
        break;
      case 0: // Ended
        // will load the next video
        console.log('did it at least end?');
        stopUpdating = true;
        pleaseDoNotCallAgain = false;
        clearInterval(updateInterval);
        switchDisplay();
        waitForOthers();
        removeOneViewer();
    }
  }
}

function switchDisplay() {
  var x = document.getElementById("ytplayer");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
  if (y.style.display === "none") {
    y.style.display = "block";
  } else {
    y.style.display = "none";
  }
}

let pleaseDoNotCallAgain;
function waitForOthers() {
  docRef.onSnapshot(function(doc) {
    if (doc && doc.exists && !pleaseDoNotCallAgain) {
      console.log('waiting For others called');
      const vidData = doc.data();
      if (vidData.numPeopleWatching === 0) {
        pleaseDoNotCallAgain = true;
        setTimeout(function() { 
        player.loadVideoById({videoId: VIDEO_QUEUE.shift(),});
        switchDisplay();
        resetPlaybackInfo();
        stopUpdating = false;
        catchUserUp(true);
        }, 500);
      }
    }
  });
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
    catchUserUp(false);
    catchUp = false;
  }
}

function onPlayerPlaybackRateChange() {
  if (!videoUpdating) updateInfo('Change Speed');
}

function getRealtimeUpdates() {
  docRef.onSnapshot(function(doc) {
    if (doc && doc.exists) {
      console.log('Firestore Update');
      const vidData = doc.data();
      videoUpdating = true;
      if (player.getPlaybackRate() != vidData.videoSpeed) {
        player.setPlaybackRate(vidData.videoSpeed);
      }
      if (!timesInRange(vidData.timestamp)) {
        player.seekTo(vidData.timestamp, true);
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
      }
      videoUpdating = false;
    }
  });
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
