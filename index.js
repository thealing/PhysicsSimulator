init();

function init() {
  bodyCountOutput = document.getElementById("body-count");
  colliderCountOutput = document.getElementById("collider-count");
  stepDurationOutput = document.getElementById("step-duration");
  deltaTimeInput = document.getElementById("delta-time");
  gravityInput = document.getElementById("gravity");
  cvgInput = document.getElementById("cvg");
  ctmInput = document.getElementById("ctm");
  spawnRowsInput = document.getElementById("row-count");
  spawnColumnsInput = document.getElementById("column-count");
  shapeSizeInput = document.getElementById("spawn-size");
  shapeGapInput = document.getElementById("spawn-gap");
  displaySvg = document.getElementById("display-svg");
  applyButton = document.getElementById("apply-button");
  pauseButton = document.getElementById("pause-button");
  clearButton = document.getElementById("clear-button");
  stifnessInput = document.getElementById("stifness");
  restingLengthInput = document.getElementById("resting-length");
  deleteBodiesInput = document.getElementById("delete-bodies");
  deleteSpringsInput = document.getElementById("delete-springs");
  deleteBySweepInput = document.getElementById("delete-by-sweep");
  physicsWorld = new PhysicsWorld();
  physicsExceptionOccurred = false;
  displaySvg.addEventListener("mouseup", onDisplayClicked);
  deltaTime = Number(deltaTimeInput.value);
  physicsWorld.gravity.y = Number(gravityInput.value);
  correctionVelocityGain = Number(cvgInput.value);
  correctionTimeMin = Number(ctmInput.value);
  document.addEventListener('mousemove', (event) => {
    const displayRect = displaySvg.getBoundingClientRect();
    mouseX = event.clientX - displayRect.left;
    mouseY = event.clientY - displayRect.top;
  });
  applyButton.addEventListener("click", (event) => {
    deltaTime = Number(deltaTimeInput.value);
    physicsWorld.gravity.y = Number(gravityInput.value);
    correctionVelocityGain = Number(cvgInput.value);
    correctionTimeMin = Number(ctmInput.value);
    lastUpdate = performance.now();
  });
  pauseButton.addEventListener("click", (event) => {
    paused = !paused;
    pauseButton.textContent = paused ? "Resume" : "Pause";
  });
  clearButton.addEventListener("click", (event) => {
    springOriginBody = null;
    springOriginTransform = null;
    for (const spring of physicsWorld.springs) {
      spring.element.remove();
    }
    for (const body of physicsWorld.bodies) {
      if (body.element) {
        body.element.remove();
        body.destroy();
      }
    }
  });
  displaySvg.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
  displaySvg.addEventListener('mousedown', (event) => {
    if (event.button == 1) {
      event.preventDefault();
      if (deleteBySweepInput.checked) {
        sweeping = true;
      }
    }
  });
  displaySvg.addEventListener('mouseup', (event) => {
    if (event.button == 1) {
      sweeping = false;
    }
  });
  displaySvg.addEventListener('mouseleave', (event) => {
    sweeping = false;
  });
  setTimeout(() => {
    const svgRect = displaySvg.getBoundingClientRect();
    const width = svgRect.width;
    const height = svgRect.height;
    const corner1 = new Vector2(0, 0);
    const corner2 = new Vector2(width, 0);
    const corner3 = new Vector2(width, height);
    const corner4 = new Vector2(0, height);
    groundBody = physicsWorld.createBody(PhysicsBodyType.STATIC);
    groundBody.createCollider(Geometry.createSegment(corner1, corner2), 1);
    groundBody.createCollider(Geometry.createSegment(corner2, corner3), 1);
    groundBody.createCollider(Geometry.createSegment(corner3, corner4), 1);
    groundBody.createCollider(Geometry.createSegment(corner4, corner1), 1);
  }, 0);
  lastUpdate = performance.now();
  paused = false;
  springOriginBody = null;
  springOriginOffset = null;
  springOriginAngle = null;
  springMouse = createSvgLine();
  sweeping = false;
  update();
  animate();
}

function update() {
  if (sweeping) {
    deleteObjects();
  }
  if (paused) {
    lastUpdate = performance.now();
    for (const body of physicsWorld.bodies) {
      body.updateWorldTransform();
    }
  }
  const time = performance.now();
  const maxDuration = 100;
  while (performance.now() < time + maxDuration && lastUpdate + deltaTime <= time) {
    lastUpdate = Math.max(time - maxDuration, lastUpdate + deltaTime);
    Physics.correctionVelocityGain = correctionVelocityGain;
    Physics.correctionTimeMin = correctionTimeMin;
    physicsWorld.step(deltaTime / 1000.0);
    bodyCountOutput.value = physicsWorld.counters.bodies;
    colliderCountOutput.value = physicsWorld.counters.colliders;
    stepDurationOutput.value = physicsWorld.counters.stepDuration.toFixed(3);
  }
  setTimeout(update, 0);
}

function animate() {
  for (const body of physicsWorld.bodies) {
    body.element && setSvgPosition(body.element, body.position.x, body.position.y, body.angle);
  }
  for (const spring of physicsWorld.springs) {
    displaySvg.appendChild(spring.element);
    spring.element.setAttribute("x1", spring.worldAnchor1.x);
    spring.element.setAttribute("y1", spring.worldAnchor1.y);
    spring.element.setAttribute("x2", spring.worldAnchor2.x);
    spring.element.setAttribute("y2", spring.worldAnchor2.y);
  }
  if (springOriginBody) {
    const springOrigin = springOriginOffset.clone().rotate(springOriginBody.angle - springOriginAngle).add(springOriginBody.position);
    springMouse.setAttribute("x1", mouseX);
    springMouse.setAttribute("y1", mouseY);
    springMouse.setAttribute("x2", springOrigin.x);
    springMouse.setAttribute("y2", springOrigin.y);
    springMouse.setAttribute("visibility", "visible");
    springMouse.setAttribute("stroke", "green");
    displaySvg.removeChild(springMouse);
    displaySvg.appendChild(springMouse);
  }
  else {
    springMouse.setAttribute("visibility", "hidden");
  }
  requestAnimationFrame(animate);
}

function createSvgLine() {
	const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
	line.setAttribute("stroke", "blue");
	line.setAttribute("stroke-width", 3);
	displaySvg.appendChild(line);
	return line;
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
  if (event.button == 0) {
    const shapeSize = Number(shapeSizeInput.value);
    const shapeGap = Number(shapeGapInput.value);
    const shapesInARow = Number(spawnColumnsInput.value);
    const shapesToSpawn = shapesInARow * Number(spawnRowsInput.value);
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
      const x = mouseX + Math.floor(i % shapesInARow) * (shapeSize * 2 + shapeGap);
      const y = mouseY + Math.floor(i / shapesInARow) * (shapeSize * 2 + shapeGap);
      body.position.x = x;
      body.position.y = y;
      body.element = svgElement;
    }
  }
  else {
    if (event.button == 1) {
      deleteObjects();
    }
    else if (event.button == 2) {
      const point = new Vector2(mouseX, mouseY);
      let clickedBody = null;
      for (const collider of physicsWorld.colliders) {
        if (collider.worldShape.testPoint(point)) {
          clickedBody = collider.body;
        }
      }
      if (clickedBody == null && springOriginBody != null || clickedBody != null && clickedBody == springOriginBody) {
        springOriginBody = null;
        return;
      }
      if (springOriginBody) {
        const springOrigin = springOriginOffset.clone().rotate(springOriginBody.angle - springOriginAngle).add(springOriginBody.position);
        const spring = new PhysicsSpring(springOriginBody, springOrigin, clickedBody, point);
        spring.stiffness = Number(stifnessInput.value);
        const restingLength = Number(restingLengthInput.value);
        if (restingLength >= 0) {
          spring.restingLength = restingLength;
        }
        spring.element = createSvgLine();
        springOriginBody = null;
      }
      else {
        if (clickedBody == null) {
          clickedBody = groundBody;
        }
        springOriginBody = clickedBody;
        springOriginOffset = Vector2.subtract(point, clickedBody.position);
        springOriginAngle = clickedBody.angle;
      }
    }
  } 
}

function deleteObjects() {
  const point = new Vector2(mouseX, mouseY);
  let clickedBody = null;
  for (const collider of physicsWorld.colliders) {
    if (collider.worldShape.testPoint(point)) {
      clickedBody = collider.body;
    }
  }
  if (deleteBodiesInput.checked && clickedBody != null) {
    for (const spring of clickedBody.springs) {
      spring.element.remove();
    }
    clickedBody.element.remove();
    clickedBody.destroy();
  }
  if (deleteSpringsInput.checked) {
    let clickedString = null;
    for (const string of physicsWorld.springs) {
      if (distanceFromSegment(point, string.worldAnchor1, string.worldAnchor2) < 5) {
        clickedString = string;
      }
    }
    if (clickedString != null) {
      clickedString.element.remove();
      clickedString.destroy();
    }
  }
}

function addRandomShapes() {
  const shapeSize = 10;
  const shapesToSpawn = 1700;
  const shapeGap = 5;
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
    const x = 15 + Math.floor(i % shapesInARow) * (shapeSize * 2 + shapeGap);
    const y = 15 + Math.floor(i / shapesInARow) * (shapeSize * 2 + shapeGap);
    body.position.x = x;
    body.position.y = y;
    body.element = svgElement;
  }
}

function distanceFromSegment(p, a, b) {
  let abX = b.x - a.x;
  let abY = b.y - a.y;
  let apX = p.x - a.x;
  let apY = p.y - a.y;
  let t = Util.clamp((abX * apX + abY * apY) / (abX * abX + abY * abY), 0, 1);
  let projectedX = a.x + t * abX;
  let projectedY = a.y + t * abY;
  let distanceSquared = (p.x - projectedX) * (p.x - projectedX) + (p.y - projectedY) * (p.y - projectedY);
  return Math.sqrt(distanceSquared);
}
