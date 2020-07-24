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

function removeVideo(element) { // eslint-disable-line no-unused-vars
  console.log(element);
  element.remove();
}

function addToQueue(url) { // eslint-disable-line no-unused-vars
  document.getElementById('linkError').style.display = 'none';
  if (url == 'https://www.youtube.com/watch?v=JhckVlgYZJE') {
    document.getElementById('videoContainer').innerHTML +=
        '<div id="video4" class="queueVideo">' +
          '<img ' +
            'class="videoThumbnail"' +
            'src="images/oldman.png"' +
          '/>' +
          '<div id="video4Info" class="videoInfo"> ' +
            '<p class="videoTitle">A old man\'s advice</p>' +
            '<button class="removeVideoBtn" id="removeVideoBtn4"' +
              'onclick="removeVideo(document.getElementById(\'video4\'))">' +
              '<img src="images/remove-from-queue.svg"/>' +
            '</button>' +
            '<p>10:20</p>' +
          '</div>' +
        '</div>';
  } else if (url == 'https://www.youtube.com/watch?v=ZengOKCUBHo') {
    document.getElementById('videoContainer').innerHTML +=
    '<div id="video5" class="queueVideo">' +
      '<img ' +
        'class="videoThumbnail"' +
        'src="images/juice.png"' +
      '/>' +
      '<div id="video5Info" class="videoInfo"> ' +
        '<p class="videoTitle">Juice WRLD - Righteous (Official Video)</p>' +
        '<button class="removeVideoBtn" id="removeVideoBtn5"' +
        'onclick="removeVideo(document.getElementById(\'video5\'))">' +
            '<img src="images/remove-from-queue.svg"/>' +
        '</button>' +
        '<p>3:49</p>' +
      '</div>' +
    '</div>';
  } else {
    document.getElementById('linkError').style.display = 'block';
  }
}
