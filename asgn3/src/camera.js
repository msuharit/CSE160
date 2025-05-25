class Camera {
  constructor() {
    this.fov = 60;
    this.eye = new Vector3([0, 0, 3]);
    this.at = new Vector3([0, 0, 0]);
    this.up = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      ...this.eye.elements,
      ...this.at.elements,
      ...this.up.elements
    );
  }

  updateProjectionMatrix() {
    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      1000
    );
  }

  moveForward(speed = 1) {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    f.mul(speed);
    this.eye.add(f);
    this.at.add(f);
    this.updateViewMatrix();
  }

  moveBackward(speed = 1) {
    let b = new Vector3(this.eye.elements);
    b.sub(this.at);
    b.normalize();
    b.mul(speed);
    this.eye.add(b);
    this.at.add(b);
    this.updateViewMatrix();
  }

  moveLeft(speed = 1) {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateViewMatrix();
  }

  moveRight(speed = 1) {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let s = Vector3.cross(f, this.up); // opposite cross product
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateViewMatrix();
  }

  panLeft(angle = 2) {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let rotation = new Matrix4().setRotate(angle, ...this.up.elements);
    let f_prime = rotation.multiplyVector3(f);
    this.at = new Vector3(this.eye.elements);
    this.at.add(f_prime);
    this.updateViewMatrix();
  }

  panRight(angle = 2) {
    this.panLeft(-angle);
  }
  updateLookDirection(yaw, pitch) {
    const radYaw = yaw * Math.PI / 180;
    const radPitch = pitch * Math.PI / 180;

    const x = Math.cos(radPitch) * Math.sin(radYaw);
    const y = Math.sin(radPitch);
    const z = Math.cos(radPitch) * Math.cos(radYaw);

    const dir = new Vector3([x, y, z]);
    const newAt = new Vector3(this.eye.elements);
    newAt.add(dir);

    this.at = newAt;
    this.updateViewMatrix();
  }
}