/* eslint-disable */
const guests = new Map();
const idtoken = Math.random().toString();

function MockFirebaseUser(data) {
  this.displayName = data.displayName;
  this.photoURL = data.photoURL;
  this.timestamp = data.timestamp;
}

function createGuestList(userData) {
  guests.set(idtoken, userData);
  return guests.has(idtoken);
}

function deleteUser(idtoken, guestState) {
  if (guestState == 'logout') {
    guests.delete(idtoken);
    return guests.has(idtoken);
 }
  if (guestState == 'refresh') {
    guests.delete(this.idtoken);
    return guests.has(idtoken);
 }
}

function emptyRoom(guests) {
  if (guests.size === 0) {
    return true;
  } else {
    return false;
  }
}

function updateName(data) {
  if (data.displayName == ' ') {
    return 'Lounge Viewer';
  } else {
    return data.displayName;
  }
}

function updatePhoto(data) {
  if (data.photoURL == ' ') {
    return 'hat.png';
  } else {
    return data.photoURL;
  }
}

function sortGuests(guestlist) {  
  const guestSort = guestlist.sort((a, b) => a.timestamp - b.timestamp);
  for (let i = 0; i < guestSort.length; i++) {
    return guestSort[i].timestamp <  guestSort[i+1].timestamp;
  }
}

module.exports = {
  MockFirebaseUser: MockFirebaseUser,
  createGuestList: createGuestList,
  emptyRoom: emptyRoom,
  deleteUser: deleteUser,
  updateName: updateName,
  updatePhoto: updatePhoto,
  sortGuests: sortGuests,
};
