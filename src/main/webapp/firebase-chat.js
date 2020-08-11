/* eslint-disable */
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomParam = urlParams.get('room_id');

function anonymousSignIn() {
  firebase.auth().signInAnonymously();
}

function initFirebaseAuth() {
  firebase.auth().onAuthStateChanged(authStateObserver);
}

function getProfilePicUrl() {
  const profilePic = document.getElementsByName('profile');
  for (i = 0; i < profilePic.length; i++) {
    if (profilePic[i].checked) {
      return profilePic[i].value;
    }
  }
}

function getUserName() {
  if (displayName.value == '') {
    return 'Lounge Viewer';
  }
  return displayName.value;
}

function getTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

// Saves a new message to Cloud Firestore database.
// Add a new message entry to the database.
function saveMessage(messageText) {
  return firebase.firestore().collection('rooms').doc(roomParam).collection('messages').add({
    name: getUserName(),
    text: messageText,
    profilePicUrl: getProfilePicUrl(),
    timestamp: getTimestamp(),
  }).catch(function(error) {
    console.error('Error writing new message to database', error);
  });
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  const query =
  firebase.firestore().collection('rooms').doc(roomParam).collection('messages').orderBy('timestamp', 'desc');
  query.onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        const message = change.doc.data();
        displayMessage(change.doc.id, message.timestamp, message.name,
            message.text, message.profilePicUrl);
      }
    });
  });
}


// Check that the user entered a message and is signed in.
function onMessageFormSubmit(e) {
  e.preventDefault();
  if (messageInputElement.value && checkSignedInWithMessage()) {
    saveMessage(messageInputElement.value).then(function() {
      resetMaterialTextfield(messageInputElement);
      toggleButton();
    });
  }
}


// Triggers when the auth state change for
// instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) {
    const profilePicUrl = getProfilePicUrl();
    const userName = getUserName();

    userPicElement.style.backgroundImage =
    'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;

    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');
    dialog.close();
  } else {
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');
    dialog.showModal();
  }
}

 
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

function checkSignedInWithMessage() {
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  const data = {
    message: 'You must sign-in first',
    timeout: 2000,
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
const MESSAGE_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="message"></div>' +
       '<div class="name"></div>'+
    '</div>';

function deleteMessage(id) {
  const div = document.getElementById(id);
  if (div) {
    div.parentNode.removeChild(div);
  }
}

function createAndInsertMessage(id, timestamp) {
  const container = document.createElement('div');
  container.innerHTML = MESSAGE_TEMPLATE;
  const div = container.firstChild;
  div.setAttribute('id', id);

  timestamp = timestamp ? timestamp.toMillis() : Date.now();
  div.setAttribute('timestamp', timestamp);

  // figure out where to insert new message
  const existingMessages = messageListElement.children;
  if (existingMessages.length === 0) {
    messageListElement.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];

    while (messageListNode) {
      const messageListNodeTime = messageListNode.getAttribute('timestamp');

      if (!messageListNodeTime) {
        throw new Error(
            `Child ${messageListNode.id} has no 'timestamp' attribute`,
        );
      }
      if (messageListNodeTime > timestamp) {
        break;
      }
      messageListNode = messageListNode.nextSibling;
    }
    messageListElement.insertBefore(div, messageListNode);
  }
  return div;
}


function displayMessage(id, timestamp, name, text, picUrl) {
  const div =
  document.getElementById(id) || createAndInsertMessage(id, timestamp);
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage =
    'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  }
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = '0' + date.getMinutes();
  const seconds = '0' + date.getSeconds();
  const formattedTime =
  hours + ':' + minutes.substr(-2)+ ':' + seconds.substr(-2);

  div.querySelector('.name').textContent = name + '  ' + formattedTime;
  const messageElement = div.querySelector('.message');

  if (text) {
    messageElement.textContent = text;
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  }
  setTimeout(function() {
    div.classList.add('visible');
  }, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  messageInputElement.focus();
}

// Inputting guest list in database
function saveGuestList() {
    return firebase.firestore().collection('rooms').doc(roomParam).collection('guests').add({
    name: getUserName(),
    profilePicUrl: getProfilePicUrl(),
    timestamp: getTimestamp(),
    }).catch(function(error) {
    console.error('Error adding guest to database', error);
    });
  }

  const GUEST_TEMPLATE =
    '<div class="guest-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
       '<div class="name"></div>'+
    '</div>';

function createAndInsertGuest(id, timestamp) {
  const container = document.createElement('div');
  container.innerHTML = GUEST_TEMPLATE;
  const div = container.firstChild;
  div.setAttribute('id', id);

  timestamp = timestamp ? timestamp.toMillis() : Date.now();
  div.setAttribute('timestamp', timestamp);

  const existingGuests = guestListElement.children;
  if (existingGuests.length === 0) {
    guestListElement.appendChild(div);
  } else {
    let guestListNode = existingGuests[0];

    while (guestListNode) {
      const guestListNodeTime = guestListNode.getAttribute('timestamp');

      if (!guestListNodeTime) {
        throw new Error(
            `Child ${guestListNode.id} has no 'timestamp' attribute`,
        );
      }
      if (guestListNodeTime > timestamp) {
        break;
      }
      guestListNode = guestListNode.nextSibling;
    }
    guestListElement.insertBefore(div, guestListNode);
  }
  return div;
}

function displayGuest(id, timestamp, name, picUrl) {
  const div =
  document.getElementById(id) || createAndInsertGuest(id, timestamp);
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage =
    'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  }
  div.querySelector('.name').textContent = name;
  setTimeout(function() {
    div.classList.add('visible');
  }, 1);
  guestListElement.scrollTop = guestListElement.scrollHeight;
}

function loadGuests() {
  const query =
  firebase.firestore().collection('rooms').doc(roomParam).collection('guests').orderBy('timestamp', 'desc');
  query.onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        const message = change.doc.data();
        displayGuest(change.doc.id, message.timestamp, message.name,
          message.profilePicUrl);
      }
    });
  });
}

function removeGuest(guest){
    const viewer = firebase.firestore().collection('rooms').doc(roomParam).collection('guests').doc(guest);
    viewer.delete();
}

// Enables or disables the submit button
function toggleButton() {
  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

// deletes anonymous user at sign out
function deleteUser() {
  const user = firebase.auth().currentUser;
  user.delete().catch(function(error) {
    console.error('Error deleting guest', error);
  });
}

const messageListElement = document.getElementById('messages');
const messageFormElement = document.getElementById('message-form');
const messageInputElement = document.getElementById('message');
const submitButtonElement = document.getElementById('submit');
const userPicElement = document.getElementById('user-pic');
const userNameElement = document.getElementById('user-name');
const signOutButtonElement = document.getElementById('sign-out');
const signInSnackbarElement = document.getElementById('must-signin-snackbar');
const dialog = document.getElementById('dialog');
const displayName = document.getElementById('userName');
const anonymousSignInElement = document.getElementById('anonymous-signin');
const guestListElement = document.getElementById('guests');
const guestArray = firebase.firestore().collection('rooms').doc(roomParam).collection('guests').orderBy('timestamp', 'desc').get();
const guestCount = guestListElement.childElementCount;

messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', function() {
  firebase.auth().signOut();
  deleteUser();
  for (let i = guestCount; i < guestArray.length; i++) {
  removeGuest(guestArray.docs[i].id);
  }
});

anonymousSignInElement.addEventListener('click', function(e) {
  e.preventDefault();
  anonymousSignIn();
  saveGuestList();
});

// when window closes or is refreshed
window.addEventListener("beforeunload", function(e){
  firebase.auth().signOut();
  deleteUser();
}, false);

firebase.auth().onAuthStateChanged((firebaseUser) => {
  console.log(firebaseUser);
});

messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

initFirebaseAuth();

loadMessages();
loadGuests();
