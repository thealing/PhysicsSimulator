let mousePositionLabel;
let shapeCountInput;
let displaySvg;
let physicsWorld;

init();

function init() {
  mousePositionLabel = document.getElementById("mouse-position-label");
  shapeCountInput = document.getElementById("shape-count-input");
  displaySvg = document.getElementById("display-svg");
  physicsWorld = new PhysicsWorld();
  physicsExceptionOccurred = false;
  displaySvg.addEventListener("mouseup", onDisplayClicked);
  physicsWorld.gravity.y = 1000;
  document.addEventListener('mousemove', (event) => {
    const displayRect = displaySvg.getBoundingClientRect();
    const mouseX = event.clientX - displayRect.left;
    const mouseY = event.clientY - displayRect.top;
    mousePositionLabel.textContent = "Mouse Pos: " + mouseX + " " + mouseY;
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
  physicsWorld.step(0.01);
  console.table(physicsWorld.counters);
  for (const body of physicsWorld.bodies) {
    body.element && setSvgPosition(body.element, body.position.x, body.position.y, body.angle);
  }
}

function createSvgCircle() {
	const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
	const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	circle.setAttribute("cx", 0);
	circle.setAttribute("cy", 0);
	circle.setAttribute("r", 10);
	circle.setAttribute("fill", "red");
	circle.setAttribute("stroke", "black");
	circle.setAttribute("stroke-width", 1);
	group.appendChild(circle);
	displaySvg.appendChild(group);
	return group;
}

function createSvgSquare() {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  square.setAttribute("x", -10);
  square.setAttribute("y", -10);
  square.setAttribute("width", 10 * 2);
  square.setAttribute("height", 10 * 2);
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
  const shapesToSpawn = shapeCountInput.value;
  for (let i = 0; i < shapesToSpawn; i++) {
    if (Math.random() < 0.5) {
      var shape = new Circle(new Vector2(0, 0), 10);
      var svgElement = createSvgCircle();
    }
    else {
      var shape = Geometry.createSquare(0, 0, 10);
      var svgElement = createSvgSquare();
    }
    const body = physicsWorld.createBody(PhysicsBodyType.DYNAMIC);
    const collider = body.createCollider(shape, 1);
    const displayRect = displaySvg.getBoundingClientRect();
    const x = event.pageX - displayRect.left + Math.random();
    const y = event.pageY - displayRect.top + Math.random();
    body.position.x = x;
    body.position.y = y;
    body.element = svgElement;
  }
}
