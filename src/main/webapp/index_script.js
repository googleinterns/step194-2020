// opens chat and queue on the side and adjusts content size on screen
function openSidebar() { // eslint-disable-line no-unused-vars
  const buttonText = document.getElementById('sidebarBtn');

  if (buttonText.innerHTML ===
    '<span class="material-icons">chevron_right</span>') {
    buttonText.innerHTML =
    '<span class="material-icons">chevron_left</span>';
    document.getElementById('mySidebar').style.width = '0';
    document.getElementById('main').style.marginRight = '0';
  } else {
    buttonText.innerHTML =
    '<span class="material-icons">chevron_right</span>';
    document.getElementById('mySidebar').style.width = '25%';
    document.getElementById('main').style.marginRight = '25%';
  }
}

// Takes created link from loungeLink and copies it to user's clipboard
function copyLink() { // eslint-disable-line no-unused-vars
  const copyText = document.getElementById('loungeLink');
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand('copy');
  alert('Copied the text: ' + copyText.value);
}
