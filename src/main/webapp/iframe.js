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
// These factors shorten the sync window variable in cases where time
// for Firestore has to be accounted for or a call must be made
// faster on one client than others.
const SLOW_UPDATE_FACTOR = 0.85;
const FAST_UPDATE_FACTOR = 0.7;
const thumbnail = document.getElementById('thumbnailDisplay');
thumbnail.style.display = 'none';
const errorTag = document.getElementById('playerErrorContainer');
errorTag.style.display = 'none';
const skipVoteTag = document.getElementById('skipContainer');


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
          nextDocID = doc.id;
          nextVidID = queueData.videoID;
          const thumbnailString = queueData.thumbnailURL;
          const thumbnailURL = thumbnailString.substring(1,
              thumbnailString.length - 1);
          nextThumbnail = thumbnailURL;
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
      'onError': onPlayerError,
    },
  });
}

let errorMessage;
function onPlayerError(event) {
  resetPlaybackInfo();
  errorTag.style.display = 'block';
  skipVoteTag.style.display = 'none';
  const error = event.data;
  switch (error) {
    case 2:
      errorMessage = 'Video ID incorrect';
      break;
    case 5:
      errorMessage = 'HTML 5 playyer issue';
      break;
    case 100:
      errorMessage = 'video not found (removed or private)';
      break;
    case 101:
      errorMessage = 'video owner blocks embed';
      break;
    case 150:
      errorMessage = 'video owner blocks embed';
  }
  console.log(errorMessage);
  setTimeout(function() {
    stopUpdating = true;
    switchDisplay();
    errorTag.style.display = 'none';
    skipVoteTag.style.display = 'block';
    removeOneViewer();
    getCurrentVideo();
  }, 4000); // give users time to read player error
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
    votesToSkipVideo: 0,
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
    numPeopleWatching: firebase.firestore // eslint-disable-line no-undef
        .FieldValue.increment(-1),
  }).then(function() {
    console.log('removed one viewer');
  });
}

function addOneViewer() {
  vidDataRef.update({
    numPeopleWatching: firebase.firestore // eslint-disable-line no-undef
        .FieldValue.increment(1),
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
  if (!stopUpdating && !videoUpdating) {
    vidDataRef.update({
      isPlaying: isVideoPlaying(),
      timestamp: player.getCurrentTime(),
      videoSpeed: player.getPlaybackRate(),
    }).then(function() {
      console.log(goal + ' request sent');
      clearTimeout(autoUpdate);
      autoUpdate = setTimeout(function() {
        if (!stopUpdating && !aboutToEnd() && isVideoPlaying()) {
          updateInfo('auto');
        }
      }, SYNC_WINDOW * 1000 * FAST_UPDATE_FACTOR);
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
        if (!videoUpdating && !catchingUp) {
          updateInfo('play');
        }
        alignWithFirestore();
        break;
      case 2: // paused
        if (!videoUpdating && !catchingUp) {
          pauseTimeout = setTimeout(updateInfo, 500, 'pause');
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
        vidDataRef.update({
          timestamp: player.getDuration(),
          isPlaying: true,
        }).then(function() {
          console.log('end request sent');
        }).catch(function(error) {
          console.log('end caused an error: ', error);
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
          SYNC_WINDOW * 1000 * SLOW_UPDATE_FACTOR);
    }
  });
}

function getRealtimeUpdates() {
  vidDataRef.onSnapshot(function(doc) {
    clearTimeout(autoUpdate);
    if (doc && doc.exists) {
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
        if (differentStates(vidData.isPlaying)) {
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
    }
    if (isVideoPlaying()) {
      autoUpdate = setTimeout(updateInfo,
          SYNC_WINDOW * 1000 * SLOW_UPDATE_FACTOR, 'auto');
    }
  });
}

window.onbeforeunload = function() {
  clearTimeouts();
  if (!vidOver && thumbnail.style.display === 'none') {
    removeOneViewer();
  }
  return 'end of viewing';
};
