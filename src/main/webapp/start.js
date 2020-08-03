/* exported startRoom */
// Takes the user to the lounge page when the start button is pressed
async function startRoom() {
  fetch('/startRoom')
      .then((response) => response.json())
      .then((responseJson) => {
        console.log('Switching to lounge: ' + responseJson);
      });
}
