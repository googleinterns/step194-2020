db = firebase.firestore(); // eslint-disable-line no-undef
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
          db.collection('rooms').doc(docRef.id) // eslint-disable-line no-undef
              .collection('CurrentVideo')
              .doc('PlaybackData').set({
                numPeopleWatching: 0,
                isPlaying: false,
                videoSpeed: 1,
                videoId: '',
                timestamp: 0,
              }).then(function() {
                console.log('Playback successfully written!');
              }).catch(function(error) {
                console.error('Error writing Playback: ', error);
              });
          alert('Share this link with your friends!\n' +
            'https://youtube-lounge.appspot.com/lounge.html/?room_id' +
            docRef.id);
          window.location.href = 'lounge.html/?room_id=' + docRef.id;
        });
    startButtonCount++;
  }
}
