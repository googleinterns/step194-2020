db = firebase.firestore(); // eslint-disable-line no-undef
const queryValue = window.location.search;
const urlParameters = new URLSearchParams(queryValue);
const roomParameters = urlParameters.get('room_id');
var voteBtnCount = 0;
validateRoom();
updateShareTab();

// Track realtime changes to the database and update the visual queue on change
// hardcoded for one room for now, can access different rooms through
// window.location.search property
db.collection('rooms') // eslint-disable-line no-undef
    .doc(roomParameters)
    .collection('queue')
    .onSnapshot(function(snapshot) {
      getRoomQueue(roomParameters);
    });

db.collection('rooms') // eslint-disable-line no-undef
    .doc(roomParameters)
    .collection('CurrentVideo')
    .doc('PlaybackData')
    .onSnapshot(function(snapshot) {
      if (snapshot.get('videoId') == '') {
        document.getElementById('skipBtn').disabled = true;
      } else {
        document.getElementById('skipBtn').disabled = false;
      }
      document.getElementById('skipCounter').innerHTML =
          'Votes to skip video: ' + snapshot.get('skipVotes');
      if (snapshot.get('skipVotes') >= snapshot.get('numPeopleWatching')/2
          && snapshot.get('videoId') != '') {
        console.log('Votes to skip acquired, skipping current video');
        resetSkips();
      }
    });

// Find the roomid in the url query parameters and send to error page if the
// room given hasn't been created or if no room was passed in the url
async function validateRoom() {
  if (roomParameters === null) { // verify that we were passed a room identifier
    window.location.href = '../error.html';
  } else {
    const verifyRoom =
        await db.collection('rooms') // eslint-disable-line no-undef
            .doc(roomParameters)
            .get();
    if (!verifyRoom.exists) { // verify room exists in firestore
      window.location.href = '../error.html';
    }
  }
}

// Initializes share tab with lounge's link
function updateShareTab() {
  document.getElementById('share').innerHTML =
      '<div id="linkInfo">' +
      '<h6>Click the button to copy this lounge\'s link:</h6>' +
      '<button id="copyBtn" onclick="copyLink()">' +
      '<span id="shareImg" class="material-icons">content_copy</span>' +
      '</button>' +
      '</div>' +
      '<input id="loungeLink" value="https://www.youtube-lounge.appspot.com/' +
      'lounge.html/?room_id='+ roomParameters +'" type="text" readonly</input>';
}

function voteToSkip() {
    voteBtnCount++;
    if (voteBtnCount % 2 == 1) {
        db.collection('rooms')
            .doc(roomParameters)
            .collection('CurrentVideo')
            .doc('PlaybackData')
            .update({
              skipVotes : firebase.firestore.FieldValue.increment(1),
            }).then(function() {
                console.log('votes incremented');
            }).catch(function(error) {
                console.log('voting caused an error: ', error);
            });
    } else if (voteBtnCount % 2 == 0) {
        db.collection('rooms')
            .doc(roomParameters)
            .collection('CurrentVideo')
            .doc('PlaybackData')
            .update({
              skipVotes : firebase.firestore.FieldValue.increment(-1),
            }).then(function() {
                console.log('votes decremented');
            }).catch(function(error) {
                console.log('voting caused an error: ', error);
            });
    }
    setTimeout(2000);
}

function resetSkips() {
    voteBtnCount = 0;
    db.collection('rooms')
        .doc(roomParameters)
        .collection('CurrentVideo')
        .doc('PlaybackData')
        .update({
            skipVotes: 0,
            videoId: '',
        }).then(function() {
            switchDisplay();
            getCurrentVideo();
            console.log("resetting skip counter");
        }).catch(function(error) {
            console.log('skips could not be reset: ', error);
        });
}

/* exported verifyURLStructure */
/*
  Makes sure the stub of the user's URL is valid and will warn user
  if their link wasn't formatted correctly for the server to parse.
*/
async function verifyURLStructure(url) {
  const validator = new RegExp('' +
    /(^(?:https?:\/\/)?(?:www\.)?)/.source +
    /((?:youtu\.be\/|youtube\.com\/))/.source +
    /((?:embed\/|v\/|watch\?v=|watch\?.+&v=))/.source +
    /((\w|-){11})(?:\S+)?$/.source,
  ); // regex for youtube link validation
  if (!url.match(validator)) { // signal bad link to user
    document.getElementById('linkError').style.display = 'block';
    document.getElementById('videoError').style.display = 'none';
  } else if (document.getElementById('ytplayer') != null) {
    const urlQuery = url.substring(url.indexOf('?'));
    const videoParams = new URLSearchParams(urlQuery);
    const videoParam = videoParams.get('v');
    await getVideoData(videoParam);
    await getRoomQueue(roomParameters);
  }
}

// Retrieve video and create a new room via servlet GET request
async function getVideoData(id) {
  if (id == '') {
    console.log('NO ID');
    return;
  }
  await fetch('/vSearch?id=' + id + '&room_id=' + roomParameters)
      .then((response) => response.json())
      .then((video) => {
        if (video.error == null) { // video was found, add to firestore
          document.getElementById('linkError').style.display = 'none';
          document.getElementById('videoError').style.display = 'none';
        } else if (video.items.length == 0) { // video not found, error
          document.getElementById('linkError').style.display = 'none';
          document.getElementById('videoError').style.display = 'block';
        }
        console.log(video);
      });
  getRoomQueue(roomParameters);
  document.getElementById('linkArea').value = '';
}

/* exported removeVideo */
/**
 * Determines if the given video name exists within the database, then deletes
 * it if found.
 */
async function removeVideo(roomid, vidRef) {
  const selectedVideo = await db // eslint-disable-line no-undef
      .collection('rooms')
      .doc(roomid)
      .collection('queue')
      .doc(vidRef)
      .get();
  if (selectedVideo.exists) {
    await db // eslint-disable-line no-undef
        .collection('rooms')
        .doc(roomid)
        .collection('queue')
        .doc(vidRef)
        .delete();
    console.log('Video ' + vidRef + ' deleted');
  }
}

/**
 * Finds the specific room the user belongs to and retrieves all the video
 * objects pertaining to that room. Adds each video to the main lounge page in
 * order of the time they were requested, so the earliest requested video
 * is placed higher on the page than the latest requested video.
 */
async function getRoomQueue(roomid) {
  if (roomid == '') {
    console.log('NO ROOM ID PROVIDED');
    return;
  }
  const videosArray = await db // eslint-disable-line no-undef
      .collection('rooms')
      .doc(roomid)
      .collection('queue')
      .orderBy('requestTime', 'asc')
      .get();
  fetch('/queueRefresh?room_id=' + roomid)
      .then((response) => response.json())
      .then((queue) => {
        document.getElementById('videoContainer').innerHTML = '';
        if (queue != null && queue != undefined && queue.length > 0) {
          const videoCount =
            document.getElementById('videoContainer').childElementCount;
          for (let i = videoCount; i < queue.length; i++) {
            document.getElementById('videoContainer').innerHTML +=
              '<div id="' + videosArray.docs[i].id + '" class="queueVideo">' +
              '<img class="videoThumbnail" src="' +
              queue[i].thumbnailURL.substring(1,
                  queue[i].thumbnailURL.length - 1) +
              '"/><div id="video' + i + 'Info" class="videoInfo">' +
              '<p class="videoTitle">' +
              queue[i].title.substring(1, queue[i].title.length - 1) + '</p>' +
              '<p class="duration">' + parseTime(queue[i].duration)+ '</p>' +
              '<button class="removeVideoBtn" id="removeVideoBtn' +
              i +
              '" onclick="removeVideo(\'' + roomParameters + '\',\'' +
              videosArray.docs[i].id + '\')">' +
              '<img src="../images/remove-from-queue.svg"/>' +'</button>' +
              '</div></div>';
          }
        }
      });
}

/**
 * Takes the number of seconds associated with a video's duration and converts
 * it into a human-readable format of "HH:MM:SS" where the "HH:" may be
 * omitted if the video is less than an hour long.
 */
function parseTime(duration) {
  let minutes = 0;
  let seconds = 0;
  let hours = 0;
  let result = '';
  hours = (duration / 3600) | 0;
  minutes = ((duration - (hours * 3600)) / 60) | 0;
  seconds = duration - (hours * 3600) - (minutes * 60);
  if (hours > 0) {
    result += hours + ':';
  }
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  return result + minutes + ':' + seconds;
}
