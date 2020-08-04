/* exported startRoom */
// Takes the user to the lounge page when the start button is pressed
async function startRoom() {
  await fetch('/startRoom')
      .then((response) => response.json())
      .then((location) => {
        window.location.href = 'lounge.html/?room_id=' + location;
      });
  setTimeout(5000);
}
