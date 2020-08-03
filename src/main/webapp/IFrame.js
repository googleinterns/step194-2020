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
const SYNC_WINDOW = 5; // max time diff between client and Firestore

firebase.initializeApp(firebaseConfig); // eslint-disable-line no-undef
const firestore = firebase.firestore(); // eslint-disable-line no-undef

// Hard coded for now, but eventually will update to point
// to current video in queue
const docRef = firestore.doc('CurrentVideo/PlaybackData');

let player; // var representing iframe ytplayer
function onYouTubeIframeAPIReady() { // eslint-disable-line no-unused-vars
  player = new YT.Player('ytplayer', { // eslint-disable-line no-undef
    events: {
      'onStateChange': onPlayerStateChange,
      'onPlaybackRateChange': onPlayerPlaybackRateChange,
    },
  });
  // I'm still working on writing this as a promise, but it doesn't
  // work unless these next two parts are delayed
  setTimeout(function() {
    sendInfo('start');
    getRealtimeUpdates();
  }, 1000);
}

function sendInfo(goal) { // send info to Firestore
  docRef.set({
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

let pauseTimeout; // Differentiates pause from seek
let bufferTimeout; // Finds when user's video has fallen behind
let pauseInterval; // sends new information about paused videos
function onPlayerStateChange() {
  switch (player.getPlayerState()) {
    case 1: // Playing
      clearTimeout(pauseTimeout);
      clearTimeout(bufferTimeout);
      clearInterval(pauseInterval);
      bufferingChecks();
      if (!videoUpdating) sendInfo('play');
      break;
    case 2: // paused
      if (!catchUp && !videoUpdating) {
        pauseTimeout = setTimeout(sendInfo, 100, 'pause');
        let lastTime = player.getCurrentTime();
        pauseInterval = setInterval(function() {
          if (player.getCurrentTime() != lastTime) {
            lastTime = player.getCurrentTime();
            sendInfo('Update on Pause Seek');
          }
        }, 1000);
      }
      break;
    case 3: // Buffering
      clearTimeout(pauseTimeout);
      clearInterval(pauseInterval);
      bufferTimeout = setTimeout(function() {
        catchUp = true;
      }, SYNC_WINDOW*1000);
      break;
    case -1: // Just before next video starts
      // Will change the video docRef refers to
      break;
    case 0: // Ended
      // will load the next video
  }
}

function bufferingChecks() {
  if (catchUp) {
    catchUserUp();
    catchUp = false;
  }
}

function catchUserUp() {
  docRef.get().then(function(doc) {
    if (doc && doc.exists) {
      const vidData = doc.data();
      player.seekTo(vidData.timestamp);
      player.setPlaybackRate(vidData.videoSpeed);
      if (vidData.isPlaying) player.playVideo();
      else player.pauseVideo();
    }
  });
}

function onPlayerPlaybackRateChange() {
  if (!videoUpdating) sendInfo('Change Speed');
}

function getRealtimeUpdates() {
  docRef.onSnapshot(function(doc) {
    if (doc && doc.exists) {
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
  return (player.getPlayerState() == 1);
}
