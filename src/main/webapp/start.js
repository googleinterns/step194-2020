// Initializes resources for reading/writing to Firestore
const firebaseConfig = {
  apiKey: config.apiKey, // eslint-disable-line no-undef
  authDomain: 'lounge-95f01.firebaseapp.com',
  databaseURL: 'https://lounge-95f01.firebaseio.com',
  projectId: 'youtube-lounge',
  storageBucket: 'youtube-lounge.appspot.com',
  messagingSenderId: config.messagingSenderId, // eslint-disable-line no-undef
  appId: config.appId, // eslint-disable-line no-undef
  measurementId: config.measurementId, // eslint-disable-line no-undef
};
const app =
    firebase.initializeApp(firebaseConfig); // eslint-disable-line no-undef
db = firebase.firestore(app); // eslint-disable-line no-undef
let startButtonCount = 0;
/* exported startRoom */
// Takes the user to the lounge page when the start button is pressed
async function startRoom() {
  if (startButtonCount < 1) {
    db.collection('rooms').add({ // eslint-disable-line no-undef
      duration: '0',
      elapsedTime: '0',
    })
      .then(function(docRef) {
        window.location.href = 'lounge.html/?room_id=' + docRef.id;
      });
    startButtonCount++;
  }
}
