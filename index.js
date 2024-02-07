init();

function init() {
  mousePositionOutput = document.getElementById("mouse-position-output");
  bodyCountOutput = document.getElementById("body-count-output");
  colliderCountOutput = document.getElementById("collider-count-output");
  stepDurationOutput = document.getElementById("step-duration-output");
  correctionVelocityGainInput = document.getElementById("correction-velocity-gain-input");
  shapesToSpawnInput = document.getElementById("shapes-to-spawn-input");
  shapeSizeInput = document.getElementById("shape-size-input");
  shapeGapInput = document.getElementById("shape-gap-input");
  displaySvg = document.getElementById("display-svg");
  physicsWorld = new PhysicsWorld();
  physicsExceptionOccurred = false;
  displaySvg.addEventListener("mouseup", onDisplayClicked);
  physicsWorld.gravity.y = 400;
  document.addEventListener('mousemove', (event) => {
    const displayRect = displaySvg.getBoundingClientRect();
    const mouseX = event.clientX - displayRect.left;
    const mouseY = event.clientY - displayRect.top;
    this.mousePositionOutput.value = mouseX + " , " + mouseY;
  });
  setTimeout(() => {
    const svgRect = displaySvg.getBoundingClientRect();
    const width = svgRect.width;
    const height = svgRect.height;
    const corner1 = new Vector2(0, 0);
    const corner2 = new Vector2(width, 0);
    const corner3 = new Vector2(width, height);
    const corner4 = new Vector2(0, height);
    const body = physicsWorld.createBody(PhysicsBodyType.STATIC);
    body.createCollider(Geometry.createSegment(corner1, corner2), 1);
    body.createCollider(Geometry.createSegment(corner2, corner3), 1);
    body.createCollider(Geometry.createSegment(corner3, corner4), 1);
    body.createCollider(Geometry.createSegment(corner4, corner1), 1);
  }, 0);
  setInterval(update, 10);
}

function update() {
  Physics.correctionVelocityGain = Number(correctionVelocityGainInput.value);
  physicsWorld.step(0.01);
  bodyCountOutput.value = physicsWorld.counters.bodies;
  colliderCountOutput.value = physicsWorld.counters.colliders;
  stepDurationOutput.value = physicsWorld.counters.stepDuration.toFixed(3);
  for (const body of physicsWorld.bodies) {
    body.element && setSvgPosition(body.element, body.position.x, body.position.y, body.angle);
  }
}

function createSvgCircle(radius) {
	const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
	const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	circle.setAttribute("cx", 0);
	circle.setAttribute("cy", 0);
	circle.setAttribute("r", radius);
	circle.setAttribute("fill", "red");
	circle.setAttribute("stroke", "black");
	circle.setAttribute("stroke-width", 1);
	group.appendChild(circle);
	displaySvg.appendChild(group);
	return group;
}

function createSvgSquare(radius) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  square.setAttribute("x", -radius);
  square.setAttribute("y", -radius);
  square.setAttribute("width", radius * 2);
  square.setAttribute("height", radius * 2);
  square.setAttribute("fill", "red");
  square.setAttribute("stroke", "black");
  square.setAttribute("stroke-width", 1);
  group.appendChild(square);
  displaySvg.appendChild(group);
  return group;
}

function setSvgPosition(element, x, y, angle) {
  element.setAttribute("transform", `translate(${x}, ${y}) rotate(${angle * (180 / Math.PI)})`);
}

function onDisplayClicked(event) {
  if (event.target != displaySvg) {
    return;
  }
  const shapeSize = Number(shapeSizeInput.value);
  const shapesToSpawn = Number(shapesToSpawnInput.value);
  const shapeGap = Number(shapeGapInput.value);
  const shapesInARow = Math.ceil(Math.sqrt(shapesToSpawn));
  for (let i = 0; i < shapesToSpawn; i++) {
    if (Math.random() < 0.5) {
      var shape = new Circle(new Vector2(0, 0), shapeSize);
      var svgElement = createSvgCircle(shapeSize);
    }
    else {
      var shape = Geometry.createSquare(0, 0, shapeSize);
      var svgElement = createSvgSquare(shapeSize);
    }
    const body = physicsWorld.createBody(PhysicsBodyType.DYNAMIC);
    const collider = body.createCollider(shape, 1);
    const displayRect = displaySvg.getBoundingClientRect();
    const x = event.pageX - displayRect.left + (Math.floor(i % shapesInARow) - Math.floor(shapesInARow / 2)) * (shapeSize * 2 + shapeGap);
    const y = event.pageY - displayRect.top + (Math.floor(i / shapesInARow) - Math.floor(shapesToSpawn / shapesInARow / 2)) * (shapeSize * 2 + shapeGap);
    body.position.x = x;
    body.position.y = y;
    body.element = svgElement;
  }
}
