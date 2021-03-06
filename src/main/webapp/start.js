db = firebase.firestore(); // eslint-disable-line no-undef
let startButtonCount = 0;
/* exported startRoom */
// Takes the user to the lounge page when the start button is pressed
async function startRoom() {
  if (startButtonCount < 1) {
    await db.collection('rooms').add({ // eslint-disable-line no-undef
      created: firebase // eslint-disable-line no-undef
          .firestore.Timestamp.fromDate(new Date()),
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
                votesToSkipVideo: 0,
              }).then(function() {
                console.log('Playback successfully written!');
              }).catch(function(error) {
                console.error('Error writing Playback: ', error);
              });
          window.location.href = 'lounge.html?room_id=' + docRef.id;
        });
    startButtonCount++;
  }
}
