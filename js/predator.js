// class for predator entity
class Predator {
  constructor(x, y, z, s) {
    this.position = createVector(x, y, z);

    this.velocity = createVector(0, 0, 0);
    this.acceleration = createVector(0, 0, 0);

    this.normalVelocity = s;
    this.chasingVelocity = s * 1.4;
    this.obstacleRealizationRadius = 40;
    this.reproductionCountdown = 10000;
    this.maxforce = 0.08;
    this.isChasingPrey = -1;
    this.isAvoiding = -1;

    this.timeLastReproduced = 0;
    this.canReproduce = false;
  }

  // update location
  update(avoidablesList) {
    // boundaries behavior (wraparound)
    // make sure entity hasn't hit a wall
    if (abs(this.position.x) >= mapWidth / 2) {
      this.position.x = -this.position.x * .98;
    }

    if (abs(this.position.z) >= mapWidth / 2) {
      this.position.z = -this.position.z * .98;
    }

    // check if enough time has passed since the entity has reproduced
    if (millis() - this.timeLastReproduced > this.reproductionCountdown) {
      // amount of time since the entity has last reproduced is greater  
      // than the entity's reproductive cooldown
    }

    this.checkForAvoidables(avoidablesList);

    // update velocity
    this.velocity.add(this.acceleration);

    // limit speed
    if (this.isChasingPrey == -1) {
      this.velocity.limit(this.normalVelocity);
    } else {
      this.velocity.limit(this.chasingVelocity);
    }

    this.position.add(this.velocity);

    // Reset acceleration to 0
    this.acceleration.mult(0);
    // console.log(this.velocity);
  }

  // calculate steering force towards a target
  seek(target, active) {
    var desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target

    // scale to maximum speed
    if (this.isChasingPrey == -1) {
      desired.setMag(this.normalVelocity);
    } else {
      desired.setMag(this.chasingVelocity);
    }

    // steering force = desired location - velocity
    var steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce); // Limit to maximum steering force

    // apply steering force
    // could add mass here (A = F / M)
    if (active) {
      this.isChasingPrey = 1;
      // Limit to maximum steering force
      this.acceleration.add(steer);
    } else {
      this.isChasingPrey = -1;
    }

    if (keyIsDown(DOWN_ARROW)) {
      console.log(steer);
    }
  }

  // display entity
  display() {
    let theta = this.velocity.headingAlternate() + PI / 2;
    if (this.isChasingPrey == -1) {
      //normalMaterial();
      let c = color(139, 0, 139);
      fill(c);
      noStroke();
    } else {
      let c = color(204, 204, 0);
      fill(c);
      noStroke();
    }

    strokeWeight(1);
    push();
    translate(this.position.x, this.position.y, this.position.z);
    rotate(theta, createVector(0, -1, 0));
    rotateX(-PI / 2);
    cone(10, 25);
    translate(-this.position.x, -this.position.y, -this.position.z);
    pop();
  }

  checkForPrey(preyList) {
    // var closestEntity = foodList[Math.floor(Math.random() * foodList.length)];
    var closestEntity = createVector(-1, -1, -1);
    var closestDistance = 400;
    for (i = 0; i < preyList.length; i++) {
      if (preyList[i] == null) {
        continue;
      }
      var entityDistance = int(
        dist(
          this.position.x,
          this.position.z,
          preyList[i].position.x,
          preyList[i].position.z
        )
      );
      if (entityDistance < closestDistance) {
        closestEntity = preyList[i].position;
        closestDistance = entityDistance;
      }
    }
    return closestEntity;
  }

  checkForAvoidables(avoidablesList) {
    let sum = createVector();
    let count = 0;
    avoidablesList.forEach((element) => {
      if (
        int(
          dist(
            element.position.x,
            element.position.z,
            this.position.x,
            this.position.z
          )
        ) < this.obstacleRealizationRadius // prey vision distance
      ) {
        this.isAvoiding = 1;
        // vector pointing away from predator
        let diff = p5.Vector.sub(this.position, element.position);
        diff.normalize();
        diff.div(this.obstacleRealizationRadius); // Weight by distance
        sum.add(diff);
        count++;
      } else {
        this.isAvoiding = -1;
      }
    });

    // Average -- divide by how many
    if (count > 0) {
      sum.div(count);
      // Our desired vector is the average scaled to maximum speed
      // sum.normalize();
      sum.mult(this.normalVelocity);
      // Implement Reynolds: Steering = Desired - Velocity
      // sum.sub(this.velocity);
      sum.limit(this.normalVelocity);
      this.acceleration.add(sum);
    }
  }

  updateVelocity(type, unNormalizedValue) {
    let normalizedValue = 4 * (unNormalizedValue / 100);
    if (type == "normal") {
      this.normalVelocity = normalizedValue;
    } else if (type == "chasing") {
      this.chasingVelocity = normalizedValue;
    }
    console.log(normalizedValue);
  }
}

// I modified the heading prototype from the source code to
// affect the x,z plane rather than the x,y
p5.Vector.prototype.headingAlternate = function headingAlternate() {
  const h = Math.atan2(this.z, this.x);
  if (this.p5) return this.p5._fromRadians(h);
  return h;
};