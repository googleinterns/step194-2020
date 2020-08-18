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
var User = require('../test/ChatMock.js');

const chatMessage1 = {
  displayName: 'John', 
  photoURL: 'hat.png',
  text: 'hello, how are you?',
  timestamp: 1462361249717
}

const  chatMessage2 = {
  displayName: 'Caroline', 
  photoURL: 'dog.png',
  text: 'I am good',
  timestamp: 1462361249718
}

const  chatMessage3 = {
  displayName: 'Caroline', 
  photoURL: 'dog.png',
  text: ' '
}

const  chatMessage4 = {
  displayName: 'Andrew ', 
  photoURL: 'duck.png',
  text: 'lets listen to some music',
  timestamp: 1462361249720
}


describe('Chat Box', function () {
  describe('check Message List', function () {
    it('should save inputted messages onto list ', function () {
      const messages = User.createMessageList(chatMessage1);
      assert.equal(true, messages.includes(chatMessage1)); 
    });
  it('should tell that there are no messages currently', function () {
      const messages = new Array();
      assert.equal(true, User.emptyChat(messages));  
  });
 });
 describe('check individual Messages', function () {
    it('should show correct name for message input', function () {
      assert.equal('Caroline', User.checkName(chatMessage2));  
    });
  it('should show correct image for message input', function () {
      assert.equal('dog.png', User.checkPhoto(chatMessage2));  
  });
  it('should reject message with no text input', function () {
      assert.equal(false, User.checkMessageText(chatMessage3));  
  });
  it('should accept message with text input', function () {
      assert.equal(true, User.checkMessageText(chatMessage4));  
  });
 });
  describe('#orderedMessages()', function () {
    it('should save inputted messages in a list ordered by timestamp', function () {
      const messages = new Array();
      messages.push(chatMessage4);
      messages.push(chatMessage1);
      assert.equal(true, User.orderedMessages(messages)); 
    });
  });
});
