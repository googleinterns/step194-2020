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

let videoUpdating; // boolean for when server request is updating video
let player;
function onYouTubeIframeAPIReady() { // eslint-disable-line no-unused-vars
  player = new YT.Player('ytplayer', { // eslint-disable-line no-undef
    events: {
      'onStateChange': onPlayerStateChange,
      'onPlaybackRateChange': onPlayerPlaybackRateChange,
    },
  });
}

function sendInfo(playing) {
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      console.log('Request sent');
    }
  };
  xhttp.open('POST', '/Playback-Test', true);
  xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  const time = player.getCurrentTime();
  const speed = player.getPlaybackRate();
  xhttp.send('timestamp=' + time + '&videoSpeed=' + speed + '&isPlaying='+
    playing);
}

let timeout;
function onPlayerStateChange() {
  console.log(player.getPlayerState());
  if (!videoUpdating) {
    switch (player.getPlayerState()) {
      case 1: // Playing
        clearTimeout(timeout);
        sendInfo(true);
        break;
      case 2: // paused
        timeout = setTimeout(sendInfo, 100, false);
        break;
      case 3: // Buffering
        clearTimeout(timeout);
        break;
      case -1: // Just before video starts
        beginFetchingLoop();
        break;
      case 0: // Ended
        endFetchingLoop();
    }
  }
}

// Get the time of the current video
function getTime() { // eslint-disable-line no-unused-vars
  console.log(player.getCurrentTime());
}

function setTime() { // eslint-disable-line no-unused-vars
  player.seekTo(60, true);
}

function onPlayerPlaybackRateChange() {
  if (!videoUpdating) sendInfo(player.getPlayerState() === 1);
}

function halfSpeed() { // eslint-disable-line no-unused-vars
  player.setPlaybackRate(0.5);
}

function doubleSpeed() { // eslint-disable-line no-unused-vars
  player.setPlaybackRate(2);
}

function normalSpeed() { // eslint-disable-line no-unused-vars
  player.setPlaybackRate(1);
}

function fetchData() {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      updateVideo(this.responseText);
    }
  };
  request.open('GET', '/Playback-Test', true);
  request.send();
}

const SYNC_WINDOW = 3; // max time diff between client and server
// return true if player time is within 5 seconds of master time
function timesInRange(serverVidTime) {
  return Math.abs(player.getCurrentTime() - serverVidTime) < SYNC_WINDOW;
}

// return true if player state is different than master state
function differentStates(serverVidIsPlaying) {
  if (player.getPlayerState() != 1) { // player paused
    if (serverVidIsPlaying) { // master playing
      return true;
    }
    return false;
  }
  if (!serverVidIsPlaying) {
    return true;
  }
  return false;
}

const FETCH_PERIOD = 1.5; // time between information retreival in seconds
const NUM_MEMBERS = 2; // number of room participants
function updateVideo(text) {
  console.log(text);
  const videoInfo = JSON.parse(text);
  videoUpdating = true;
  if (!timesInRange(videoInfo.timestamp)) {
    player.seekTo(videoInfo.timestamp - (FETCH_PERIOD / NUM_MEMBERS), true);
  }
  if (differentStates(videoInfo.isPlaying)) {
    switch (videoInfo.isPlaying) {
      case true:
        player.playVideo();
        break;
      case false:
        player.pauseVideo();
        player.seekTo(videoInfo.timestamp, true);
    }
  }
  if (player.getPlaybackRate() != videoInfo.videoSpeed) {
    player.setPlaybackRate(videoInfo.videoSpeed);
  }
  videoUpdating = false;
}

let fetchingInterval; // Interval to retrieve information
function beginFetchingLoop() {
  clearInterval(fetchingInterval);
  fetchingInterval = setInterval(fetchData, FETCH_PERIOD*1000);
}

function endFetchingLoop() {
  clearInterval(fetchingInterval);
}
