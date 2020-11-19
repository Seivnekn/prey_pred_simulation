let pos;
let cam;
let mapWidth = 400;
let mapDepth = 400;
let d = mapWidth / 2;
let foodInterval = 1000;
let timeOfLastSwitch = 0;

// positive x is left
// positive y is down
// positive z is "back"

function setup() {
  createCanvas(600, 600, WEBGL);
  cam = createCamera();
  resetButton = select(".resetSimulation");
  pauseButton = select(".pauseSimulation");
  playButton = select(".resumeSimulation");
  addPreyButton = select(".addPreyButton");
  addPredatorButton = select(".addPredatorButton");
  foodCountHTML = select(".foodCount");
  preyCountHTML = select(".preyCount");
  predatorCountHTML = select(".predatorCount");
  preyNormalCount = select(".preyNormalCount");
  preyEscapingCount = select(".preyEscapingCount");
  predatorNormalCount = select(".predatorNormalCount");
  predatorChasingCount = select(".predatorChasingCount");
  preyNormalSlider = select(".preyNormalSlider");
  preyEscapingSlider = select(".preyEscapingSlider");
  predatorNormalSlider = select(".predatorNormalSlider");
  predatorChasingSlider = select(".predatorChasingSlider");
  timeStarted = millis();

  foodList = [];
  avoidableList = [];
  preyList = [];
  predList = [];

  for (i = 0; i < 5; i++) {
    createRandomFood();
    createRandomAvoidable();
    createRandomPrey();
  }

  for (i = 0; i < 2; i++) {
    createRandomPredator();
  }
}

function draw() {
  // buttons for GUI
  resetButton.mousePressed(() => {
    reload();
  });
  pauseButton.mousePressed(() => {
    pauseButton.addClass("active");
  });
  playButton.mousePressed(() => {
    pauseButton.removeClass("active");
    loop();
  });
  if (pauseButton.hasClass("active")) {
    noLoop();
  }
  addPreyButton.mousePressed(() => {
    createRandomPrey();
  });
  addPredatorButton.mousePressed(() => {
    createRandomPredator();
  });
  preyNormalSlider.mouseReleased(() => {
    newVelocity = preyNormalSlider.value();
    updateSlider("PreyNormal", newVelocity);
    preyList.forEach((element) => {
      element.updateVelocity("normal", newVelocity);
    });
  });
  preyEscapingSlider.mouseReleased(() => {
    newVelocity = preyEscapingSlider.value();
    updateSlider("PreyEscaping", newVelocity);
    preyList.forEach((element) => {
      element.updateVelocity("escaping", newVelocity);
    });
  });
  predatorNormalSlider.mouseReleased(() => {
    newVelocity = predatorNormalSlider.value();
    updateSlider("PredatorNormal", newVelocity);
    predList.forEach((element) => {
      element.updateVelocity("normal", newVelocity);
    });
  });
  predatorChasingSlider.mouseReleased(() => {
    newVelocity = predatorChasingSlider.value();
    updateSlider("PredatorChasing", newVelocity);
    predList.forEach((element) => {
      element.updateVelocity("chasing", newVelocity);
    });
  });

  // html = preyNormalSlider.value()
  // console.log(html);

  // update gui counts
  foodCountHTML.html(`Food Count: ${foodList.length}`);
  preyCountHTML.html(`Prey Count: ${preyList.length}`);
  predatorCountHTML.html(`Predator Count: ${predList.length}`);

  debugMode();
  // set camera perspective
  cam.lookAt(0, 0, 0);
  cam.setPosition(0, -200, -500);
  // cam.setPosition(0, 0, -500);

  background("gray");
  stroke("white");

  push();
  // normalMaterial();
  fill("rgba(0,0,139, 0.98)");
  noStroke();
  // create map
  box(mapWidth, 5, mapDepth);
  pop();

  // create new food item every second
  if (millis() - timeOfLastSwitch > foodInterval) {
    createRandomFood();

    // remember timestamp, to use to determine the next interval
    timeOfLastSwitch = millis();
  }

  // remove food item if prey has "eaten" food
  removeEatenFood();

  // check if any prey have been eaten
  removeEatenPrey();

  // update desired path of each prey based on food
  updatePreyPaths();

  // update desired path of each predator entity based on prey
  updatePredatorPaths();

  // update everything
  updateAllEntities();

  // display everything
  displayAllEntities();
} // END DRAW

// remove food item if prey has "eaten" food
function removeEatenFood() {
  for (j = 0; j < foodList.length; j++) {
    if (foodList[j] == null) {
      continue;
    }
    preyList.forEach((element) => {
      // extra typechecking because sometimes they get through
      if (typeof foodList[j] == "undefined") {
        // console.log("This does nothing...");
        // do nothing
      } else {
        if (
          int(
            dist(
              element.position.x,
              element.position.z,
              foodList[j].position.x,
              foodList[j].position.z
            )
          ) < 5 // eat distance
        ) {
          foodList.remove(j);
        }
      }
    });
  }
}

// check if any prey have been eaten
function removeEatenPrey() {
  for (i = 0; i < preyList.length; i++) {
    if (preyList[i] == null) {
      continue;
    }
    predList.forEach((element) => {
      if (typeof preyList[i] == "undefined") {
        // console.log("This does nothing...");
        // do nothing
      } else {
        if (
          int(
            dist(
              element.position.x,
              element.position.z,
              preyList[i].position.x,
              preyList[i].position.z
            )
          ) < 5 // eat distance
        ) {
          //delete preyList[i];
          preyList.remove(i);
        }
      }
    });
  }
}

// update desired path of each prey based on food
function updatePreyPaths() {
  preyList.forEach((element) => {
    desiredPath = element.checkForFood(foodList);
    if (desiredPath.equals(createVector(-1, -1, -1))) {
      element.seek(desiredPath, 0);
    } else if (
      int(
        dist(
          element.position.x,
          element.position.z,
          desiredPath.x,
          desiredPath.z
        )
      ) > 50 // prey vision distance
    ) {
      element.seek(desiredPath, 0);
    } else {
      element.seek(desiredPath, 1);
    }
  });
}

// update desired path of each predator entity based on prey
function updatePredatorPaths() {
  predList.forEach((element) => {
    desiredPath = element.checkForPrey(preyList);
    if (desiredPath.equals(createVector(-1, -1, -1))) {
      element.seek(desiredPath, 0);
    } else if (
      int(
        dist(
          element.position.x,
          element.position.z,
          desiredPath.x,
          desiredPath.z
        )
      ) > 75 // predator vision distance
    ) {
      element.seek(desiredPath, 0);
    } else {
      element.seek(desiredPath, 1);
    }
  });
}

// update all entities
function updateAllEntities() {
  preyList.forEach((element) => {
    element.update(predList, avoidableList);
  });

  predList.forEach((element) => {
    element.update(avoidableList);
  });
}

// display all entities
function displayAllEntities() {
  foodList.forEach((element) => {
    element.display();
  });

  avoidableList.forEach((element) => {
    element.display();
  });

  preyList.forEach((element) => {
    element.display();
  });

  predList.forEach((element) => {
    element.display();
  });
}

function getMilliseconds() {
  let millis = millis();
  return millis;
}

function createRandomPredator() {
  var maximum = mapWidth / 2 - 10;
  var minimum = 0 - mapWidth / 2 + 10;
  var randomnumber1 =
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  var randomnumber2 =
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

  pred = new Predator(randomnumber1, -10, randomnumber2, 2);
  predList.push(pred);
}

function createRandomPrey() {
  var maximum = mapWidth / 2 - 10;
  var minimum = 0 - mapWidth / 2 + 10;
  var randomnumber1 =
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  var randomnumber2 =
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

  preyToAdd = new Prey(randomnumber1, -10, randomnumber2, 4);
  preyList.push(preyToAdd);
}

function createRandomFood() {
  var maximum = mapWidth / 2 - 10;
  var minimum = 0 - mapWidth / 2 + 10;
  var randomnumber1 =
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  var randomnumber2 =
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

  f = new Food(randomnumber1, -10, randomnumber2);
  foodList.push(f);
}

function createRandomAvoidable() {
  var maximum = mapWidth / 2 - 10;
  var minimum = 0 - mapWidth / 2 + 10;
  var randomnumber1 =
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  var randomnumber2 =
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

  a = new Avoidable(randomnumber1, -10, randomnumber2);
  avoidableList.push(a);
}

function reload() {
  var container = document.getElementById("body");
  var content = container.innerHTML;
  container.innerHTML = content;

  setup();

  // log activity
  console.log("Simulation Refreshed");
}

function updateSlider(slider, newVelocity) {
  newVelocity = 4 * (newVelocity / 100);
  if (slider == "PreyNormal") {
    preyNormalCount.html(`Prey Normal Velocity: ${newVelocity}`);
  } else if (slider == "PreyEscaping") {
    preyEscapingCount.html(`Prey Escaping Velocity: ${newVelocity}`);
  } else if (slider == "PredatorNormal") {
    predatorNormalCount.html(`Predator Normal Velocity: ${newVelocity}`);
  } else if (slider == "PredatorChasing") {
    predatorChasingCount.html(`Predator Chasing Velocity: ${newVelocity}`);
  }
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
