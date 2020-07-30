// opens chat and queue on the side and adjusts content size on screen
function openSidebar() { // eslint-disable-line no-unused-vars
  const buttonText = document.getElementById('sidebarBtn');

  if (buttonText.innerHTML ===
    '<span class="glyphicon glyphicon-menu-left"></span>') {
    buttonText.innerHTML =
    '<span class="glyphicon glyphicon-menu-right"></span>';
    document.getElementById('mySidebar').style.width = '25%';
    document.getElementById('main').style.marginRight = '25%';
  } else {
    buttonText.innerHTML =
    '<span class="glyphicon glyphicon-menu-left"></span>';
    document.getElementById('mySidebar').style.width = '0';
    document.getElementById('main').style.marginRight= '0';
  }
}
