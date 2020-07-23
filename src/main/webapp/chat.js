// local storage of comments
window.onload = function(){
var input = document.getElementById("new-message");
document.getElementById("send").onclick = function() {input.forEach(addChatMessage())};

input.addEventListener("keyup", function(event) {
  // "Enter" key on the keyboard
  if (event.keyCode === 13) {
        input.forEach(addChatMessage());
  }
});
var formattedComment = "";

function addChatMessage() {
    var message = document.getElementById("new-message");
     const chatList = document.getElementById('chat-history');

    if(message !== ""){
        formattedComment = createChatElement(message);
        chatList.appendChild(formattedComment);
        document.getElementById("new-message").value = "";
        }
    }
 }

//placeholder items for avatar and display name
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
