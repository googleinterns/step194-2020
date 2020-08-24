const functions = require('firebase-functions');

// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp();


// Adds a message that welcomes new users into the chat.
exports.addWelcomeMessages = functions.auth.user().onCreate(async (user) => {
  console.log('A new user signed in for the first time.');
  const fullName = user.name || 'Anonymous';

  // Saves the new welcome message into the database
  // which then displays it in the FriendlyChat clients.
  await admin.firestore().collection('rooms').doc(roomId)
      .collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${fullName} joined the room! Welcome!`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Welcome message written to database.');
});

exports.addLeaveMessages = functions.auth.user().onDelete(async (user) => {
  console.log('A new user signed in for the first time.');
  const fullName = user.name || 'Anonymous';

  // Saves the new welcome message into the database
  // which then displays it in the FriendlyChat clients.
  await admin.firestore().collection('rooms').doc(docRef.id)
      .collection('messages').add({
    name: 'Lounge Bot',
    profilePicUrl: '/images/LoungeLogo.png',
    text: `${fullName} left the room!`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Welcome message written to database.');
});


exports.updatePlayBack = functions.firestore.document('rooms/{roomId}/CurrentVideo/{PlaybackData}').onUpdate((change, context) => {
      // Get an object representing the document
      const newValue = change.after.data();

      // access a particular field 
      const isPlaying = newValue.isPlaying;
        if (isPlaying == true) {
            admin.firestore().collection('rooms').doc(roomId).collection('messages').add({
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
