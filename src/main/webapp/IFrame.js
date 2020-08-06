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

let videoUpdating; // is video currently updating to match Firestore info? (Consider deleting this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!)
var autoUpdate; // max time between updates
const SYNC_WINDOW = 5; // max time diff between client and Firestore
const thumbnail = document.getElementById('thumbnailDisplay');
thumbnail.style.display = 'none';

const firestore = firebase.firestore(); // eslint-disable-line no-undef

const urlQueryString = window.location.search;
const params = new URLSearchParams(urlQueryString);
const roomId = params.get('room_id');
const vidDataRef = firestore.collection('rooms').doc(roomId).collection('CurrentVideo').doc('PlaybackData');
const queueDataRef = firestore.collection('rooms').doc(roomId).collection('queue');

let videoIds;
let thumbnails;
let docIds;
async function updateQueue() {
  videoIds = []; // Holds video IDs
  thumbnails = []; // Holds Big THumbnails URLs
  docIds = []; // Holds Firestore Document IDs
  queueDataRef.orderBy('requestTime', 'asc').get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
      const queueData = doc.data();
      docIds.push(doc.id);
      videoIds.push(queueData.videoID);
      const thumbnailString = queueData.bigThumbnailURL;
      const thumbnailURL = thumbnailString.substring(1, thumbnailString.length - 1);
      thumbnails.push(thumbnailURL); 
    });
  })
  .catch(function(error) {
    console.log("Error getting documents: ", error);
  });
}
updateQueue();
queueDataRef.onSnapshot(updateQueue);

function getCurrentVideo() {
  vidDataRef.get().then(function(doc) {
    if (doc && doc.exists) {
      const vidData = doc.data();
      if (vidData.videoId !== ('')) {
        player.loadVideoById({videoId: vidData.videoId});
        switchDisplay();
        if (!justJoined) {
          addOneViewer();
        }
        stopUpdating = false;
      } else {
        getFirstVidFromQueue();
      }
    } else {
      console.log('there was no doc to read!');
    }
  });
}

function getFirstVidFromQueue() {
  if (videoIds.length === 0) {
    console.log('add videos to the queue!');
    setTimeout(getCurrentVideo, 3000);
  } else {
    const firstVid = videoIds[0];
    const firstVidDocId = docIds[0];
    updateVidPlaying(firstVid); 
    player.loadVideoById({videoId: firstVid});
    switchDisplay();
    if (!justJoined) {
      addOneViewer();
    }
    stopUpdating = false;
    setTimeout(function() {
      queueDataRef.doc(firstVidDocId).delete();
    }, SYNC_WINDOW*1000);
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
let justJoined = true;
function onPlayerReady() {
  switchDisplay();
  getCurrentVideo();
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

// switches to thumbnails between videos
const playerTag = document.getElementById('ytplayer');
function switchDisplay() {
  if (playerTag.style.display === 'none') {
    playerTag.style.display = 'block';
  } else {
    playerTag.style.display = 'none';
  }
  if (thumbnail.style.display === 'none') {
    if (thumbnails.length > 0) thumbnail.src = thumbnails[0]; 
    else thumbnail.src = '/images/LoungeLogo.png'
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
        SYNC_WINDOW*1000*0.75);
  }
}

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

function isVideoPlaying() {
  return (player.getPlayerState() !== 2);
}

function updateInfo(goal) { // send info to Firestore
  vidDataRef.update({
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
let pauseStoppedInterval = false; // Tells when videos are paused
let bufferTimeout; // Finds when user's video has fallen behind
let stopUpdating = false; // makes code ignore ended videos
let vidOver = false; // limits checks to start next video

function clearTimeouts() {
  clearTimeout(pauseTimeout);
  clearTimeout(bufferTimeout);
  clearTimeout(autoUpdate);
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
        if (!catchingUp && !videoUpdating) {
          pauseTimeout = setTimeout(updateInfo, 100, 'pause');
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
  if (!videoUpdating && !catchingUp && !stopUpdating) {
    updateInfo('Change Speed');
  }
}

function catchUserUp() {
  vidDataRef.get().then(function(doc) {
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
        SYNC_WINDOW*1000*0.75);
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
    if (!stopUpdating) {
      autoUpdate = setTimeout(regularFirestoreUpdate,
          SYNC_WINDOW*1000);
    }
  });
}

function regularFirestoreUpdate() {
  if (!stopUpdating) updateInfo('update');
  autoUpdate = setTimeout(function() {
    if (!stopUpdating && !aboutToEnd()) regularFirestoreUpdate();
  }, SYNC_WINDOW*1000*0.75);
}
