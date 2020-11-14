// class for generic avoidable item
class Avoidable {
  constructor(x, y, z) {
    this.position = createVector(x, y, z);
  }

  // display avoidable
  display() {
    push();
    // translate to appropriate position from origin
    translate(this.position.x, this.position.y, this.position.z);
    // normalMaterial();
    // stroke("purple");
    let c = color(255, 0, 255);
    fill(c);
    noStroke();
    box(8, 20, 8); // width, height, depth

    // return perspective to origin
    translate(-this.position.x, -this.position.y, -this.position.z);
    pop();
  }
}
