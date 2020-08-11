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

function copyLink() {
  /* Get the text field */
  var copyText = document.getElementById("loungeLink");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /*For mobile devices*/

  /* Copy the text inside the text field */
  document.execCommand("copy");

  /* Alert the copied text */
  alert("Copied the text: " + copyText.value);
}
