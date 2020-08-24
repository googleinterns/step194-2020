const functions = require('firebase-functions');

// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp();


// Adds a message that welcomes new users into the chat.
exports.addWelcomeMessages = functions.firestore.document('rooms/{roomId}/guests/{guestId}').onCreate((snap, context) => {
  console.log('A new user signed in for the first time.');
  const newValue = snap.data();

  const userName = newValue.name;
  console.log(userName);

  // Saves the new welcome message into the database
  admin.firestore().collection('rooms').doc(roomId).collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${userName} joined the room! Welcome!`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Welcome message written to database.');
});

exports.addLeaveMessages = functions.firestore.document('rooms/{roomId}/guests/{guestId}').onDelete((snap, context) => {
  console.log('A user left the room');
  const deletedValue = snap.data();

  const userName = deletedValue.name;

  // Saves the leave message into the database
  admin.firestore().doc('rooms/roomId/messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${userName} left the room!`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Leave message written to database.');
});


exports.updatePlayBack = functions.firestore.document('rooms/{roomId}/CurrentVideo/{PlaybackData}').onUpdate((change, context) => {
     console.log('video change state');
      // Get an object representing the document
      const changeValue = change.after.data();

      // access a particular field 
      const isPlaying = changeValue.isPlaying;
        if (isPlaying == true) {
            admin.firestore().document('rooms/{roomId}/messages').add({
            name: 'Lounge Bot',
            profilePicUrl: '/images/LoungeLogo.png',
            text: `Video is playing`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        } else {
           admin.firestore().collection('rooms').doc(roomId).collection('messages').add({
            name: 'Lounge Bot',
            profilePicUrl: '/images/LoungeLogo.png',
            text: `Video is paused`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            }); 
        }
    });
