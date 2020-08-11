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
