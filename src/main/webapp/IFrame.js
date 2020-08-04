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
let autoUpdate; // max time between updates
let justJoined = true;
const SYNC_WINDOW = 5; // max time diff between client and Firestore
const VIDEO_QUEUE = ['y0U4sD3_lX4', 'VYOjWnS4cMY', 'F1B9Fk_SgI0'];
const thumbnail = document.getElementById('thumbnailDisplay');
thumbnail.style.display = 'none';

firebase.initializeApp(firebaseConfig); // eslint-disable-line no-undef
const firestore = firebase.firestore(); // eslint-disable-line no-undef

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

let catchingUp; // Does this vid need to catch up to Firestore?
let currentVidDuration;
function onPlayerReady(event) {
  player.loadVideoById({videoId: VIDEO_QUEUE.shift()});
  currentVidDuration = player.getDuration();
  catchingUp = true;
  addOneViewer();
}

function seek(vidData) {
  if (vidData.isPlaying) {
    const seekAhead = vidData.timestamp + SYNC_WINDOW*0.5;
    player.seekTo(seekAhead, true);
  } else {
    player.seekTo(vidData.timestamp, true);
  }
}

function aboutToEnd() {
  return (player.getDuration() - player.getCurrentTime() < SYNC_WINDOW);
}

// keeps firestore updated on pause
function setPauseInterval() {
  let lastTime = player.getCurrentTime();
  pauseInterval = setInterval(function() {
    if (player.getCurrentTime() != lastTime) {
      clearTimeout(autoUpdate);
      pauseStoppedInterval = true;
      lastTime = player.getCurrentTime();
      updateInfo('Update on Pause Seek');
    }
  }, 1000);
}

// switches to thumbnails between videos
const playerTag = document.getElementById('ytplayer');
function switchDisplay() {
  if (playerTag.style.display === 'none') {
    playerTag.style.display = 'block';
  } else {
    playerTag.style.display = 'none';
  }
  if (thumbnail.style.display === 'none') {
    // Code to put next thumbnail goes here
    thumbnail.style.display = 'block';
  } else {
    thumbnail.style.display = 'none';
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
    numPeopleWatching: firebase.firestore. // eslint-disable-line no-undef
        FieldValue.increment(-1),
  }).then(function() {
    console.log('removed one viewer');
  });
}

function addOneViewer() {
  docRef.update({
    numPeopleWatching: firebase.firestore. // eslint-disable-line no-undef
        FieldValue.increment(1),
  }).then(function() {
    console.log('added one viewer');
  });
}

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
  if (pauseStoppedInterval) {
    pauseStoppedInterval = false;
    autoUpdate = setTimeout(regularFirestoreUpdate,
        SYNC_WINDOW*1000*0.75, 'buffering check');
  }
}

function waitForOthers(vidData) {
  if (vidData.numPeopleWatching === 0) {
    vidOver = false;
    setTimeout(function() {
      player.loadVideoById({videoId: VIDEO_QUEUE.shift()});
      switchDisplay();
      resetPlaybackInfo();
      stopUpdating = false;
      catchUserUp(); // is this needed?
      addOneViewer();
      currentVidDuration = // eslint-disable-line no-unused-vars
          player.getDuration();
    }, 500);
  }
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

let pauseTimeout; // Differentiates pause from seek
let pauseInterval; // sends new information about paused videos
let pauseStoppedInterval = false; // Tells when videos are paused
let bufferTimeout; // Finds when user's video has fallen behind
let stopUpdating = false; // makes code ignore ended videos
let vidOver = false; // limits checks to start next video

function clearAll() {
  clearTimeout(pauseTimeout);
  clearTimeout(bufferTimeout);
  clearInterval(pauseInterval);
}

function onPlayerStateChange() {
  clearAll();
  if (!stopUpdating) {
    switch (player.getPlayerState()) {
      case 1: // Playing
        console.log('play ' + player.getCurrentTime());
        console.log(videoUpdating + ' ' + catchingUp);
        if (!videoUpdating && !catchingUp) updateInfo('play');
        alignWithFirestore();
        break;
      case 2: // paused
        if (!catchingUp && !videoUpdating) {
          pauseTimeout = setTimeout(updateInfo, 100, 'pause');
          setPauseInterval();
        }
        break;
      case 3: // Buffering
        console.log('buffering');
        bufferTimeout = setTimeout(function() {
          catchingUp = true;
          clearTimeout(autoUpdate);
        }, SYNC_WINDOW*1000);
        break;
      case 0: // Ended
        // will load the next video
        stopUpdating = true;
        console.log('did it at least end?');
        clearTimeout(autoUpdate);
        vidOver = true;
        switchDisplay();
        removeOneViewer();
    }
  }
}

function onPlayerPlaybackRateChange() {
  if (!videoUpdating && !catchingUp && !stopUpdating) {
    updateInfo('Change Speed');
  }
}

function catchUserUp() {
  docRef.get().then(function(doc) {
    if (doc && doc.exists) {
      const vidData = doc.data();
      seek(vidData); // move playhead
      player.setPlaybackRate(vidData.videoSpeed);
      if (vidData.isPlaying) player.playVideo();
      else player.pauseVideo();
    } else {
      console.log('there was no doc to read!');
    }
  }).then(function() {
    autoUpdate = setTimeout(regularFirestoreUpdate,
        SYNC_WINDOW*1000*0.75, 'catch user up');
  });
}

function getRealtimeUpdates() {
  docRef.onSnapshot(function(doc) {
    clearTimeout(autoUpdate);
    if (doc && doc.exists) {
      const vidData = doc.data();
      videoUpdating = true;
      if (!stopUpdating) {
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
      }
      if (vidOver) waitForOthers(vidData);
      videoUpdating = false;
    }
    if (!stopUpdating) {
      autoUpdate = setTimeout(regularFirestoreUpdate,
          SYNC_WINDOW*1000*0.75, 'realtime');
    }
  });
}

function regularFirestoreUpdate(cause) {
  if (!stopUpdating) {
    console.log(stopUpdating);
    updateInfo('update');
    console.log('updated because ' + cause);
  }
  autoUpdate = setTimeout(function() {
    if (!stopUpdating || aboutToEnd()) regularFirestoreUpdate('auto');
  }, SYNC_WINDOW*1000*0.75);
}
