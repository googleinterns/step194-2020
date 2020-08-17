var guests = new Map();

function MockFirebaseUser(idtoken, data) {
  this.idtoken = Math.random().toString();
  this.displayName = data.displayName;
  this.photoURL = data.photoURL;
}

function CreateGuestList() {
  var user = new MockFirebaseUser(this.idtoken, this);
  guests.set(user.idtoken, {displayName: user.displayName, photoURL: user.photoURL });
  return guests;
};

function DeleteUser() {
 if (guestState == 'logout'){
  guests.delete(this.idtoken);
  return guests;
 }
 if (guestState == 'refresh'){
  guests.delete(this.idtoken);
  return guests;

 }
};

function UpdateName () {  
  if (this.displayName == ' ') {
    return 'Lounge Viewer'
  }
  else{
    this.displayName = displayName;
    user.displayName = displayName;
  }
  
};

function UpdatePhoto() {  
 if (this.photoURL == ' ') {
     return 'hat.png'
 }
 else{
    this.photoURL = photoURL;
    user.photoURL = photoURL;
  }
};


module.exports = {
  MockFirebaseUser: MockFirebaseUser,
  CreateGuestList: CreateUser,
  DeleteUser: DeleteUser,
  UpdateName: UpdateName,
  UpdatePhoto: UpdatePhoto,
};