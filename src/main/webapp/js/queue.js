/*
  Makes sure the stub of the user's URL is valid and will warn user
  if their link wasn't formatted correctly for the server to parse.
*/
function verifyURLStructure(url) {
  if (!url.includes("https://www.youtube.com/watch?v=") || url.length <= 32) {
    console.log("false"); //signal bad url to user
  }
  else if (document.getElementById("videoplayer") != null) { //already in a room
    console.log("good structure!");
    getVideoData(document.getElementById("linkArea").value.substring(32));
  }
  else { //starting a room
    console.log("good structure!");
    getVideoData(document.getElementById("linkArea").value.substring(32));
  }
}

//Retrieve video and create a new room via servlet GET request
async function getVideoData(id) {
  if (id == "") {
    return;
  }
  fetch("/vSearch?id=" + id)
  .then(response => response.json())
  .then((video) => {
    if (video.error != null) { //video was found, now load it into the website
      //put thumbnail, title, duration, and channel name onto page
      console.log(video);
    }
    else { //video wasn't found, signal error to user
      console.log(video.error);
    }
  });
}

//Within a room, so just add video to room's queue via room ID
async function getVideoData(id, room) {
  if (id == "" || room == "") {
    return;
  }
  fetch("/vSearch?id=" + id + "&room=" + room)
  .then(response => response.json())
  .then((video) => {
    if (video.error != null) { //video was found, now load it into the website
      //put thumbnail, title, duration, and channel name onto page
      console.log(video);
    }
    else { //video wasn't found, signal error to user
      console.log(video.error);
    }
  });
}