class ShapeType {
  static CIRCLE = 0;
  static POLYGON = 1;
  static COUNT = 2;
};

class PhysicsBodyType {
  static DYNAMIC = 0;
  static STATIC = 1;
};

class Circle {
  constructor(center, radius) {
    this.type = ShapeType.CIRCLE;
    this.set(center, radius);
  }

  clone() {
    return new Circle(this.center.clone(), this.radius);
  }

  set(center, radius) {
    this.center = center;
    this.radius = radius;
    return this;
  }

  transform(tf) {
    this.center.transform(tf);
    return this;
  }

  transformOf(that, tf) {
    this.center.transformOf(that.center, tf);
    this.radius = that.radius;
  }

  getBoundingRect(rect) {
    rect.min.copy(this.center).subtractScalar(this.radius);
    rect.max.copy(this.center).addScalar(this.radius);
  }

  getCentroid() {
    return this.center.clone();
  }

  getLinearMassFactor() {
    return this.radius ** 2 * Math.PI;
  }

  getAngularMassFactor() {
    return this.radius ** 2 / 2;
  }

  testPoint(point) {
    return Vector2.distanceSquared(this.center, point) <= this.radius ** 2;
  }
}

class Polygon {
  constructor(points) {
    this.type = ShapeType.POLYGON;
    this.set(points);
  }

  clone() {
    return new Polygon(Util.cloneArray(this.points));
  }

  set(points) {
    this.points = points;
    if (this.getLinearMassFactor() < 0) {
      this.points.reverse();
    }
    return this;
  }

  transform(tf) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].transform(tf);
    }
    return this;
  }

  transformOf(that, tf) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].transformOf(that.points[i], tf);
    }
    return this;
  }

  getBoundingRect(rect) {
    rect.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    rect.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    for (let i = 0; i < this.points.length; i++) {
      rect.min.x = Math.min(rect.min.x, this.points[i].x);
      rect.min.y = Math.min(rect.min.y, this.points[i].y);
      rect.max.x = Math.max(rect.max.x, this.points[i].x);
      rect.max.y = Math.max(rect.max.y, this.points[i].y);
    }
  }

  getCentroid() {
    let centroid = new Vector2(0, 0);
    let weight = 0;
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      const a = this.points[i];
      const b = this.points[j];
      const d = Vector2.distance(a, b);
      centroid.add(Vector2.add(a, b).multiply(d));
      weight += d;
    }
    return centroid.divide(weight);
  }

  getLinearMassFactor() {
    let area = 0;
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      const a = this.points[i];
      const b = this.points[j];
      area += Vector2.cross(a, b);
    }
    area /= 2;
    return area;
  }

  getAngularMassFactor() {
    let numer = 0;
    let denom = 0;
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      const a = this.points[i];
      const b = this.points[j];
      numer += Vector2.cross(a, b) * (Vector2.dot(a, a) + Vector2.dot(a, b) + Vector2.dot(b, b));
      denom += Vector2.cross(a, b) * 6;
    }
    return numer / denom - this.getCentroid().length();
  }

  testPoint(point) {
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      if (Vector2.cross(Vector2.subtract(this.points[j], this.points[i]), Vector2.subtract(point, this.points[i])) < 0) {
        return false;
      }
    }
    return true;
  }
}

class Rect {
  constructor(min, max) {
    this.set(min, max);
  }

  clone() {
    return new Rect(this.min.clone(), this.max.clone());
  }

  set(min, max) {
    this.min = min;
    this.max = max;
    return this;
  }

  testPoint(point) {
    return point.x >= this.min.x && point.y >= this.min.y && point.x <= this.max.x && point.y <= this.max.y;
  }
}

class CollisionFilter {
  constructor(category, mask, group) {
    this.category = category;
    this.mask = mask;
    this.group = group;
  }

  test(that) {
    if (this.group == that.group) {
      if (this.group > 0) {
        return true;
      }
      if (this.group < 0) {
        return false;
      }
    }
    return (this.category & that.mask) && (this.mask & that.category);
  }
}

class PhysicsCounters {
  constructor() {
    this.reset();
  }

  reset() {
    this.bodies = 0;
    this.colliders = 0;
    this.springs = 0;
    this.boundingRectsSkipped = 0;
    this.boundingRectsTested = 0;
    this.shapesTested = 0;
    this.collisionsDetected = 0;
    this.collisionsHandled = 0;
    this.stepDuration = 0;
  }
}

class PhysicsWorld {
  constructor() {
    this.gravity = new Vector2(0, 0);
    this.bodies = new List();
    this.colliders = new List();
    this.springs = new List();
    this.counters = new PhysicsCounters();
  }

  destroy() {
    for (const body of this.bodies) {
      body.destroy();
    }
    for (const collider of this.colliders) {
      collider.destroy();
    }
    for (const spring of this.springs) {
      spring.destroy();
    }
  }

  createBody(type) {
    return new PhysicsBody(this, type);
  }

  step(deltaTime) {
    this.counters.reset();
    this.counters.bodies = this.bodies.size;
    this.counters.colliders = this.colliders.size;
    this.counters.springs = this.springs.size;
    const stepStartTime = performance.now();
    for (const body of this.bodies) {
      body.updateWorldTransform();
    }
    for (const body of this.bodies) {
      if (body.type == PhysicsBodyType.STATIC) {
        body.linearVelocity.set(0, 0);
        body.angularVelocity = 0;
        continue;
      }
      body.linearVelocity.addScaled(this.gravity, deltaTime);
      body.linearVelocity.addScaled(body.linearForce, body.inverseLinearMass * deltaTime);
      body.angularVelocity += body.angularForce * body.inverseAngularMass * deltaTime;
    }
    for (const spring of physicsWorld.springs) {
      const vector = Vector2.subtract(spring.worldAnchor2, spring.worldAnchor1);
      const distance = vector.length();
      if (distance == 0) {
        continue;
      }
      vector.normalize().multiply((spring.restingLength - distance) * spring.stiffness);
      spring.body1.applyImpulseAtWorldPoint(spring.worldAnchor1, Vector2.negate(vector));
      spring.body2.applyImpulseAtWorldPoint(spring.worldAnchor2, vector);
    }
    for (let colliderNode = this.colliders.first, next; colliderNode != null; colliderNode = next) {
      next = colliderNode.next;
      while (colliderNode.prev != null && colliderNode.item.worldBoundingRect.min.x < colliderNode.prev.item.worldBoundingRect.min.x) {
        colliderNode.swapWithPrev();
      }
    }
    let collisions = [];
    for (let colliderNode1 = this.colliders.first; colliderNode1 != null; colliderNode1 = colliderNode1.next) {
      let collider1 = colliderNode1.item;
      if (!collider1.enabled) {
        continue;
      }
      for (let colliderNode2 = colliderNode1.next; colliderNode2 != null; colliderNode2 = colliderNode2.next) {
        let collider2 = colliderNode2.item;
        if (collider2.worldBoundingRect.min.x > collider1.worldBoundingRect.max.x) {
          this.counters.boundingRectsSkipped++;
          break;
        }
        if (!collider2.enabled) {
          continue;
        }
        this.counters.boundingRectsTested++;
        if (collider2.worldBoundingRect.min.y > collider1.worldBoundingRect.max.y || collider2.worldBoundingRect.max.y < collider1.worldBoundingRect.min.y) {
          continue;
        }
        if (collider1.body == collider2.body) {
          continue;
        }
        if (!collider1.filter.test(collider2.filter)) {
          continue;
        }
        this.counters.shapesTested++;
        const collision = Physics.collide(collider1, collider2);
        if (collision == null) {
          continue;
        }
        this.counters.collisionsDetected++;
        if (!collider1.sensor && !collider2.sensor) {
          this.counters.collisionsHandled++;
          collisions.push(collision);
        }
      }
    }
    for (const {collider1, collider2, collision} of collisions) {
      const body1 = collider1.body;
      const body2 = collider2.body;
      const tangent1 = Vector2.subtract(collision.point, body1.position).rotateLeft();
      const tangent2 = Vector2.subtract(collision.point, body2.position).rotateLeft();
      const contactVelocity1 = Vector2.multiply(tangent1, body1.angularVelocity).add(body1.linearVelocity);
      const contactVelocity2 = Vector2.multiply(tangent2, body2.angularVelocity).add(body2.linearVelocity);
      const relativeVelocity = Vector2.subtract(contactVelocity2, contactVelocity1);
      const normalVelocity = Vector2.dot(collision.normal, relativeVelocity);
      if (normalVelocity >= 0) {
        continue;
      }
      const combinedRestitution = Math.max(collider1.restitution, collider2.restitution);
      const normalInverseMass1 = body1.inverseLinearMass + body1.inverseAngularMass * Vector2.dot(collision.normal, tangent1) ** 2;
      const normalInverseMass2 = body2.inverseLinearMass + body2.inverseAngularMass * Vector2.dot(collision.normal, tangent2) ** 2;
      const collisionImpulse = -normalVelocity * (1 + combinedRestitution) / (normalInverseMass1 + normalInverseMass2);
      body1.linearVelocity.subtractScaled(collision.normal, collisionImpulse * body1.inverseLinearMass);
      body2.linearVelocity.addScaled(collision.normal, collisionImpulse * body2.inverseLinearMass);
      body1.angularVelocity -= Vector2.dot(collision.normal, tangent1) * collisionImpulse * body1.inverseAngularMass;
      body2.angularVelocity += Vector2.dot(collision.normal, tangent2) * collisionImpulse * body2.inverseAngularMass;
      const collisionTangent = collision.normal.clone().rotateRight();
      const tangentVelocity = Vector2.dot(collisionTangent, relativeVelocity);
      const combinedStaticFriction = Math.sqrt(collider1.staticFriction, collider2.staticFriction);
      const combinedDynamicFriction = Math.sqrt(collider1.dynamicFriction, collider2.dynamicFriction);
      const tangentInverseMass1 = body1.inverseLinearMass + body1.inverseAngularMass * Vector2.dot(collisionTangent, tangent1) ** 2;
      const tangentInverseMass2 = body2.inverseLinearMass + body2.inverseAngularMass * Vector2.dot(collisionTangent, tangent2) ** 2;
      let frictionInpulse = -tangentVelocity * combinedStaticFriction / (tangentInverseMass1 + tangentInverseMass2);
      if (Math.abs(frictionInpulse) > Math.abs(collisionImpulse) * combinedStaticFriction) {
        frictionInpulse = Math.sign(frictionInpulse) * Math.abs(collisionImpulse) * combinedDynamicFriction;
      }
      body1.linearVelocity.subtractScaled(collisionTangent, frictionInpulse * body1.inverseLinearMass);
      body2.linearVelocity.addScaled(collisionTangent, frictionInpulse * body2.inverseLinearMass);
      body1.angularVelocity -= Vector2.dot(collisionTangent, tangent1) * frictionInpulse * body1.inverseAngularMass;
      body2.angularVelocity += Vector2.dot(collisionTangent, tangent2) * frictionInpulse * body2.inverseAngularMass;
    }
    for (const {collider1, collider2, collision} of collisions) {
      const body1 = collider1.body;
      const body2 = collider2.body;
      const tangent1 = Vector2.subtract(collision.point, body1.position).rotateLeft();
      const tangent2 = Vector2.subtract(collision.point, body2.position).rotateLeft();
      const contactVelocity1 = Vector2.multiply(tangent1, body1.angularVelocity).add(body1.linearVelocity);
      const contactVelocity2 = Vector2.multiply(tangent2, body2.angularVelocity).add(body2.linearVelocity);
      const relativeVelocity = Vector2.subtract(contactVelocity2, contactVelocity1);
      const normalVelocity = Vector2.dot(collision.normal, relativeVelocity);
      let correctionInpulse = collision.depth / Math.max(deltaTime, Physics.correctionTimeMin) - normalVelocity;
      if (correctionInpulse <= 0) {
        continue;
      }
      const inverseMass1 = body1.inverseLinearMass + body1.inverseAngularMass * Vector2.dot(collision.normal, tangent1) ** 2;
      const inverseMass2 = body2.inverseLinearMass + body2.inverseAngularMass * Vector2.dot(collision.normal, tangent2) ** 2;
      correctionInpulse /= inverseMass1 + inverseMass2;
      body1.applyCorrectionImpulse(collision.point, Vector2.multiply(collision.normal, -correctionInpulse));
      body2.applyCorrectionImpulse(collision.point, Vector2.multiply(collision.normal, correctionInpulse));
    }
    for (const body of this.bodies) {
      if (body.type == PhysicsBodyType.STATIC) {
        continue;
      }
      body.position.add(Vector2.add(body.linearVelocity, body.linearVelocityCorrection).multiply(deltaTime));
      body.angle += (body.angularVelocity + body.angularVelocityCorrection) * deltaTime;
      const linearVelocityChange = Vector2.multiply(body.linearVelocityCorrection, Physics.correctionVelocityGain);
      const angularVelocityChange = body.angularVelocityCorrection * Physics.correctionVelocityGain;
      body.linearVelocity.add(linearVelocityChange);
      body.angularVelocity += angularVelocityChange;
      body.linearVelocityCorrection.multiply(0);
      body.angularVelocityCorrection *= 0;
      body.worldTransformIsDirty = true;
      body.updateWorldTransform();
    }
    const stepEndTime = performance.now();
    this.counters.stepDuration = stepEndTime - stepStartTime;
  }
}

class PhysicsBody {
  constructor(world, type) {
    this.world = world;
    this.nodeInWorld = world.bodies.insertLast(this);
    this.type = type;
    this.localCenterOfMass = new Vector2(0, 0);
    this.worldCenterOfMass = new Vector2(0, 0);
    this.inverseLinearMass = 0;
    this.inverseAngularMass = 0;
    this.position = new Vector2(0, 0);
    this.angle = 0;
    this.linearVelocity = new Vector2(0, 0);
    this.angularVelocity = 0;
    this.linearForce = new Vector2(0, 0);
    this.angularForce = 0;
    this.linearVelocityCorrection = new Vector2(0, 0);
    this.angularVelocityCorrection = 0;
    this.worldTransformIsDirty = false;
    this.colliders = new List();
    this.springs = new List();
  }

  destroy() {
    this.destroyAllColliders();
    this.destroyAllSprings();
    this.nodeInWorld.remove();
    this.nodeInWorld = null;
    this.world = null;
  }

  createCollider(shape, density) {
    return new PhysicsCollider(this, shape, density);
  }

  destroyAllColliders() {
    for (const collider of this.colliders) {
      collider.destroy();
    }
  }

  destroyAllSprings() {
    for (const spring of this.springs) {
      spring.destroy();
    }
  }

  getTransform() {
    return new Transform(this.position, this.angle);
  }

  getInverseTransform() {
    return new Transform(this.position, this.angle).invert();
  }

  applyImpulseAtLocalPoint(localPoint, impulse) {
    this.linearVelocity.add(impulse.clone().rotate(this.angle).multiply(this.inverseLinearMass));
    this.angularVelocity += Vector2.cross(localPoint, impulse) * this.inverseAngularMass;
  }

  applyImpulseAtWorldPoint(worldPoint, impulse) {
    this.linearVelocity.add(impulse.clone().multiply(this.inverseLinearMass));
    this.angularVelocity += Vector2.cross(worldPoint.clone().subtract(this.position), impulse) * this.inverseAngularMass;
  }

  applyForceAtLocalPoint(localPoint, force) {
    this.linearForce.add(force.clone().rotate(this.angle));
    this.angularForce += Vector2.cross(localPoint, force);
  }

  applyForceAtWorldPoint(worldPoint, force) {
    this.linearForce.add(force);
    this.angularForce += Vector2.cross(worldPoint.clone().subtract(this.position), force);
  }

  applyCorrectionImpulse(point, impulse) {
    this.linearVelocityCorrection.add(impulse.clone().multiply(this.inverseLinearMass));
    this.angularVelocityCorrection += Vector2.cross(point.clone().subtract(this.position), impulse) * this.inverseAngularMass;
  }

  updateWorldTransform() {
    if (!this.worldTransformIsDirty) {
      return;
    }
    const transform = this.getTransform();
    this.worldCenterOfMass.transformOf(this.localCenterOfMass, transform);
    for (const collider of this.colliders) {
      collider.worldShape.transformOf(collider.localShape, transform);
      collider.worldShape.getBoundingRect(collider.worldBoundingRect);
    }
    for (const spring of this.springs) {
      if (spring.body1 == this) {
        spring.worldAnchor1.transformOf(spring.localAnchor1, transform);
      }
      if (spring.body2 == this) {
        spring.worldAnchor2.transformOf(spring.localAnchor2, transform);
      }
    }
    this.worldTransformIsDirty = false;
  }

  addColliderMass(collider) {
    if (this.type == PhysicsBodyType.STATIC) {
      return;
    }
    const bodyCenterOfMass = this.localCenterOfMass.clone();
    const bodyLinearMass = this.inverseLinearMass == 0 ? 0 : 1 / this.inverseLinearMass;
    const bodyAngularMass = this.inverseAngularMass == 0 ? 0 : 1 / this.inverseAngularMass;
    const colliderCenterOfMass = collider.localShape.getCentroid();
    const colliderLinearMass = collider.localShape.getLinearMassFactor() * collider.density;
    const colliderAngularMass = collider.localShape.getAngularMassFactor() * colliderLinearMass;
    const newCenterOfMass = Vector2.multiply(bodyCenterOfMass, bodyLinearMass).addScaled(colliderCenterOfMass, colliderLinearMass).divide(bodyLinearMass + colliderLinearMass);
    const newLinearMass = bodyLinearMass + colliderLinearMass;
    const newAngularMass = bodyAngularMass + bodyLinearMass * Vector2.distanceSquared(bodyCenterOfMass, newCenterOfMass) + colliderAngularMass + colliderLinearMass * Vector2.distanceSquared(colliderCenterOfMass, newCenterOfMass);
    this.localCenterOfMass = newCenterOfMass;
    this.inverseLinearMass = newLinearMass == 0 ? 0 : 1 / newLinearMass;
    this.inverseAngularMass = newAngularMass == 0 ? 0 : 1 / newAngularMass;
  }

  subtractColliderMass(collider) {
    if (this.type == PhysicsBodyType.STATIC) {
      return;
    }
    const bodyCenterOfMass = this.localCenterOfMass.clone();
    const bodyLinearMass = this.inverseLinearMass == 0 ? 0 : 1 / this.inverseLinearMass;
    const bodyAngularMass = this.inverseAngularMass == 0 ? 0 : 1 / this.inverseAngularMass;
    const colliderCenterOfMass = collider.localShape.getCentroid();
    const colliderLinearMass = collider.localShape.getLinearMassFactor() * collider.density;
    const colliderAngularMass = collider.localShape.getAngularMassFactor() * colliderLinearMass;
    const newCenterOfMass = Vector2.multiply(bodyCenterOfMass, bodyLinearMass).subtractScaled(colliderCenterOfMass, colliderLinearMass).divide(bodyLinearMass - colliderLinearMass);
    const newLinearMass = bodyLinearMass - colliderLinearMass;
    const newAngularMass = bodyAngularMass + bodyLinearMass * Vector2.distanceSquared(bodyCenterOfMass, newCenterOfMass) - colliderAngularMass - colliderLinearMass * Vector2.distanceSquared(colliderCenterOfMass, newCenterOfMass);
    this.localCenterOfMass = newCenterOfMass;
    this.inverseLinearMass = newLinearMass == 0 ? 0 : 1 / newLinearMass;
    this.inverseAngularMass = newAngularMass == 0 ? 0 : 1 / newAngularMass;
  }
}

class PhysicsCollider {
  constructor(body, shape, density) {
    this.body = body;
    this.nodeInBody = body.colliders.insertLast(this);
    this.nodeInWorld = body.world.colliders.insertLast(this);
    this.density = density;
    this.restitution = 0.3;
    this.staticFriction = 0.2;
    this.dynamicFriction = 0.2;
    this.localShape = shape.clone();
    this.worldShape = shape.clone();
    this.worldBoundingRect = new Rect(new Vector2(0, 0), new Vector2(0, 0));
    this.filter = new CollisionFilter(0xFFFFFFFF, 0xFFFFFFFF, 0);
    this.enabled = true;
    this.sensor = false;
    this.body.worldTransformIsDirty = true;
    this.body.addColliderMass(this);
  }

  destroy() {
    this.body.worldTransformIsDirty = true;
    this.body.subtractColliderMass(this);
    this.nodeInWorld.remove();
    this.nodeInBody.remove();
    this.nodeInWorld = null;
    this.nodeInBody = null;
    this.body = null;
  }
}

class PhysicsSpring {
  constructor(body1, anchor1, body2, anchor2) {
    this.body1 = body1;
    this.body2 = body2;
    this.worldAnchor1 = anchor1;
    this.worldAnchor2 = anchor2;
    this.localAnchor1 = new Vector2().transformOf(anchor1, body1.getInverseTransform());
    this.localAnchor2 = new Vector2().transformOf(anchor2, body2.getInverseTransform());
    this.stiffness = 0;
    this.restingLength = Vector2.distance(anchor1, anchor2);
    this.nodeInBody1 = body1.springs.insertLast(this);
    this.nodeInBody2 = body2.springs.insertLast(this);
    this.nodeInWorld = body1.world.springs.insertLast(this);
  }

  destroy() {
    this.nodeInWorld.remove();
    this.nodeInBody1.remove();
    this.nodeInBody2.remove();
  }
}

class Geometry {
  static createSegment(a, b) {
    return new Polygon([a, b]);
  }

  static createSquare(x, y, a) {
    return new Polygon([
      new Vector2(x - a, y - a), 
      new Vector2(x + a, y - a), 
      new Vector2(x + a, y + a), 
      new Vector2(x - a, y + a)
    ]);
  }

  static projectOntoLine(a, b, p) {
    const ab = Vector2.subtract(b, a);
    const t = Vector2.dot(ab, Vector2.subtract(p, a)) / ab.lengthSquared();
    return ab.multiply(t).add(a);
  }

  static projectOntoSegment(a, b, p) {
    const ab = Vector2.subtract(b, a);
    const t = Util.clamp(Vector2.dot(ab, Vector2.subtract(p, a)) / ab.lengthSquared(), 0, 1);
    return ab.multiply(t).add(a);
  }

  static collideShapes(shape1, shape2) {
    switch (shape1.type * ShapeType.COUNT + shape2.type) {
      case ShapeType.CIRCLE * ShapeType.COUNT + ShapeType.CIRCLE: {
        return Geometry.collideCircles(shape1, shape2);
      }
      case ShapeType.POLYGON * ShapeType.COUNT + ShapeType.POLYGON: {
        return Geometry.collidePolygons(shape1, shape2);
      }
      case ShapeType.CIRCLE * ShapeType.COUNT + ShapeType.POLYGON: {
        return Geometry.collideCirclePolygon(shape1, shape2);
      }
      case ShapeType.POLYGON * ShapeType.COUNT + ShapeType.CIRCLE: {
        const collision = Geometry.collideCirclePolygon(shape2, shape1);
        if (collision != null) {
          collision.normal.negate();
        }
        return collision;
      }
    }
  }

  static collideCircles(circle1, circle2) {
    const centerDistanceSquared = Vector2.distanceSquared(circle1.center, circle2.center);
    const sumOfRadii = circle1.radius + circle2.radius;
    if (centerDistanceSquared > sumOfRadii ** 2) {
      return null;
    }
    if (centerDistanceSquared == 0) {
      return null;
    }
    return { 
      point: Vector2.middle(circle1.center, circle2.center), 
      normal: Vector2.subtract(circle2.center, circle1.center).normalize(),
      depth: sumOfRadii - Math.sqrt(centerDistanceSquared),
    };
  }

  static collidePolygons(polygon1, polygon2) {
    let collisionDepth = Number.POSITIVE_INFINITY;
    let collisionPoint = null;
    let collisionNormal = null;
    for (let i = polygon1.points.length - 1, j = 0; j < polygon1.points.length; i = j, j++) {
      const a = polygon1.points[i];
      const b = polygon1.points[j];
      const axis = Vector2.subtract(b, a).rotateRight().normalize();
      let depthMax = Number.NEGATIVE_INFINITY;
      let deepestPoint = new Vector2();
      for (const point of polygon2.points) {
        const depth = Vector2.dot(a, axis) - Vector2.dot(point, axis);
        if (depth > depthMax) {
          depthMax = depth;
          deepestPoint.copy(point);
        }
        else if (depth == depthMax) {
          deepestPoint.add(point).divide(2);
        }
      }
      if (depthMax < 0) {
        return null;
      }
      if (depthMax < collisionDepth) {
        collisionDepth = depthMax;
        collisionPoint = deepestPoint;
        collisionNormal = axis;
      }
    }
    for (let i = polygon2.points.length - 1, j = 0; j < polygon2.points.length; i = j, j++) {
      const a = polygon2.points[i];
      const b = polygon2.points[j];
      const axis = Vector2.subtract(b, a).rotateLeft().normalize();
      let depthMax = Number.NEGATIVE_INFINITY;
      let deepestPoint = new Vector2();
      for (const point of polygon1.points) {
        const depth = Vector2.dot(point, axis) - Vector2.dot(a, axis);
        if (depth > depthMax) {
          depthMax = depth;
          deepestPoint.copy(point);
        }
        else if (depth == depthMax) {
          deepestPoint.add(point).divide(2);
        }
      }
      if (depthMax < 0) {
        return null;
      }
      if (depthMax < collisionDepth) {
        collisionDepth = depthMax;
        collisionPoint = deepestPoint;
        collisionNormal = axis;
      }
    }
    return {
      point: collisionPoint,
      normal: collisionNormal,
      depth: collisionDepth,
    };
  }

  static collideCirclePolygon(circle, polygon) {
    let collisionDepth = Number.POSITIVE_INFINITY;
    let collisionPoint = null;
    let collisionNormal = null;
    let collidedPerpendicularly = false;
    for (let i = polygon.points.length - 1, j = 0; j < polygon.points.length; i = j, j++) {
      const a = polygon.points[i];
      const b = polygon.points[j];
      if (Vector2.equal(a, b)) {
        continue;
      }
      const centerProjected = Geometry.projectOntoLine(a, b, circle.center);
      if (Vector2.equal(centerProjected, circle.center)) {
        continue;
      }
      if (Vector2.equal(centerProjected, Geometry.projectOntoSegment(a, b, circle.center))) {
        collidedPerpendicularly = true;
      }
      const axis = Vector2.subtract(b, a).rotateLeft().normalize();
      const depth = circle.radius + Vector2.dot(circle.center, axis) - Vector2.dot(centerProjected, axis);
      if (depth < 0) {
        return null;
      }
      if (depth < collisionDepth) {
        collisionDepth = depth;
        collisionPoint = centerProjected;
        collisionNormal = axis;
      }
    }
    if (!collidedPerpendicularly) {
      for (let i = polygon.points.length - 1, j = 0; j < polygon.points.length; i = j, j++) {
        const a = polygon.points[i];
        const b = polygon.points[j];
        if (Vector2.equal(a, b)) {
          continue;
        }
        const centerProjected = Geometry.projectOntoSegment(a, b, circle.center);
        if (Vector2.equal(centerProjected, circle.center)) {
          continue;
        }
        const axis = Vector2.subtract(b, a).rotateLeft();
        if (Vector2.dot(circle.center, axis) >= Vector2.dot(centerProjected, axis)) {
          axis.copy(circle.center).subtract(centerProjected);
        }
        else {
          axis.copy(centerProjected).subtract(circle.center);
        }
        axis.normalize();
        const depth = circle.radius + Vector2.dot(circle.center, axis) - Vector2.dot(centerProjected, axis);
        if (depth < 0) {
          return null;
        }
        if (depth < collisionDepth) {
          collisionDepth = depth;
          collisionPoint = centerProjected;
          collisionNormal = axis;
        }
      }
    }
    if (collisionDepth == Number.POSITIVE_INFINITY) {
      return null;
    }
    return {
      point: collisionPoint,
      normal: collisionNormal,
      depth: collisionDepth,
    };
  }
}

class Physics {
  static correctionVelocityGain = 0.1;
  static correctionTimeMin = 0.01;

  static collide(collider1, collider2) {
    const collision = Geometry.collideShapes(collider1.worldShape, collider2.worldShape);
    return collision == null ? null : {collider1, collider2, collision};
  }
}
