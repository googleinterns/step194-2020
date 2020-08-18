// test:
// - no blank messages can be sent
// - messages are ordered by time stamp
// - correct name and image for each message
// - make sure messages are being added to list

const messages = new Array();
const idtoken = Math.random().toString();


function createMessageList(message) {
  messages.push(message);
  return messages;
};

function emptyChat(messages) {
  if (messages.length === 0) {
    return true;
  }
};

function checkName(message) {  
  return message.displayName;
};

function checkPhoto(message) {  
  return message.photoURL;
};

function checkMessageText(message) {  
  if (message.text == ' '){
      return false
  } else {
      return true;
  }
};

function orderedMessages(messageslist) {  
  const messagesSort = messageslist.sort((a, b) => a.timestamp - b.timestamp);
    return messagesSort[0].timestamp <  messagesSort[1].timestamp;
};

module.exports = {
  createMessageList: createMessageList,
  emptyChat: emptyChat,
  checkName: checkName,
  checkPhoto: checkPhoto,
  checkMessageText: checkMessageText,
  orderedMessages: orderedMessages,
};
