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
          alert('Share this link with your friends!\n' +
            'https://youtube-lounge.appspot.com/lounge.html/?room_id' 
            + docRef.id);
          window.location.href = 'lounge.html/?room_id=' + docRef.id;
        });
    startButtonCount++;
  }
}
