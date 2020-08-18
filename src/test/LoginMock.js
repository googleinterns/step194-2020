const guests = new Map();
const idtoken = Math.random().toString();

function MockFirebaseUser(data) {
  this.displayName = data.displayName;
  this.photoURL = data.photoURL;
}

function CreateGuestList(user) {
  guests.set(idtoken, user);
  return guests.has(idtoken);
};

function DeleteUser(idtoken, guestState) {
 if (guestState == 'logout'){
  guests.delete(idtoken);
  return guests.has(idtoken);
 }
 if (guestState == 'refresh'){
  guests.delete(this.idtoken);
  return guests.has(idtoken);
 }
};

function EmptyRoom(guests) {
  if (guests.size === 0) {
    return true;
  }
};

function UpdateName(data) {  
  if (data.displayName == ' ') {
    return 'Lounge Viewer'
  } else{
    return data.displayName;
  }
};

function UpdatePhoto(data) {  
  if (data.photoURL == ' ') {
    return 'hat.png'
   } else{
    return data.photoURL;
  }
};


module.exports = {
  MockFirebaseUser: MockFirebaseUser,
  CreateGuestList: CreateGuestList,
  EmptyRoom: EmptyRoom,
  DeleteUser: DeleteUser,
  UpdateName: UpdateName,
  UpdatePhoto: UpdatePhoto,
};