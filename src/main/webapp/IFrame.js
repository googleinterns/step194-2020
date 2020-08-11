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
const SYNC_WINDOW = 5; // max time diff between client and Firestore
const thumbnail = document.getElementById('thumbnailDisplay');
thumbnail.style.display = 'none';

const firestore = firebase.firestore(); // eslint-disable-line no-undef

const urlQueryString = window.location.search;
const params = new URLSearchParams(urlQueryString);
const roomId = params.get('room_id');
const vidDataRef = firestore.collection('rooms').doc(roomId)
    .collection('CurrentVideo').doc('PlaybackData');
const queueDataRef = firestore.collection('rooms').doc(roomId)
    .collection('queue');

let nextVidID;
let nextThumbnail;
let nextDocID;
function updateQueue() {
  nextVidID = '';
  nextThumbnail = '';
  nextDocID = '';
  queueDataRef.orderBy('requestTime', 'asc').limit(1).get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          const queueData = doc.data();
          nextDocID += doc.id;
          nextVidID += queueData.videoID;
          const thumbnailString = queueData.thumbnailURL;
          const thumbnailURL = thumbnailString.substring(1,
              thumbnailString.length - 1);
          nextThumbnail += thumbnailURL;
        });
      })
      .catch(function(error) {
        console.log('Error getting documents: ', error);
      });
}
updateQueue();
queueDataRef.onSnapshot(updateQueue);

function getCurrentVideo() {
  vidDataRef.get().then(function(doc) {
    if (doc && doc.exists) {
      const vidData = doc.data();
      if (vidData.videoId !== ('')) { // There's a video playing
        player.loadVideoById({videoId: vidData.videoId});
        switchDisplay();
        addOneViewer();
        stopUpdating = false;
      } else { // No video is currently playing
        getFirstVidFromQueue();
      }
    } else {
      console.log('there was no doc to read!');
    }
  });
}

function getFirstVidFromQueue() {
  if (nextVidID === '') {
    console.log('add videos to the queue!');
    setTimeout(getCurrentVideo, 2000);
  } else {
    const firstVid = nextVidID;
    const firstVidDocId = nextDocID;
    player.loadVideoById({videoId: firstVid});
    switchDisplay();
    addOneViewer();
    stopUpdating = false;
    setTimeout(function() {
      updateVidPlaying(firstVid);
      queueDataRef.doc(firstVidDocId).delete();
    }, 1000);
  }
}

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
function onPlayerReady() {
  switchDisplay();
  getCurrentVideo();
  catchingUp = true;
}

// Move playhead slightly ahead of updated timestamp when needed
function seek(vidData) {
  if (vidData.isPlaying) {
    const seekAhead = vidData.timestamp + SYNC_WINDOW * 0.85;
    player.seekTo(seekAhead, true);
  } else {
    player.seekTo(vidData.timestamp, true);
  }
}

function aboutToEnd() {
  return (player.getDuration() - player.getCurrentTime() < SYNC_WINDOW);
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
    if (nextThumbnail !== '') thumbnail.src = nextThumbnail;
    else thumbnail.src = '/images/LoungeLogo.png';
    thumbnail.style.display = 'block';
  } else {
    thumbnail.style.display = 'none';
  }
}

function resetPlaybackInfo() {
  vidDataRef.update({
    isPlaying: true,
    timestamp: 0,
    videoSpeed: 1,
    videoId: '',
  }).then(function() {
    console.log('reset request sent');
  }).catch(function(error) {
    console.log('reset caused an error: ', error);
  });
}

function updateVidPlaying(currentVid) {
  vidDataRef.update({
    videoId: currentVid,
  });
}

function removeOneViewer() {
  vidDataRef.update({
    numPeopleWatching: firebase.firestore. // eslint-disable-line no-undef
        FieldValue.increment(-1),
  }).then(function() {
    console.log('removed one viewer');
  });
}

function addOneViewer() {
  vidDataRef.update({
    numPeopleWatching: firebase.firestore. // eslint-disable-line no-undef
        FieldValue.increment(1),
  }).then(function() {
    console.log('added one viewer');
  });
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

// return true if player time is within 5 seconds of Firestore time
function timesInRange(firestoreVidTime) {
  return Math.abs(player.getCurrentTime() - firestoreVidTime) <
      SYNC_WINDOW * player.getPlaybackRate();
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

// Return true if player is not paused
function isVideoPlaying() {
  return (player.getPlayerState() !== 2);
}

// Sends new info to Firestore and then repeatedly calls itself
// until stopped by user or Firestore.
function updateInfo(goal) {
  if (!stopUpdating) {
    vidDataRef.update({
      isPlaying: isVideoPlaying(),
      timestamp: player.getCurrentTime(),
      videoSpeed: player.getPlaybackRate(),
    }).then(function() {
      console.log(goal + ' request sent');
      clearTimeout(autoUpdate);
      autoUpdate = setTimeout(function() {
        if (!stopUpdating && !aboutToEnd() && isVideoPlaying()) updateInfo();
      }, SYNC_WINDOW*1000*0.75);
    }).catch(function(error) {
      console.log(goal + ' caused an error: ', error);
    });
  }
}

// keeps firestore updated on pause
let lastTime;
let pauseInterval;
function setPauseInterval() {
  lastTime = player.getCurrentTime();
  pauseInterval = setInterval(function() {
    if (player.getCurrentTime() != lastTime) {
      lastTime = player.getCurrentTime();
      updateInfo('Update on Pause Seek');
    }
  }, 1000);
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
          pauseTimeout = setTimeout(updateInfo, 100, 'pause');
          setPauseInterval();
        }
        break;
      case 3: // Buffering
        bufferTimeout = setTimeout(function() {
          catchingUp = true;
        }, SYNC_WINDOW*1000);
        break;
      case 0: // Ended
        stopUpdating = true;
        vidOver = true;
        switchDisplay();
        removeOneViewer();
    }
  }
}

function onPlayerPlaybackRateChange() {
  if (!videoUpdating && !catchingUp) {
    updateInfo('Change Speed');
  }
}

function catchUserUp() {
  vidDataRef.get().then(function(doc) {
    if (doc && doc.exists) {
      const vidData = doc.data();
      seek(vidData);
      player.setPlaybackRate(vidData.videoSpeed);
      if (vidData.isPlaying) player.playVideo();
      else player.pauseVideo();
    } else {
      console.log('there was no doc to read!');
    }
  }).then(function() {
    if (isVideoPlaying()) {
      autoUpdate = setTimeout(updateInfo,
          SYNC_WINDOW*1000*0.75);
    }
  });
}

function getRealtimeUpdates() {
  vidDataRef.onSnapshot(function(doc) {
    clearTimeout(autoUpdate);
    videoUpdating = true;
    if (doc && doc.exists) {
      const vidData = doc.data();
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
    }
    videoUpdating = false;
    if (isVideoPlaying()) {
      autoUpdate = setTimeout(updateInfo,
          SYNC_WINDOW*1000*0.85);
    }
  });
}

window.onbeforeunload = function() {
  clearTimeouts();
  if (!vidOver && thumbnail.style.display !== 'block') removeOneViewer();
  alert('Sync ended, refresh to continue');
  return 'end of viewing';
};
