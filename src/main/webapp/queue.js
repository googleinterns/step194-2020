/* exported verifyURLStructure */
/*
  Makes sure the stub of the user's URL is valid and will warn user
  if their link wasn't formatted correctly for the server to parse.
*/
function verifyURLStructure(url) {
  const validator = new RegExp('' +
    /(^(?:https?:\/\/)?(?:www\.)?)/.source +
    /((?:youtu\.be\/|youtube\.com\/))/.source +
    /((?:embed\/|v\/|watch\?v=|watch\?.+&v=))/.source +
    /((\w|-){11})(?:\S+)?$/.source,
  ); // regex for youtube link validation
  if (!url.match(validator)) {
    console.log('false'); // signal bad url to user
  } else if (document.getElementById('videoplayer') != null) {
    console.log('good structure!');
    console.log("vid count " + (document.getElementById('videoContainer').childElementCount - 1));
    getVideoData(document.getElementById('linkArea').value.substring(32));
  } else { // starting a room
    console.log('good, starting a room!');
    getVideoData(document.getElementById('linkArea').value.substring(32));
  }
}

// Retrieve video and create a new room via servlet GET request
async function getVideoData(id) {
  if (id == '') {
    console.log("NO ID");
    return;
  }
  console.log("FETCHING");
  fetch('/vSearch?id=' + id)
      .then((response) => response.json())
      .then((video) => {
        if (video.error != null) { // video was found, now load
          // put thumbnail, title, duration, and channel name onto page
          console.log("ADDING TO HTML");
          let videoCount = document.getElementById('videoContainer').childElementCount - 1;
          console.log("vid count" + videoCount);
          document.getElementById('videoContainer').innerHTML +=
            '<div id="video' + (videoCount + 1) + '" class="queueVideo">' +
            '<img class="videoThumbnail" src=' + video.items[0].snippet.thumbnails.medium.url + '/>' +
            '<div id="video' + (videoCount + 1) + 'Info" class="videoInfo">' +
            '<p class="videoTitle">' + video.items[0].snippet.title + '</p>' +
            '<button class="removeVideoBtn" id="removeVideoBtn' + (videoCount + 1) + 
            '" onclick="removeVideo(document.getElementById(\'video' + (videoCount + 1) + '\'))">' +
            '<img src="images/remove-from-queue.svg"/>' +
            '</button>' +
            '<p>' + video.items[0].contentDetails.duration + '</p>' +
            '</div></div>';
        } else { // video wasn't found, signal error to user
          console.log("NO VIDEO FOUND");
        }
      });
}

/* exported getVideoDataWithRoom */
// Within a room, so just add video to room's queue via room ID
async function getVideoDataWithRoom(id, room) {
  if (id == '' || room == '') {
    return;
  }
  fetch('/vSearch?id=' + id + '&room=' + room)
      .then((response) => response.json())
      .then((video) => {
        if (video.error != null) { // video was found, now load
          // put thumbnail, title, duration, and channel name onto page
          console.log(video);
        } else { // video wasn't found, signal error to user
          console.log(video.error);
        }
      });
}
