/* eslint-disable */

var assert = require('assert');
var User = require('../test/LoginMock.js');
const { deleteUser } = require('../test/LoginMock.js');


const user1Credentials = {
  displayName: 'John',
  photoURL: ' ',
  timestamp: 1462361249720
};

const user2Credentials = {
  displayName: 'Caroline',
  photoURL: 'dog.png',
  timestamp: 1462361249709
};

const user3Credentials = {
  displayName: ' ',
  photoURL: 'duck.png',
  timestamp: 1462361249708
};

describe('User Sign In', function () {
  describe('#createGuestList()', function () {
    this.timeout(15000);
    it('should save onto guest list without error at login', function (done) {
      const user1 = User.MockFirebaseUser(user1Credentials);
      const guest = User.createGuestList(user1Credentials);
      assert.equal(true, guest);
     done();
    });
  });
});

describe('User Sign Out', function() {
    describe('#deleteUser', function() {
      it('should delete user if logout button selected', function() {
        const guest1 = User.createGuestList(user1Credentials);
        const guest2 = User.createGuestList(user2Credentials);
        const guest3 = User.createGuestList(user3Credentials);
        assert.equal(false, User.deleteUser(guest2, 'logout'));
      });
      it('should delete user if page is refreshed', function() {
        const guest1 = User.createGuestList(user1Credentials);
        const guest2 = User.createGuestList(user2Credentials);
        const guest3 = User.createGuestList(user3Credentials);
        assert.equal(false, User.deleteUser(guest3, 'refresh'));
      });
    describe('#EmptyRoom', function() {
      it('should show that room is empty and all users left', function() {
        const guests = new Map();
        const guest1 = User.createGuestList(user1Credentials);
        const guest2 = User.createGuestList(user2Credentials);
        deleteUser(guest1, 'logout');
        deleteUser(guest2, 'logout')
        assert.equal(true, User.emptyRoom(guests));
      });
    });
  });
});


  describe('updateName', function() {
    it('should show user inputted display name', function() {
      assert.equal('John', User.updateName(user1Credentials));
    });
     it('should show default display name due to no input', function() {
      assert.equal('Lounge Viewer', User.updateName(user3Credentials));
    });
  });

  describe('#updatePhoto', function() {
    it('should show user selected display image', function() {
      assert.equal('dog.png', User.updatePhoto(user2Credentials));
    });
     it('should show default display image due to no input', function() {
      assert.equal('hat.png', User.updatePhoto(user1Credentials));
    });
  });

  describe('#sortGuests', function() {
    it('should show user selected display image', function() {
        const guests = new Array();
        guests.push(user1Credentials);
        guests.push(user2Credentials);
        guests.push(user3Credentials);
        assert.equal(true, User.sortGuests(guests)); 
    });
  });
