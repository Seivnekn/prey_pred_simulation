// class for generic food item
class Food {
  constructor(x, y, z) {
    this.position = createVector(x, y, z);
  }

  // display food
  display() {
    push();
    // translate to appropriate position from origin
    translate(this.position.x, this.position.y, this.position.z);
    let c = color(255, 165, 0);
    fill(c);
    noStroke();
    box(6);

    // return perspective to origin
    translate(-this.position.x, -this.position.y, -this.position.z);
    pop();
  }
}
