/** exported startRoom */
async function startRoom() {
  fetch('/startRoom')
      .then((response) => response.json())
      .then((responseJson) => {
          console.log("Switching to lounge: " + responseJson);
      });
}