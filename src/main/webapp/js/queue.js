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
    getVideoData(document.getElementById('linkArea').value.substring(32));
  } else { // starting a room
    console.log('good structure!');
    getVideoData(document.getElementById('linkArea').value.substring(32));
  }
}

// Retrieve video and create a new room via servlet GET request
async function getVideoData(id) {
  if (id == '') {
    return;
  }
  fetch('/vSearch?id=' + id)
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
