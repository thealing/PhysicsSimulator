class Vector2 {
  constructor(x, y) {
    this.set(x, y);
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  addScalar(s) {
    this.x += s;
    this.y += s;
    return this;
  }

  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  subtractScalar(s) {
    this.x -= s;
    this.y -= s;
    return this;
  }

  multiply(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  divide(s) {
    this.x /= s;
    this.y /= s;
    return this;
  }

  addScaled(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    return this;
  }

  subtractScaled(v, s) {
    this.x -= v.x * s;
    this.y -= v.y * s;
    return this;
  }

  normalize() {
    return this.divide(this.length());
  }
  
  rotateLeft() {
    return this.set(-this.y, this.x);
  }
  
  rotateRight() {
    return this.set(this.y, -this.x);
  }

  rotate(a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return this.set(c * this.x - s * this.y, s * this.x + c * this.y);
  }

  transform(t) {
    return this.set(t.c * this.x - t.s * this.y + t.x, t.s * this.x + t.c * this.y + t.y);
  }

  transformOf(v, t) {
    return this.set(t.c * v.x - t.s * v.y + t.x, t.s * v.x + t.c * v.y + t.y);
  }

  negate() {
    return this.set(-this.x, -this.y);
  }

  length() {
    return Math.sqrt(this.lengthSquared());
  }
  
  lengthSquared() {
    return this.x ** 2 + this.y ** 2;
  }

  static equal(v, w) {
    return v.x === w.x && v.y === w.y;
  }

  static negate(v) {
    return new Vector2(-v.x, -v.y);
  }

  static add(v, w) {
    return new Vector2(v.x + w.x, v.y + w.y);
  }

  static subtract(v, w) {
    return new Vector2(v.x - w.x, v.y - w.y);
  }

  static multiply(v, s) {
    return new Vector2(v.x * s, v.y * s);
  }

  static divide(v, s) {
    return new Vector2(v.x / s, v.y / s);
  }

  static middle(v, w) {
    return new Vector2((v.x + w.x) / 2, (v.y + w.y) / 2);
  }
  
  static distance(v, w) {
    return Math.sqrt(Vector2.distanceSquared(v, w));
  }
  
  static distanceSquared(v, w) {
    return (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  }

  static dot(v, w) {
    return v.x * w.x + v.y * w.y;
  }
  
  static cross(v, w) {
    return v.x * w.y - v.y * w.x;
  }
}

class Transform {
  constructor(v, a) {
    this.set(v, a);
  }

  clone() {
    return new Transform(this.x, this.y, this.c, this.s);
  }

  set(v, a) {
    this.x = v.x;
    this.y = v.y;
    this.c = Math.cos(a);
    this.s = Math.sin(a);
    return this;
  }

  set2(x, y, c, s) {
    this.x = x;
    this.y = y;
    this.c = c;
    this.s = s;
    return this;
  }

  copy(t) {
    this.x = t.x;
    this.y = t.y;
    this.c = t.c;
    this.s = t.s;
    return this;
  }

  invert() {
    return this.set2(-this.c * this.x - this.s * this.y, this.s * this.x - this.c * this.y, this.c, -this.s);
  }
}
