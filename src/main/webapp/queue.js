//Initializes resources for reading/writing to Firestore
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: 'lounge-95f01.firebaseapp.com',
  databaseURL: 'https://lounge-95f01.firebaseio.com',
  projectId: 'youtube-lounge',
  storageBucket: 'youtube-lounge.appspot.com',
  messagingSenderId: '681171972170',
  appId: '1:681171972170:web:4c6526b8eb788af9d876b3',
  measurementId: 'G-JSDHBSMHS3',
};
var app = firebase.initializeApp(firebaseConfig);
db = firebase.firestore(app);

//Track realtime changes to the database and update the visual queue on change
//hardcoded for one room for now, can access different rooms through
//window.location.search property
db.collection("rooms").doc("47jGbulshBCjcc8YOt8a").collection("information")
    .doc("queue").collection("videos")
        .onSnapshot(function(snapshot) {
            snapshot.docChanges().forEach(function(change) {
                if (change.type === "added") {
                    console.log("added: ", change.doc.data());
                }
                if (change.type === "modified") {
                    console.log("modified: ", change.doc.data());
                }
                if (change.type === "removed") {
                    console.log("removed: ", change.doc.data());
                }
            });
            getRoomQueue("47jGbulshBCjcc8YOt8a");
        });

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
  if (!url.match(validator)) { // signal bad link to user
    document.getElementById("linkError").style.display = "block";
    document.getElementById("videoError").style.display = "none";
  } else if (document.getElementById('ytplayer') != null) {
    getVideoData(document.getElementById('linkArea').value.substring(32));
  }
}

// Retrieve video and create a new room via servlet GET request
async function getVideoData(id) {
  if (id == '') {
    console.log('NO ID');
    return;
  }
  fetch('/vSearch?id=' + id)
      .then((response) => response.json())
      .then((video) => {
        if (video.error == null) { // video was found, add to firestore
          console.log("VIDEO FOUND");
          document.getElementById("linkError").style.display = "none";
          document.getElementById("videoError").style.display = "none";
        } else if (video.items.length == 0) { // video not found, error
          console.log('NO VIDEO FOUND');
          document.getElementById("linkError").style.display = "none";
          document.getElementById("videoError").style.display = "block";
        }
        console.log(video);
      });
  document.getElementById('linkArea').value = "";
}

/**
 * Determines if the given video name exists within the database, then deletes
 * it if found.
 */
async function removeVideo(roomid, name) {
  let selectedVideo = await db
      .collection("rooms")
      .doc(roomid)
      .collection("information")
      .doc("queue")
      .collection("videos")
      .doc(name)
      .get();
  if (selectedVideo.exists) {
    await db
        .collection("rooms")
        .doc(roomid)
        .collection("information")
        .doc("queue")
        .collection("videos")
        .doc(name)
        .delete();
    console.log("Video " + name + " deleted");
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
  }
  let videosArray = await db
      .collection("rooms")
      .doc(roomid)
      .collection("information")
      .doc("queue")
      .collection("videos")
      .orderBy("requestTime", "asc")
      .get();
  console.log("videos array: " + videosArray);
  let room = "47jGbulshBCjcc8YOt8a";
  fetch('/queueRefresh?roomid=' + roomid)
      .then((response) => response.json())
      .then((queue) => {
        if (queue != null) {
          console.log(queue);
          document.getElementById("videoContainer").innerHTML = "";
          let videoCount =
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
              '<button class="removeVideoBtn" id="removeVideoBtn' + 
              i + 
              '" onclick="removeVideo(\'' + room + '\',\'' + 
              videosArray.docs[i].id + '\')">' +
              '<img src="images/remove-from-queue.svg"/>' +'</button>' +
              '<p>' + parseTime(queue[i].duration)+ '</p>' +
              '</div></div>';
          }
        } else {
          console.log("NO QUEUE FOUND");
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
  let result = "";
  hours = (duration / 3600) | 0;
  minutes = ((duration - (hours * 3600)) / 60) | 0;
  seconds = duration - (hours * 3600) - (minutes * 60);
  if (hours > 0) {
    result += hours + ":";
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return result + minutes + ":" + seconds;
}
