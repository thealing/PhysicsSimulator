init();

function init() {
  hitRadius = 9;
  editSize = 500;
  bodyCountOutput = document.getElementById("body-count");
  colliderCountOutput = document.getElementById("collider-count");
  rectTestCountOutput = document.getElementById("rect-test-count");
  shapeTestCountOutput = document.getElementById("shape-test-count");
  collisionCountOutput = document.getElementById("collision-count");
  stepDurationOutput = document.getElementById("step-duration");
  deltaTimeInput = document.getElementById("delta-time");
  gravityInput = document.getElementById("gravity");
  cvgInput = document.getElementById("cvg");
  ctmInput = document.getElementById("ctm");
  wallTypeSelect = document.getElementById("wall-type");
  wallRestitutionInput = document.getElementById("wall-restitution");
  wallFrictionInput = document.getElementById("wall-friction");
  spawnRowsInput = document.getElementById("row-count");
  spawnColumnsInput = document.getElementById("column-count");
  shapeSizeInput = document.getElementById("spawn-size");
  shapeGapInput = document.getElementById("spawn-gap");
  displaySvg = document.getElementById("display-svg");
  applyButton = document.getElementById("apply-button");
  pauseButton = document.getElementById("pause-button");
  clearButton = document.getElementById("clear-button"); 
  editButton = document.getElementById("edit-button"); 
  stifnessInput = document.getElementById("stifness");
  restingLengthInput = document.getElementById("resting-length");
  deleteWallsInput = document.getElementById("delete-walls");
  deleteBodiesInput = document.getElementById("delete-bodies");
  deleteSpringsInput = document.getElementById("delete-springs");
  deleteBySweepInput = document.getElementById("delete-by-sweep");
  toolbarHeaders = document.querySelectorAll(".title-container");
  toolbarHeaders.forEach((header) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.width = "20px";
    svg.style.height = "20px";
    svg.style.border = "0";
    svg.style.position = "absolute";
    svg.style.left = "10px";
    svg.style.top = "10px";
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrow.setAttribute("fill", "black");
    svg.appendChild(arrow);
    header.appendChild(svg);
    header.down = false;
    header.arrow = arrow;
    header.onclick = () => {
      header.down = !header.down;
    }
    if (header.dataset.drawMode) {
      const button = document.createElement("input");
      button.type = "radio";
      button.style.width = "30px";
      button.style.height = "30px";
      button.style.position = "absolute";
      button.style.left = "200px";
      button.style.top = "0px";
      button.buttonMode = header.dataset.drawMode;
      header.appendChild(button);
      if (typeof drawModeButtons === "undefined") {
        drawModeButtons = [];
      }
      button.onclick = () => {
        drawMode = button.buttonMode;
        header.down = !header.down;
      }
      drawModeButtons.push(button);
    }
  });
  physicsWorld = new PhysicsWorld();
  physicsExceptionOccurred = false;
  displaySvg.addEventListener("mouseup", onDisplayClicked);
  deltaTime = Number(deltaTimeInput.value);
  physicsWorld.gravity.y = Number(gravityInput.value);
  correctionVelocityGain = Number(cvgInput.value);
  correctionTimeMin = Number(ctmInput.value) / 1000.0;
  document.addEventListener("mousemove", (event) => {
    const displayRect = displaySvg.getBoundingClientRect();
    mouseX = event.clientX - displayRect.left;
    mouseY = event.clientY - displayRect.top;
    if (wallStart) {
      if (wallTypeSelect.value == "line") {
        wallDraft = Geometry.createSegment(wallStart, new Vector2(mouseX, mouseY));
      }
      else {
        const topLeft = new Vector2(Math.min(wallStart.x, mouseX), Math.min(wallStart.y, mouseY));
        const bottomRight = new Vector2(Math.max(wallStart.x, mouseX), Math.max(wallStart.y, mouseY));
        if (wallTypeSelect.value == "rect") {
          wallDraft = Geometry.createRect(topLeft, bottomRight);
        }
        if (wallTypeSelect.value == "oval") {
          wallDraft = Geometry.createEllipse(topLeft, bottomRight);
        }
      }
      if (wallElement) {
        wallElement.remove();
      }
      wallElement = createSvgPolygon(wallDraft.points, null, true);
    }
  });
  applyButton.addEventListener("click", (event) => {
    deltaTime = Number(deltaTimeInput.value);
    physicsWorld.gravity.y = Number(gravityInput.value);
    correctionVelocityGain = Number(cvgInput.value);
    correctionTimeMin = Number(ctmInput.value) / 1000.0;
    lastUpdate = performance.now();
  });
  editButton.addEventListener("click", (event) => {
    showShapeEdit();
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
    wallStart = null;
    wallDraft = null;
    wallElement = null;
    for (const collider of wallBody.colliders) {
      if (collider.element) {
        collider.element.remove();
        collider.destroy();
      }
    }
  });
  displaySvg.addEventListener("mousedown", (event) => {
    if (drawMode == "4" && deleteBySweepInput.checked) {
      sweeping = true;
    }
    if (drawMode == "1") {
      wallStart = new Vector2(mouseX, mouseY);
    }
  });
  displaySvg.addEventListener("mouseup", (event) => {
    sweeping = false;
  });
  displaySvg.addEventListener("mouseleave", (event) => {
    sweeping = false;
    if (wallStart) {
      onDisplayClicked(event);
    }
  });
  wallBody = physicsWorld.createBody(PhysicsBodyType.STATIC);
  displayWidth = 0;
  displayHeight = 0;
  lastUpdate = performance.now();
  paused = false;
  springOriginBody = null;
  springOriginOffset = null;
  springOriginAngle = null;
  springMouse = createSvgLine();
  sweeping = false;
  drawCircle = false;
  shapeList = [
    Geometry.createSquare(-100, 0, 100), 
    new Circle(new Vector2(100, 0), 100)
  ];
  draftPoints = [];
  form = null;
  drawMode = "2";
  spawnRestitution = 0.2;
  spawnStaticFriction = 0.6;
  spawnDynamicFriction = 0.4;
  spawnDensity = 1.0;
  wallStart = null;
  wallDraft = null;
  wallElement = null;
  update();
  animate();
}

function createWalls() {
  if (typeof groundBody != "undefined") {
    groundBody.destroy();
  }
  displayWidth = displaySvg.clientWidth;
  displayHeight = displaySvg.clientHeight;
  const corner1 = new Vector2(0, 0);
  const corner2 = new Vector2(displayWidth, 0);
  const corner3 = new Vector2(displayWidth, displayHeight);
  const corner4 = new Vector2(0, displayHeight);
  groundBody = physicsWorld.createBody(PhysicsBodyType.STATIC);
  groundBody.createCollider(Geometry.createSegment(corner1, corner2), 1);
  groundBody.createCollider(Geometry.createSegment(corner2, corner3), 1);
  groundBody.createCollider(Geometry.createSegment(corner3, corner4), 1);
  groundBody.createCollider(Geometry.createSegment(corner4, corner1), 1);
  for (const collider of groundBody.colliders) {
    collider.staticFriction = 1;
    collider.dynamicFriction = 1;
  }
}

function update() {
  if (displayWidth != displaySvg.clientWidth || displayHeight != displaySvg.clientHeight) {
    createWalls();
  }
  toolbarHeaders.forEach((header) => {
    const count = header.dataset.groupSize;
    let elem = header;
    if (header.down) {
      header.arrow.setAttribute("d", "M3,10 L10,0 L17,10 Z");
      for (let i = 0; i < count; i++) {
        elem = elem.nextElementSibling;
        elem.style.display = "grid";
        elem.style.height = "";
      }
    }
    else {
      header.arrow.setAttribute("d", "M3,0 L10,10 L17,0 Z");
      for (let i = 0; i < count; i++) {
        elem = elem.nextElementSibling;
        elem.style.display = "none";
        elem.style.height = "0px";
      }
    }
  });
  if (typeof drawModeButtons != "undefined") {
    for (const button of drawModeButtons) {
      button.checked = button.buttonMode == drawMode;
    }
  }
  if (sweeping) {
    deleteObjects();
  }
  if (form) {
    if (drawCircle) {
      if (draftPoints.length >= 2) {
        shapeList.push(new Circle(draftPoints[0], Vector2.distance(draftPoints[0], draftPoints[1])));
        draftPoints.length = 0;
      }
    }
    else {
      if (draftPoints.length >= 4 && Vector2.distance(draftPoints[0], draftPoints[draftPoints.length - 1]) < hitRadius) {
        draftPoints.pop();
        shapeList.push(new Polygon(draftPoints));
        draftPoints.length = 0;
      }
    }
  }
  for (const body of physicsWorld.bodies) {
    body.updateWorldTransform();
    let oob = 0;
    for (const collider of body.colliders) {
      if (Geometry.collideShapes(collider.worldShape, Geometry.createRect(0, 0, displayWidth, displayHeight))) {
        oob = false;
      }
    }
    if (oob) {
      for (const spring of body.springs) {
        spring.element.remove();
      }
      body.element.remove();
      body.destroy();
    }
  }
  if (paused) {
    lastUpdate = performance.now();
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
    collisionCountOutput.value = physicsWorld.counters.collisionsDetected;
    rectTestCountOutput.value = physicsWorld.counters.boundingRectsTested;
    shapeTestCountOutput.value = physicsWorld.counters.shapesTested;
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
  if (form) {
    const c = formContext;
    c.lineWidth = 3;
    c.lineJoin = "round";
    c.clearRect(0, 0, 500, 500);
    c.beginPath();
    c.arc(editSize / 2, editSize / 2, 7, 0, 2 * Math.PI);
    c.fillStyle = "black";
    c.fill();
    if (shapeList.length > 0) {
      const centroid = getCentroid(shapeList);
      c.beginPath();
      c.arc(editSize / 2 + centroid.x, editSize / 2 + centroid.y, 7, 0, 2 * Math.PI);
      c.fillStyle = "orange";
      c.fill();
    }
    for (const shape of shapeList) {
      if (shape.type == ShapeType.CIRCLE) {
        c.beginPath();
        c.arc(editSize / 2 + shape.center.x, editSize / 2 + shape.center.y, shape.radius, 0, 2 * Math.PI);
        c.strokeStyle = "purple";
        c.stroke();
      }
      else if (shape.type == ShapeType.POLYGON) {
        const points = shape.points;
        c.beginPath();
        c.moveTo(editSize / 2 + points[points.length-1].x, editSize / 2 + points[points.length - 1].y);
        for (let i = 0; i < points.length; i++) {
            c.lineTo(editSize / 2 + points[i].x, editSize / 2 + points[i].y);
        }
        c.strokeStyle = "purple";
        c.stroke();
      }
    }
    if (draftPoints.length >= 1) {
      c.beginPath();
      c.arc(editSize / 2 + draftPoints[0].x, editSize / 2 + draftPoints[0].y, 2, 0, 2 * Math.PI);
      c.fillStyle = "red";
      c.fill();
      c.beginPath();
      c.moveTo(editSize / 2 + draftPoints[0].x, editSize / 2 + draftPoints[0].y);
      for (let i = 1; i < draftPoints.length; i++) {
        c.lineTo(editSize / 2 + draftPoints[i].x, editSize / 2 + draftPoints[i].y);
      }
      c.strokeStyle = "red";
      c.stroke();
    }
    if (drawCircle) {
      polygonButton.style.background = "white";
      circleButton.style.background = "lightgreen";
    }
    else {
      polygonButton.style.background = "lightgreen";
      circleButton.style.background = "white";
    }
  }
  requestAnimationFrame(animate);
}

function createSvgLine() {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("stroke", "blue");
  line.setAttribute("stroke-width", 2);
  displaySvg.appendChild(line);
  return line;
}

function createSvgCircle(shape, g) {
  const group = g || document.createElementNS("http://www.w3.org/2000/svg", "g");
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", shape.center.x);
  circle.setAttribute("cy", shape.center.y);
  circle.setAttribute("r", shape.radius);
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", "black");
  circle.setAttribute("stroke-width", 2);
  group.appendChild(circle);
  displaySvg.appendChild(group);
  return group;
}

function createSvgPolygon(points, g, fill) {
  const group = g || document.createElementNS("http://www.w3.org/2000/svg", "g");
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  const pointsString = points.map((point) => `${point.x},${point.y}`).join(" ");
  polygon.setAttribute("points", pointsString);
  polygon.setAttribute("fill", fill ? "black" : "none");
  polygon.setAttribute("stroke", "black");
  polygon.setAttribute("stroke-width", 2);
  group.appendChild(polygon);
  displaySvg.appendChild(group);
  return group;
}

function setSvgPosition(element, x, y, angle) {
  element.setAttribute("transform", `translate(${x}, ${y}) rotate(${angle * (180 / Math.PI)})`);
}

function onDisplayClicked(event) {
  if (form) {
    return;
  }
  switch (Number(drawMode)) {
    case 1:
      if (wallStart && wallDraft) {
        const collider = wallBody.createCollider(wallDraft, 1);
        collider.element = wallElement;
        collider.restitution = Number(wallRestitutionInput.value);
        collider.staticFriction = Number(wallFrictionInput.value);
        collider.dynamicFriction = Number(wallFrictionInput.value);
      }
      wallStart = null;
      wallDraft = null;
      wallElement = null;
      break;
    case 2:
      const shapeSize = Number(shapeSizeInput.value);
      const shapeGap = Number(shapeGapInput.value);
      const shapesInARow = Number(spawnColumnsInput.value);
      const shapesToSpawn = shapesInARow * Number(spawnRowsInput.value);
      for (let i = 0; i < shapesToSpawn; i++) {
        const body = physicsWorld.createBody(PhysicsBodyType.DYNAMIC);
        const x = mouseX + Math.floor(i % shapesInARow) * (shapeSize + shapeGap);
        const y = mouseY + Math.floor(i / shapesInARow) * (shapeSize + shapeGap);
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        for (let shape of shapeList) {
          shape = shape.clone();
          if (shape.type == ShapeType.CIRCLE) {
            shape.radius *= shapeSize / editSize;
            shape.center.multiply(shapeSize / editSize);
            createSvgCircle(shape, group);
          }
          if (shape.type == ShapeType.POLYGON) {
            shape.radius *= shapeSize / editSize;
            shape.points.forEach((point) => {
              point.multiply(shapeSize / editSize)
            });
            createSvgPolygon(shape.points, group);
          }
          const collider = body.createCollider(shape, spawnDensity);
          collider.restitution = spawnRestitution;
          collider.staticFriction = spawnStaticFriction;
          collider.dynamicFriction = spawnDynamicFriction;
        }
        body.position.x = x;
        body.position.y = y;
        body.element = group;
        for (const childre of group.children) {
          childre.setAttribute("stroke", "red");
        }
      }
      break;
    case 3:
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
        const spring = physicsWorld.createSpring(springOriginBody, springOrigin, clickedBody, point);
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
          clickedBody = wallBody;
        }
        springOriginBody = clickedBody;
        springOriginOffset = Vector2.subtract(point, clickedBody.position);
        springOriginAngle = clickedBody.angle;
      }
      break;
    case 4:
      deleteObjects();
      break;
  }
}

function deleteObjects() {
  if (form) {
    return;
  }
  const point = new Vector2(mouseX, mouseY);
  let clickedCollider = null;
  let clickedBody = null;
  for (const collider of physicsWorld.colliders) {
    if (collider.worldShape.testPoint(point, hitRadius) && (collider.body != wallBody || clickedCollider == null)) {
      clickedCollider = collider;
      clickedBody = collider.body;
    }
  }
  if (clickedBody == wallBody) {
    if (deleteWallsInput.checked && clickedCollider.element) {
      clickedCollider.element.remove();
      clickedCollider.destroy();
    }
    clickedBody = null;
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
      if (distanceFromSegment(point, string.worldAnchor1, string.worldAnchor2) < hitRadius) {
        clickedString = string;
      }
    }
    if (clickedString != null) {
      clickedString.element.remove();
      clickedString.destroy();
    }
  }
}

function showShapeEdit() {
  const centered = document.createElement("div");
  document.body.appendChild(centered);
  centered.style.background = "none";
  centered.style.position = "absolute";
  centered.style.width = "100%";
  centered.style.height = "100%";
  centered.style.display = "flex";
  centered.style.justifyContent = "center";
  centered.style.alignItems = "center";
  centered.style.flexDirection = "row";
  const formGrid = document.createElement("div");
  formGrid.style.display = "grid";
  formGrid.style.gridTemplateColumns = "500px 500px";
  formGrid.style.width = "1000px";
  formGrid.style.height = "100%";
  formGrid.style.alignItems = "center";
  centered.appendChild(formGrid);
  function resizeForm() {
    const maxWidth = window.innerWidth;
    const baseWidth = 1000;
    const maxHeight = window.innerHeight;
    const baseHeight = 500;
    const scale = Math.min(1, Math.min(maxHeight / baseHeight, maxWidth / baseWidth) * 0.9);
    formGrid.style.transform = `scale(${scale})`;
    formGrid.style.transformOrigin = "middle center";
    formGrid.style.width = `${baseWidth}px`;
    formGrid.style.height = `${baseHeight}px`;
  }
  resizeForm();
  window.addEventListener("resize", resizeForm);
  form = document.createElement("div");
  form.style.background = "white";
  form.style.border = "1px solid black";
  form.style.position = "absolute";
  form.style.width = "500px";
  form.style.height = "500px";
  form.style.display = "flex";
  form.style.flexDirection = "column";
  const options = document.createElement("div");
  options.style.background = "white";
  options.style.border = "1px solid black";
  options.style.position = "absolute";
  options.style.width = "500px";
  options.style.height = "500px";
  options.style.left = "50%";
  options.style.display = "flex";
  options.style.flexDirection = "column";
  formCanvas = document.createElement("canvas");
  formContext = formCanvas.getContext("2d");
  formCanvas.style.backgroundColor = "white";
  formCanvas.width = editSize;
  formCanvas.height = editSize;
  formCanvas.style.width = "500px";
  formCanvas.style.height = "498px";
  function addButton(left, top, bottom, text) {
    const button = document.createElement("button");
    button.style.border = "1px solid black";
    button.style.position = "absolute";
    button.style.left = left;
    if (!button.style.top) {
      button.style.top = top;
    }
    if (!button.style.bottom) {
      button.style.bottom = bottom;
    }
    button.style.width = "240px";
    button.style.height = "50px";
    button.style.fontSize = "30px";
    button.style.fontFamily = "Arial";
    button.style.margin = "5px";
    button.innerHTML = text;
    options.appendChild(button);
    return button;
  }
  function addInput(bottom, value) {
    const button = document.createElement("input");
    button.type = "number";
    button.value = value;
    button.step = 0.1;
    button.style.border = "1px solid black";
    button.style.position = "absolute";
    button.style.left = "50%";
    button.style.top = bottom;
    button.style.width = "240px";
    button.style.height = "50px";
    button.style.fontSize = "22px";
    button.style.fontFamily = "Verdana";
    button.style.margin = "5px";
    button.style.background = "white";
    options.appendChild(button);
    return button;
  }
  function addLine(top, bottom) {
    const underline = document.createElement("div");
    underline.style.position = "absolute";
    if (!underline.style.top) {
      underline.style.top = top;
    }
    if (!underline.style.bottom) {
      underline.style.bottom = bottom;
    }
    underline.style.width = "100%";
    underline.style.height = "1px";
    underline.style.background = "black";
    options.appendChild(underline);
  }
  function addLabel(bottom, text) {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = bottom;
    container.style.width = "250px";
    container.style.height = "60px";
    container.style.display = "flex";
    container.style.background = "white";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    const label = document.createElement("label");
    label.style.fontSize = "26px";
    label.style.fontFamily = "Verdana";
    label.style.background = "white";
    label.innerHTML = text;
    container.appendChild(label);
    options.appendChild(container);
  }
  const button = addButton("50%", null, "0px", "Done");
  const cancel = addButton("0%", null, "0px", "Cancel");
  const undo = addButton("50%", null, "55px", "Undo");
  const clear = addButton("0%", null, "55px", "Clear");
  const alignCentroid = addButton("25%", null, "116px", "Align Centroid");
  polygonButton = addButton("0%", "0px", null, "Polygon");
  circleButton = addButton("50%", "0px", null, "Circle");
  addLine("60px", null);
  addLabel("61px", "Restitution");
  restitutionInput = addInput("61px", spawnRestitution);
  addLabel("116px", "Static Friction");
  staticFrictionInput = addInput("116px", spawnStaticFriction);
  addLabel("171px", "Dynamic Friction");
  dynamicFrictionInput = addInput("171px", spawnDynamicFriction);
  addLabel("228px", "Density");
  addLine(null, "115px");
  densityInput = addInput("228px", spawnDensity);
  draftPoints.length = 0;
  polygonButton.onclick = () => {
    drawCircle = 0;
    draftPoints.length = 0;
  }
  circleButton.onclick = () => {
    drawCircle = 1;
    draftPoints.length = 0;
  }
  const onClose = () => {
    document.body.removeChild(centered);
    paused = false;
    form = null;
    document.getElementById("toolbar").querySelectorAll("button, input").forEach((element) => {
      element.disabled = false;
    });
  };
  button.onclick = () => {
    spawnRestitution = Number(restitutionInput.value);
    spawnStaticFriction = Number(staticFrictionInput.value);
    spawnDynamicFriction = Number(dynamicFrictionInput.value);
    spawnDensity = Number(densityInput.value);
    onClose();
  }
  cancel.onclick = () => {
    shapeList = previousShapeList;
    onClose();
  } 
  clear.onclick = () => {
    shapeList.length = 0;
    previousShapeCount = 0;
    draftPoints.length = 0;
  }
  undo.onclick = () => {
    if (draftPoints.length == 0) {
      shapeList.length > previousShapeCount && shapeList.length--;
    }
    else {
      draftPoints.length > 0 && draftPoints.length--;
    }
  }
  alignCentroid.onclick = () => {
    const centroid = getCentroid(shapeList);
    for (const shape of shapeList) {
      switch (shape.type) {
        case ShapeType.CIRCLE:
          shape.center.subtract(centroid);
          break;
        case ShapeType.POLYGON:
          for (const point of shape.points) {
            point.subtract(centroid);
          }
          break;
      }
    }
  };
  formCanvas.addEventListener("mouseup", (event) => {
    draftPoints.push(new Vector2(event.offsetX - editSize / 2, event.offsetY - editSize / 2));
  });
  form.appendChild(formCanvas);
  formGrid.appendChild(form);
  formGrid.appendChild(options);
  paused = true;
  previousShapeList = Util.cloneArray(shapeList);
  previousShapeCount = previousShapeList.length;
  document.getElementById("toolbar").querySelectorAll("button, input").forEach((element) => {
    element.disabled = true;
  });
}

function getCentroid(shapes) {
  const world = new PhysicsWorld();
  const body = world.createBody(PhysicsBodyType.DYNAMIC);
  for (const shape of shapes) {
    body.createCollider(shape, 1);
  }
  return body.centerOfMass;
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
