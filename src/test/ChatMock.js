/* eslint-disable */
// test:
// - no blank messages can be sent
// - messages are ordered by time stamp
// - check for accurate timestamp of sent message
// - check for correct name and image for each message
// - make sure messages are being added to list

const messages = [];

function createMessageList(message) {
  messages.push(message);
  return messages;
}

function isChatEmpty(messages) {
  if (messages.length === 0) {
    return true;
  } else {
    return false;
  }
}

function clearMessages() {
    this.messages= [];
}

function checkName(message) {  
  return message.displayName;
}

function checkPhoto(message) {  
  return message.photoURL;
}

function checkMessageText(message) {  
  if (message.text == ' '){
      return false
  } else {
      return true;
  }
}

function checkTimestamp(message) {
  if (message.timestamp == null) {
    return false
  } else {
    const date = new Date(message.timestamp * 1000);
    const hours = date.getHours();
    const minutes = '0' + date.getMinutes();
    const seconds = '0' + date.getSeconds();
    return formattedTime =
    hours + ':' + minutes.substr(-2)+ ':' + seconds.substr(-2);

  }
}
function orderedMessages(messageslist) {  
  const messageSort = messageslist.sort((a, b) => a.timestamp - b.timestamp);
  for (let i = 0; i < messageSort.length; i++) {
    return messageSort[i].timestamp <  messageSort[i+1].timestamp;
  }
}


module.exports = {
  createMessageList: createMessageList,
  isChatEmpty: isChatEmpty,
  clearMessages: clearMessages,
  checkName: checkName,
  checkPhoto: checkPhoto,
  checkMessageText: checkMessageText,
  checkTimestamp: checkTimestamp,
  orderedMessages: orderedMessages,
};
