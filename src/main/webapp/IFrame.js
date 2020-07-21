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

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('ytplayer', {
    events: {
      'onStateChange': onPlayerStateChange, 
      'onPlaybackRateChange': onPlayerPlaybackRateChange
    }
  });
}

function onPlayerStateChange() {
  getTime(); 
  switch(player.getPlayerState()) {
    case 1:
      console.log("now playing"); 
      break; 
    case 0:
      console.log("just ended"); 
      break; 
    case 2:
      console.log("now paused"); 
      break; 
    case 5:
      console.log("now cued"); 
      break; 
    case 3:
      console.log("now buffering"); 
  }
}

// Get the time of the current video
function getTime() {
  console.log(player.getCurrentTime()); 
}

var newTime = 60; 

function setTime(newTime) {
  player.seekTo(newTime, true); 
}

function onPlayerPlaybackRateChange() {
  console.log("new speed: " + player.getPlaybackRate()); 
}

function halfSpeed() {
  player.setPlaybackRate(0.5);
}

function doubleSpeed() {
  player.setPlaybackRate(2); 
}

function normalSpeed() {
  player.setPlaybackRate(1); 
}
