window.addEventListener('load', (event) => {
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
    // firebase.initializeApp(firebaseConfig); // eslint-disable-line no-undef
    // const firestore = firebase.firestore(); // eslint-disable-line no-undef
    var app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore(app);
    // db.collection("rooms").doc("5uswrs9RkWJkp70X3WKw").collection("information")
    //   .doc("queue")
    //   .onSnapshot(function(doc) {
    //       console.log(doc.data());
    //   });
    const interval = setInterval(function() {
        getRoomQueue("5uswrs9RkWJkp70X3WKw");
    });
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
  if (!url.match(validator)) {
    console.log('false'); // signal bad url to user
  } else if (document.getElementById('ytplayer') != null) {
    console.log('good structure!');
    getVideoData(document.getElementById('linkArea').value.substring(32));
  } else { // starting a room
    console.log('good, starting a room!');
    // getVideoData(document.getElementById('linkArea').value.substring(32));
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
        if (video.error == null) { // video was found, now load
          // put thumbnail, title, duration, and channel name onto page
          console.log("VIDEO FOUND");
          //display box indicating video added successfully
        } else { // video wasn't found, signal error to user
          console.log('NO VIDEO FOUND');
          //display box indicating video wasn't added
        }
        console.log(video);
      });
    document.getElementById('linkArea').value = "";
}

async function getRoomQueue(roomid) {
  if (roomid == '') {
      console.log('NO ROOM ID PROVIDED');
  }
  fetch('/queueRefresh?roomid=' + roomid)
      .then((response) => response.json())
      .then((queue) => {
        if (queue != null) {
          console.log(queue);
          let videoCount = document.getElementById('videoContainer').childElementCount;
          for (let i = videoCount; i < queue.length; i++) {
            document.getElementById('videoContainer').innerHTML +=
              '<div id="video' + videoCount + '" class="queueVideo">' +
              '<img class="videoThumbnail" src="' + 
              queue[i].thumbnailURL.substring(1, queue[i].thumbnailURL.length - 1) + 
              '"/><div id="video' + videoCount + 'Info" class="videoInfo">' +
              '<p class="videoTitle">' + 
              queue[i].title.substring(1, queue[i].title.length - 1) + '</p>' +
              '<button class="removeVideoBtn" id="removeVideoBtn' + 
              videoCount + 
              '" onclick="removeVideo(document.getElementById(\'video' + 
              (videoCount + 1) + '\'))">' +
              '<img src="images/remove-from-queue.svg"/>' +'</button>' +
              '<p>' + parseTime(queue[i].duration)+ '</p>' +
              '</div></div>';
          }
        } else {
          console.log("NO QUEUE FOUND");
        } 
      });
}

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

// /* exported getVideoDataWithRoom */
// // Within a room, so just add video to room's queue via room ID
// async function getVideoDataWithRoom(id, room) {
//   if (id == '' || room == '') {
//     return;
//   }
//   fetch('/vSearch?id=' + id + '&room=' + room)
//       .then((response) => response.json())
//       .then((video) => {
//         if (video.error != null) { // video was found, now load
//           // put thumbnail, title, duration, and channel name onto page
//           console.log(video);
//         } else { // video wasn't found, signal error to user
//           console.log(video.error);
//         }
//       });
// }
