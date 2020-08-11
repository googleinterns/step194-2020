// opens chat and queue on the side and adjusts content size on screen
function openSidebar() { // eslint-disable-line no-unused-vars
  const buttonText = document.getElementById('sidebarBtn');

  if (buttonText.innerHTML ===
    '<span class="material-icons">chevron_left</span>') {
    buttonText.innerHTML =
    '<span class="material-icons">chevron_right</span>';
    document.getElementById('mySidebar').style.width = '25%';
    document.getElementById('main').style.marginRight = '25%';
  } else {
    buttonText.innerHTML =
    '<span class="material-icons">chevron_left</span>';
    document.getElementById('mySidebar').style.width = '0';
    document.getElementById('main').style.marginRight= '0';
  }
}

//Takes created link from loungeLink and copies it to user's clipboard
function copyLink() {
  /* Get the text field */
  var copyText = document.getElementById("loungeLink");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /*For mobile devices*/

  document.execCommand("copy");

  alert("Copied the text: " + copyText.value);
}
