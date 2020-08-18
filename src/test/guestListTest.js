// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


var assert = require('assert');
var User = require('../test/LoginMock.js');
const { DeleteUser } = require('../test/LoginMock.js');


const user1Credentials = {
  displayName: 'John', 
  photoURL: ' '
}

const user2Credentials = {
  displayName: 'Caroline', 
  photoURL: 'dog.png'
}

const user3Credentials = {
  displayName: ' ', 
  photoURL: 'duck.png'
}

describe('User Sign In', function () {
  describe('#CreateGuestList()', function () {
    this.timeout(15000);
    it('should save onto guest list without error at login', function (done) {
      const user1 = User.MockFirebaseUser(user1Credentials);
      const guest = User.CreateGuestList(user1Credentials);
      assert.equal(true, guest);
     done();    
    });
  });
});

describe('User Sign Out', function() {
    describe('#DeleteUser', function() {
      it('should delete user if logout button selected', function() {
        const guest1 = User.CreateGuestList(user1Credentials);
        const guest2 = User.CreateGuestList(user2Credentials);
        const guest3 = User.CreateGuestList(user3Credentials);
        assert.equal(false, User.DeleteUser(guest2, 'logout'));
      });
      it('should delete user if page is refreshed', function() {
        const guest1 = User.CreateGuestList(user1Credentials);
        const guest2 = User.CreateGuestList(user2Credentials);
        const guest3 = User.CreateGuestList(user3Credentials);
        assert.equal(false, User.DeleteUser(guest3, 'refresh'));
      });
    describe('#EmptyRoom', function() {
      it('should show that room is empty and all users left', function() {
        const guests = new Map();
        const guest1 = User.CreateGuestList(user1Credentials);
        const guest2 = User.CreateGuestList(user2Credentials);
        DeleteUser(guest1, 'logout');
        DeleteUser(guest2, 'logout')
        assert.equal(true, User.EmptyRoom(guests));
      });
    });
  });
});


  describe('#UpdateName', function() {
    it('should show user inputted display name', function() {
      assert.equal('John', User.UpdateName(user1Credentials));
    });
     it('should show default display name due to no input', function() {
      assert.equal('Lounge Viewer', User.UpdateName(user3Credentials));
    });
  });

  describe('#UpdatePhoto', function() {
    it('should show user selected display image', function() {
      assert.equal('dog.png', User.UpdatePhoto(user2Credentials));
    });
     it('should show default display image due to no input', function() {
      assert.equal('hat.png', User.UpdatePhoto(user1Credentials));
    });
  });
