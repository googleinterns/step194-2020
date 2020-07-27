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
let updateFirestoreInterval; // Looping call to update firestore playback info
const SYNC_WINDOW = 5; // max time diff between client and Firestore

const firebaseConfig = {
  apiKey: API_KEY, // eslint-disable-line no-undef
  authDomain: 'lounge-95f01.firebaseapp.com',
  databaseURL: 'https://lounge-95f01.firebaseio.com',
  projectId: 'youtube-lounge',
  storageBucket: 'youtube-lounge.appspot.com',
  messagingSenderId: '681171972170',
  appId: '1:681171972170:web:4c6526b8eb788af9d876b3',
  measurementId: 'G-JSDHBSMHS3',
};
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
  updateFirestoreInterval = setInterval(sendInfo, SYNC_WINDOW * 1000,
      'update Firestore');
  getRealtimeUpdates();
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
let updateFirestoreOff = false; // Is this vid buffering?

/*
  The purpose of the pause timeout is to differentiate between
  users pausing the video and moving ahead in the video. When
  the IFrame seeks (user moves to a different part of video) the
  following steps are taken:
    1. pause the video
    2. (sometimes) buffer while moving playhead
    3. play the video at new playhead position
  This means when a user goes to move the playhead, the pause
  case is triggered, and I didn't want to send needless requests
  to the Firestore, so I delayed the request until buffering/play hadn't
  been called for 100 ms.

  The purpose of the buffering timeout is to decide when a user's
  video buffered for too long. If the video buffers for an amount of
  time greater than the SYNC_WINDOW, then they can no longer make changes
  to the Firestore until they've caught up to everyone else's video play.
  It's possible a user's video could buffer then play in small increments
  multiple times (i.e. video buffers for 1 second 5 times with a 5 second
  SYNC_WINDOW) and then they'd fall out of the timeframe and this code would
  not catch it. In the future, I may add a summing total of buffering to solve
  this issue, but I think it's a rare enough occurence to fix later.
*/
let pauseTimeout;
let bufferTimeout;
function onPlayerStateChange() {
  if (!videoUpdating) { // don't send info to Firestore while updating
    switch (player.getPlayerState()) {
      case 1: // Playing
        clearTimeout(pauseTimeout);
        clearTimeout(bufferTimeout);
        bufferingChecks();
        sendInfo('play');
        break;
      case 2: // paused
        if (!catchUp) { // don't send paused info if user must catch up
          pauseTimeout = setTimeout(sendInfo, 100, 'pause');
        }
        break;
      case 3: // Buffering
        clearTimeout(pauseTimeout);
        clearInterval(updateFirestoreInterval);
        updateFirestoreOff = true; // buffering videos don't input to Firestore
        bufferTimeout = setTimeout(function() {
          catchUp = true;
        }, SYNC_WINDOW*1000);
        break;
      case 0: // Ended
        clearInterval(updateFirestoreInterval);
    }
  }
}

function bufferingChecks() {
  if (catchUp) {
    catchUserUp();
    catchUp = false;
  }
  if (updateFirestoreOff) {
    updateFirestoreInterval = setInterval(sendInfo, SYNC_WINDOW * 1000,
        'update Firestore');
    updateFirestoreOff = false;
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
        player.playVideo();
      } else { // Only updates play state on play/pause, not seek
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
