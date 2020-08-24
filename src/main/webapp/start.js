db = firebase.firestore(); // eslint-disable-line no-undef
let startButtonCount = 0;
/* exported startRoom */
// Takes the user to the lounge page when the start button is pressed
async function startRoom() {
  if (startButtonCount < 1) {
    await deleteRooms();
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

/**
 * Gathers information on each room contained in firestore, then deletes rooms
 * if they have no guests inside and the room has existed for more than 30
 * minutes
 */
async function deleteRooms() {
  await db.collection('rooms').get() // eslint-disable-line no-undef
      .then(function(querySnapshot) {
        console.log('querySnapshot length' + querySnapshot.size);
        querySnapshot.forEach(function(doc) {
          console.log('doc: ' + doc.id);
          let docTime = 0;
          db.collection('rooms') // eslint-disable-line no-undef
              .doc(doc.id)
              .get()
              .then((snapshot) => {
                docTime = snapshot.data().created.seconds;
              });
          db.collection('rooms') // eslint-disable-line no-undef
              .doc(doc.id).collection('guests').get()
              .then(function(guestShot) {
                console.log('guestShot length: ' + guestShot.size);
                // if no guests in room and 30 minutes since room start
                if ((guestShot.size == 0 || guestShot.size == undefined) &&
                    Math.floor(Date.now()/1000) - docTime >= 900) {
                  deleteCurrentVideo(doc);
                  deleteMessages(doc);
                  deleteQueue(doc);
                  guestShot.forEach(function(gDoc) {
                    db.collection('rooms') // eslint-disable-line no-undef
                        .doc(doc.id)
                        .collection('guests')
                        .doc(gDoc.id)
                        .delete();
                  });
                  db.collection('rooms') // eslint-disable-line no-undef
                      .doc(doc.id).delete();
                }
              });
        });
      });
}

/**
 * Gets the queue associated with the given room and deletes each video
 * @param doc the document reference for a room
 */
async function deleteQueue(doc) {
  await db.collection('rooms') // eslint-disable-line no-undef
      .doc(doc.id).collection('queue').get()
      .then(function(queueShot) {
        queueShot.forEach(function(qDoc) {
          db.collection('rooms') // eslint-disable-line no-undef
              .doc(doc.id).collection('queue').doc(qDoc.id).delete();
        });
      });
}

/**
 * Gets the messages associated with a room and deletes al of their content
 * @param doc the document reference for a room
 */
async function deleteMessages(doc) {
  await db.collection('rooms') // eslint-disable-line no-undef
      .doc(doc.id).collection('messages').get()
      .then(function(messagesShot) {
        messagesShot.forEach(function(mDoc) {
          db.collection('rooms') // eslint-disable-line no-undef
              .doc(doc.id).collection('messages').doc(mDoc.id).delete();
        });
      });
}

/**
 * Gets the playback information for a room and deletes the iframe's info
 * @param doc the document reference for a room
 */
async function deleteCurrentVideo(doc) {
  await db.collection('rooms') // eslint-disable-line no-undef
      .doc(doc.id)
      .collection('CurrentVideo')
      .get()
      .then(function(videoSnapshot) {
        videoSnapshot.forEach(function(vDoc) {
          db.collection('rooms') // eslint-disable-line no-undef
              .doc(doc.id)
              .collection('CurrentVideo')
              .doc(vDoc.id)
              .delete();
        });
      });
}
