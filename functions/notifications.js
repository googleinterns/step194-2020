/* eslint-disable */
const functions = require('firebase-functions');

// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp();


// Adds a message that welcomes new users into the chat
// when a document is created on the guest list.
exports.addWelcomeMessages = functions.firestore
.document('rooms/{roomId}/guests/{guestId}').onCreate((snap, context) => {

  const roomID = context.params.roomId;
  const newValue = snap.data();
  const userName = newValue.name;

  // Saves the new welcome message into the database messages collection
  admin.firestore().collection('rooms').doc(roomID).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${userName} joined the room! Welcome!`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Welcome message written to database.');
});

// when a user is deleted off the guest list  or signs out
// a leave message is inputted into the chat
exports.addLeaveMessages = functions.firestore
.document('rooms/{roomId}/guests/{guestId}').onDelete((snap, context) => {

  const roomID = context.params.roomId;
  const deletedValue = snap.data();
  const userName = deletedValue.name;

  admin.firestore().collection('rooms').doc(roomID).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${userName} left the room`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Leave message written to database.');
});

/** On update of the video playback data the chat sent notifications.
    Users are aware when the video is paused and played
    Also when the timestamp of the video is moved outside the sync
    window */
exports.updatePlayBack = functions.firestore 
.document('rooms/{roomId}/CurrentVideo/{PlaybackData}').onUpdate((change, context) => {

  const roomID = context.params.roomId;
  console.log('video change state');

  function BotMessage(BotText) {
    admin.firestore().collection('rooms').doc(roomID)
    .collection('messages').add({
      name: 'Lounge Bot',
      profilePicUrl: '/images/LoungeLogo.png',
      text: BotText,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Get an object representing the document
  const previousValue = change.before.data();
  const changeValue = change.after.data();

  // access a particular field
  const isPlaying = changeValue.isPlaying;
  const previousVideoState = previousValue.isPlaying;
  const timestampNow = changeValue.timestamp;
  const timestampBefore = previousValue.timestamp;
  const previousSpeed = previousValue.videoSpeed;
  const videoSpeed = changeValue.videoSpeed;


  if (isPlaying == false && timestampNow !== 0) {
    BotMessage(`Video paused`);
  }
  /** notifies user if video is playing after prevously being paused 
      except at beginning of video to prevent repeated messages */
  if (previousVideoState == false && timestampNow > 1) {
    BotMessage(`Video is playing`);
  }
  
  /**  records instances when the timestamp changes outside the sync window */
  /** higher videospeeds cause the timestamp to be jumpy and messages to
    print irregularly so timestamp changes occuring at higher speeds are ignored */
  if (Math.abs(timestampNow - timestampBefore) > 5 && videoSpeed <= 1 
  && previousSpeed == videoSpeed) {
    let minutes = 0;
    let seconds = 0;
    let hours = 0;
    let result = '';
    hours = (timestampNow / 3600) | 0;
    minutes = ((timestampNow - (hours * 3600)) / 60) | 0;
    seconds = timestampNow - (hours * 3600) - (minutes * 60);
    if (hours > 0) {
      result += hours + ':';
    }
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    const formattedTime = result + minutes + ':' + Math.trunc(seconds);
    BotMessage(`Video timestamp moved to ${formattedTime}`);
  }
});

// notifies chat when a new video is added to the queue
exports.addToQueue = functions.firestore
.document('rooms/{roomId}/queue/{queueId}').onCreate((snap, context) => {

  const roomID = context.params.roomId;
  const deletedVideo = snap.data();
  const videoTitle = deletedVideo.title;

  admin.firestore().collection('rooms').doc(roomID).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${videoTitle} was added to the queue`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
    console.log('Queue message written to database.');
});
