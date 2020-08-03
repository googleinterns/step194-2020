/* eslint-disable */
const firebaseConfig = {
  // apiKey: removed ,
  authDomain: 'lounge-95f01.firebaseapp.com',
  databaseURL: 'https://lounge-95f01.firebaseio.com',
  projectId: 'youtube-lounge',
  storageBucket: 'youtube-lounge.appspot.com',
  messagingSenderId: '681171972170',
  appId: '1:681171972170:web:4c6526b8eb788af9d876b3',
  measurementId: 'G-JSDHBSMHS3',
};
firebase.initializeApp(firebaseConfig); // eslint-disable-line no-undef

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}

function anonymousSignIn() {
  firebase.auth().signInAnonymously();
}

function signOut() {
  firebase.auth().signOut();
}


function initFirebaseAuth() {
  firebase.auth().onAuthStateChanged(authStateObserver);
}

function getProfilePicUrl() {
  if (signInButtonElement.clicked==true) {
    return firebase.auth().currentUser.photoURL;
  } else {
    // placeholder profile picture for anonymous
    return 'https://cdn.iconscout.com/icon/free/png-512/avatar-372-456324.png';
  }
}

function getUserName() {
  if (signInButtonElement.clicked==true) {
    return firebase.auth().currentUser.displayName;
  } else {
    // placeholder username for anonymous
    return 'John Smith';
  }
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
  return firebase.firestore().collection('messages').add({
    name: getUserName(),
    text: messageText,
    profilePicUrl: getProfilePicUrl(),
    timestamp: getTimestamp(),
  }).then(function() {
    console.log('saved message');
  }).catch(function(error) {
    console.error('Error writing new message to database', error);
  });
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  const query =
  firebase.firestore().collection('messages').orderBy('timestamp', 'desc');
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
       '<div class="name" style="font-variant: small-caps;"></div>'+
    '</div>';

function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

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

function displayMessage(id, timestamp, name, text, picUrl, imageUrl) {
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

// Enables or disables the submit button
function toggleButton() {
  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

const messageListElement = document.getElementById('messages');
const messageFormElement = document.getElementById('message-form');
const messageInputElement = document.getElementById('message');
const submitButtonElement = document.getElementById('submit');
const userPicElement = document.getElementById('user-pic');
const userNameElement = document.getElementById('user-name');
const signInButtonElement = document.getElementById('sign-in');
const anonymousSignInElement = document.getElementById('anonymous-signin');
const signOutButtonElement = document.getElementById('sign-out');
const signInSnackbarElement = document.getElementById('must-signin-snackbar');
const dialog = document.getElementById('dialog');

messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', function() {
  dialog.showModal();
  if (signInButtonElement.clicked==true) {
    signOut();
  } else {
    firebase.auth().signOut();
  }
});

signInButtonElement.addEventListener('click', function() {
  dialog.close();
  signIn();
});

anonymousSignInElement.addEventListener('click', function() {
  anonymousSignIn();
  dialog.close();
});

firebase.auth().onAuthStateChanged((firebaseUser) => {
  console.log(firebaseUser);
});

messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

initFirebaseAuth();

loadMessages();