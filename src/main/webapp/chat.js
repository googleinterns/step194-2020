window.onload = function(){
     
document.getElementById("send").onclick = function() {addChatMessage()};

var input = document.getElementById("new-message");

input.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
        addChatMessage();
  }
});
var formattedComment = "";

function addChatMessage() {
    var message = document.getElementById("new-message");
     const chatList = document.getElementById('chat-history');
    chatList.innerHTML = '';
    if(message !== ""){
        formattedComment += createChatElement(message);
        localStorage.setItem("messageStorageKey", formattedComment); 
        chatList.innerHTML = localStorage.getItem("messageStorageKey");
        document.getElementById("new-message").value = "";
        }
    }
 }

 function createChatElement(message) {
    const avatarElement = document.createElement('img');
    avatarElement.src= "https://cdn.iconscout.com/icon/free/png-512/avatar-372-456324.png";
    avatarElement.className = "avatar";

    const textElement = document.createElement('span');
    textElement.innerText = message.value + "\n";

    const UserInfoElement = document.createElement('span');
    UserInfoElement.innerHTML = "  <b>Sundar Pichai</b>  ";
    
    const chatListElement = document.createElement('li');
    chatListElement.appendChild(avatarElement);
    chatListElement.appendChild(UserInfoElement);
    chatListElement.appendChild(textElement);
    return chatListElement; 
}