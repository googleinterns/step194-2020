 
// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Adds a random greeting to the page.
 */
function addRandomFunFacts() {
  const FunFacts =
      ['I can do a hand stand!', 'I can touch my nose with my tongue!', 'I was on the wrestling team for 4 years!', 'I can speak Arabic!'];

  // Pick a random greeting.
  const facts = FunFacts[Math.floor(Math.random() * FunFacts.length)];

  // Add it to the page.
  const factsContainer = document.getElementById('facts-container');
  factsContainer.innerText = facts;
}

function ReadMore() {
  var moreText = document.getElementById("more");
  var btnText = document.getElementById("readmorebtn");

  if (more.style.display === "inline") {
    btnText.innerHTML = "+ READ MORE"; 
    moreText.style.display = "none";
  } else {
    btnText.innerHTML = "- READ LESS"; 
    moreText.style.display = "inline";
    
  }
}