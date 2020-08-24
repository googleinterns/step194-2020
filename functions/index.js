const functions = require('firebase-functions');

// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp();


// Adds a message that welcomes new users into the chat.
exports.addWelcomeMessages = functions.firestore.document('rooms/{roomId}/guests/{guestId}').onCreate((snap, context) => {
  const roomID = context.params.roomId;
  console.log('A new user signed in for the first time.');
  const newValue = snap.data();

  const userName = newValue.name;
  console.log(userName);

  // Saves the new welcome message into the database
  admin.firestore().collection('rooms').doc(roomID).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${userName} joined the room! Welcome!`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Welcome message written to database.');
});

exports.addLeaveMessages = functions.firestore.document('rooms/{roomId}/guests/{guestId}').onDelete((snap, context) => {
  const roomID = context.params.roomId;
  console.log('A user left the room');
  const deletedValue = snap.data();

  const userName = deletedValue.name;

  // Saves the leave message into the database
  admin.firestore().collection('rooms').doc(roomID).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${userName} left the room!`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Leave message written to database.');
});


exports.updatePlayBack = functions.firestore.document('rooms/{roomId}/CurrentVideo/{PlaybackData}').onUpdate((change, context) => {
  const roomID = context.params.roomId;
  console.log('video change state');
  // Get an object representing the document
 const previousValue = change.before.data();
  const changeValue = change.after.data();

  // access a particular field 
  const isPlaying = changeValue.isPlaying;
  const timestampNow = changeValue.timestamp;
  const timestampBefore = previousValue.timestamp;

  if (isPlaying == false && timestampNow !== 0){
  admin.firestore().collection('rooms').doc(roomID).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `Video paused`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
   if (Math.abs(timestampNow - timestampBefore) > 5){
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
    seconds = '0' + Math.trunc(seconds);
    }
  const formattedTime =  result + minutes + ':' + seconds;
  admin.firestore().collection('rooms').doc(roomID).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `Video moved to ${formattedTime}`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

exports.addToQueue = functions.firestore.document('rooms/{roomId}/queue/{queueId}').onCreate((snap, context) => {
  const roomID = context.params.roomId;
  console.log('video change state');
      // Get an object representing the document
  const deletedVideo = snap.data();

      // access a particular field 
   const videoTitle = deletedVideo.title;
   admin.firestore().collection('rooms').doc(roomID).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${videoTitle} was added to the queue`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
});
