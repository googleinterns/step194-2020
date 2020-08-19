/* eslint-disable */

var assert = require('assert');
var Chat = require('../test/ChatMock.js');

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
    it('should have one inputted messages saved onto list ', function () {
      const messages = Chat.createMessageList(chatMessage1);
      assert.equal(true, messages.includes(chatMessage1)); 
      Chat.clearMessages();
    });
  it('should tell that there are no messages currently', function () {
      const messages = new Array();
      assert.equal(true, Chat.isChatEmpty(messages));  
  });
 });
 describe('check individual Messages', function () {
    it('should show correct user display name for message input', function () {
      assert.equal('Caroline', Chat.checkName(chatMessage2));  
    });
  it('should show correct profile image for message input', function () {
      assert.equal('dog.png', Chat.checkPhoto(chatMessage2)); 
  });
  it('should reject message when the text input is blank', function () {
      assert.equal(false, Chat.checkMessageText(chatMessage3)); 
  });
  it('should accept message with text input', function () {
      assert.equal(true, Chat.checkMessageText(chatMessage4));  
  });
  it('should return the correct timestamp for sent message in proper format', function () {
      assert.equal('10:15:20', Chat.checkTimestamp(chatMessage4).toString());  
  });
  it('should return false for a message saved without a timestamp', function () {
      assert.equal(false, Chat.checkTimestamp(chatMessage3));  
  });
 });
  describe('#orderedMessages()', function () {
    it('should save 2 inputted messages in a list ordered by timestamp', function () {
      const messageList = new Array();
      messageList.push(chatMessage4);
      messageList.push(chatMessage1);
      assert.equal(true, Chat.orderedMessages(messageList)); 
      Chat.clearMessages();
    });
    it('should save 3 inputted messages in a list ordered by timestamp', function () {
      const messageList = new Array();
      messageList.push(chatMessage4);
      messageList.push(chatMessage1);
      messageList.push(chatMessage2);
      assert.equal(true, Chat.orderedMessages(messageList)); 
      Chat.clearMessages();
    });
  });
});
