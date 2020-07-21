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

let player = null;
function onYouTubeIframeAPIReady() {  // eslint-disable-line no-unused-vars
  player = new YT.Player('ytplayer', { // eslint-disable-line no-undef
    events: {
      'onStateChange': onPlayerStateChange,
      'onPlaybackRateChange': onPlayerPlaybackRateChange,
    }
  });
}

function onPlayerStateChange() {
  getTime();
  switch (player.getPlayerState()) {
    case 1:
      console.log('now playing');
      break;
    case 0:
      console.log('just ended');
      break;
    case 2:
      console.log('now paused');
      break;
    case 5:
      console.log('now cued');
      break;
    case 3:
      console.log('now buffering');
  }
}

// Get the time of the current video
function getTime() {
  console.log(player.getCurrentTime());
}

const newTime = 60; // eslint-disable-line no-unused-vars
function setTime(newTime) { // eslint-disable-line no-unused-vars
  player.seekTo(newTime, true);
}

function onPlayerPlaybackRateChange() {
  console.log('new speed: ' + player.getPlaybackRate());
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
