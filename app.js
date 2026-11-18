(function () {
  "use strict";

  const physics = window.CollisionPhysics;
  const content = window.LessonContent;
  const text = content.text;
  const messages = content.messages;
  const $ = id => document.getElementById(id);
  const inputs = ["mass-a", "mass-b", "velocity-a", "velocity-b"].map($);
  const typeInputs = [...document.querySelectorAll('input[name="collision"]')];
  const restitutionInput = $("restitution");
  const cartWidth = 0.8;
  const trackLength = 12;
  const contactAnimationSeconds = 1.5;
  let state;
  let animationId = null;
  let lastTime = null;

  function number(value) {
    return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(
      Math.abs(value) < 0.005 ? 0 : value
    );
  }

  function settings() {
    const [massA, massB, velocityA, velocityB] = inputs.map(input => input.valueAsNumber);
    if (inputs.some(input => !input.validity.valid || !Number.isFinite(input.valueAsNumber))) {
      throw new Error(messages.invalidInput);
    }
    const type = typeInputs.find(input => input.checked).value;
    return {
      massA, massB, velocityA, velocityB,
      restitution: type === "elastic" ? 1 : type === "perfectlyInelastic" ? 0 : Number(restitutionInput.value)
    };
  }

  function updateText() {
    const type = typeInputs.find(input => input.checked).value;
    $("type-description").textContent = content.collisionTypes[type];
    $("restitution-setting").hidden = type !== "inelastic";
    $("restitution-value").value = number(Number(restitutionInput.value));
  }

  function render() {
    const distance = Math.min(cartWidth, Math.max(0, state.xB - state.xA));
    const width = (cartWidth + distance) / 2;
    const shift = (cartWidth - width) / 2;
    $("cart-a").style.width = $("cart-b").style.width = `${width / trackLength * 100}%`;
    $("cart-a").style.left = `${(state.xA - shift) / trackLength * 100}%`;
    $("cart-b").style.left = `${(state.xB + shift) / trackLength * 100}%`;
  }

  function showBefore(config) {
    $("before-v-a").textContent = `${number(config.velocityA)} ${text.velocityUnit}`;
    $("before-v-b").textContent = `${number(config.velocityB)} ${text.velocityUnit}`;
    $("before-p").textContent = number(physics.momentum(config.massA, config.velocityA) + physics.momentum(config.massB, config.velocityB));
    $("before-energy").textContent = `${number(physics.kineticEnergy(config.massA, config.velocityA) + physics.kineticEnergy(config.massB, config.velocityB))} ${text.energyUnit}`;
  }

  function showForce() {
    const contact = state.contact;
    const current = contact ? physics.contactAtTime(contact, state.contactTime) : null;
    const maximum = contact ? Math.abs(physics.contactAtTime(contact, contact.duration / 2).forceA) : 0;
    const progress = contact ? state.contactTime / contact.duration : 0;
    for (const [name, property] of [["a", "forceA"], ["b", "forceB"]]) {
      const line = $(`graph-line-${name}`);
      let path = "";
      if (contact) {
        const points = Math.floor(progress * 100);
        path = "M 70 100";
        for (let i = 1; i <= points; i++) {
          const fraction = i / 100;
          const force = physics.contactAtTime(contact, fraction * contact.duration)[property];
          path += ` L ${70 + 500 * fraction} ${100 - 75 * force / maximum}`;
        }
        path += ` L ${70 + 500 * progress} ${100 - 75 * current[property] / maximum}`;
      }
      line.setAttribute("d", path);
      $(`force-${name}`).textContent = `${number(current && state.phase === "contact" ? current[property] : 0)} ${text.forceUnit}`;
    }
    $("graph-max").textContent = contact ? number(maximum) : text.placeholder;
    $("graph-min").textContent = contact ? number(-maximum) : text.placeholder;
    $("graph-duration").textContent = contact
      ? new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 3 }).format(contact.duration)
      : text.placeholder;
  }

  function showAfter(config) {
    $("after-v-a").textContent = `${number(state.velocityA)} ${text.velocityUnit}`;
    $("after-v-b").textContent = `${number(state.velocityB)} ${text.velocityUnit}`;
    $("after-p").textContent = number(physics.momentum(config.massA, state.velocityA) + physics.momentum(config.massB, state.velocityB));
    $("after-energy").textContent = `${number(physics.kineticEnergy(config.massA, state.velocityA) + physics.kineticEnergy(config.massB, state.velocityB))} ${text.energyUnit}`;
  }

  function reset() {
    if (animationId !== null) cancelAnimationFrame(animationId);
    animationId = null;
    lastTime = null;
    state = { xA: 3, xB: 9, velocityA: 0, velocityB: 0, phase: "before", contact: null, contactTime: 0 };
    $("start").disabled = false;
    $("status").textContent = messages.ready;
    $("scene-note").textContent = messages.readyNote;
    showForce();
    $("error").hidden = true;
    ["before-v-a", "before-v-b", "before-p", "before-energy", "after-v-a", "after-v-b", "after-p", "after-energy"].forEach(id => $(id).textContent = text.placeholder);
    try {
      showBefore(settings());
    } catch (error) {
      $("error").textContent = error.message;
      $("error").hidden = false;
    }
    render();
  }

  function timeToEdge(position, velocity) {
    if (velocity > 0) return Math.max(0, (trackLength - cartWidth / 2 - position) / velocity);
    if (velocity < 0) return Math.max(0, (cartWidth / 2 - position) / velocity);
    return Infinity;
  }

  function contactEdgeTime(endTime) {
    const startTime = state.contactTime;
    let earliest = Infinity;
    for (const [name, startPosition] of [["A", state.contactStartA], ["B", state.contactStartB]]) {
      const position = time => startPosition + physics.contactAtTime(state.contact, time)[`displacement${name}`];
      const velocity = time => physics.contactAtTime(state.contact, time)[`velocity${name}`];
      const boundaries = [startTime, endTime];
      if (velocity(startTime) * velocity(endTime) < 0) {
        let low = startTime;
        let high = endTime;
        const initialSign = Math.sign(velocity(startTime));
        for (let i = 0; i < 40; i++) {
          const middle = (low + high) / 2;
          if (Math.sign(velocity(middle)) === initialSign) low = middle;
          else high = middle;
        }
        boundaries.splice(1, 0, (low + high) / 2);
      }
      for (let i = 0; i < boundaries.length - 1; i++) {
        const start = boundaries[i];
        const end = boundaries[i + 1];
        const endPosition = position(end);
        let direction;
        let edge;
        if (endPosition <= cartWidth / 2) {
          edge = cartWidth / 2;
          direction = -1;
        } else if (endPosition >= trackLength - cartWidth / 2) {
          edge = trackLength - cartWidth / 2;
          direction = 1;
        } else {
          continue;
        }
        let low = start;
        let high = end;
        for (let j = 0; j < 40; j++) {
          const middle = (low + high) / 2;
          if ((position(middle) - edge) * direction >= 0) high = middle;
          else low = middle;
        }
        earliest = Math.min(earliest, high - startTime);
        break;
      }
    }
    return earliest;
  }

  function advance(wallTime, config) {
    while (wallTime > 0) {
      const contact = state.phase === "contact" ? state.contact : null;
      const speed = contact ? contact.duration / contactAnimationSeconds : 1;
      const relativeSpeed = state.velocityA - state.velocityB;
      const timeToCollision = state.phase === "before" && relativeSpeed > 0
        ? Math.max(0, (state.xB - state.xA - cartWidth) / relativeSpeed)
        : Infinity;
      const timeToEnd = contact ? contact.duration - state.contactTime : Infinity;
      const edge = contact
        ? contactEdgeTime(Math.min(contact.duration, state.contactTime + wallTime * speed))
        : Math.min(timeToEdge(state.xA, state.velocityA), timeToEdge(state.xB, state.velocityB));
      const elapsed = Math.min(wallTime * speed, timeToCollision, timeToEnd, edge);
      wallTime -= elapsed / speed;

      if (contact) {
        state.contactTime = Math.min(contact.duration, state.contactTime + elapsed);
        const current = physics.contactAtTime(contact, state.contactTime);
        state.xA = state.contactStartA + current.displacementA;
        state.xB = state.contactStartB + current.displacementB;
        state.velocityA = current.velocityA;
        state.velocityB = current.velocityB;
        showForce();
      } else {
        state.xA += state.velocityA * elapsed;
        state.xB += state.velocityB * elapsed;
      }
      if (timeToEnd <= elapsed) {
        state.velocityA = contact.final.velocityA;
        state.velocityB = contact.final.velocityB;
        state.contactTime = contact.duration;
        state.phase = "after";
        showForce();
        showAfter(config);
        $("status").textContent = messages.collisionComplete;
        $("scene-note").textContent = messages.collisionCompleteNote;
      }
      if (edge <= elapsed) return true;
      if (timeToCollision <= elapsed) {
        state.contact = physics.contactModel(config.massA, state.velocityA, config.massB, state.velocityB, config.restitution);
        state.contactStartA = state.xA;
        state.contactStartB = state.xB;
        state.phase = "contact";
        showForce();
        $("status").textContent = messages.contact;
        $("scene-note").textContent = messages.contactNote;
      }
    }
    return false;
  }

  function start() {
    let config;
    try {
      config = settings();
    } catch (error) {
      $("error").textContent = error.message;
      $("error").hidden = false;
      return;
    }
    reset();
    state.velocityA = config.velocityA;
    state.velocityB = config.velocityB;
    if (state.velocityA <= state.velocityB) {
      $("status").textContent = messages.noCollision;
      $("scene-note").textContent = messages.noCollisionNote;
      return;
    }
    $("start").disabled = true;
    $("status").textContent = messages.running;
    $("scene-note").textContent = messages.runningNote;
    function frame(time) {
      if (lastTime !== null) {
        const stopped = advance((time - lastTime) / 1000, config);
        render();
        if (stopped) {
          animationId = null;
          $("start").disabled = false;
          $("status").textContent = messages.finished;
          $("scene-note").textContent = state.phase === "after"
            ? messages.edgeAfter
            : state.phase === "contact"
              ? messages.edgeDuring
              : messages.edgeBefore;
          return;
        }
      }
      lastTime = time;
      animationId = requestAnimationFrame(frame);
    }
    animationId = requestAnimationFrame(frame);
  }

  for (const [attribute, target] of [["data-text", null], ["data-aria-label", "aria-label"], ["data-content", "content"]]) {
    for (const element of document.querySelectorAll(`[${attribute}]`)) {
      const key = element.getAttribute(attribute);
      if (typeof text[key] !== "string") throw new Error(`Missing page text: ${key}`);
      if (target) element.setAttribute(target, text[key]);
      else element.textContent = text[key];
    }
  }
  for (const element of document.querySelectorAll("[data-math]")) {
    const key = element.getAttribute("data-math");
    const expression = text[key];
    if (typeof expression !== "string") throw new Error(`Missing formula: ${key}`);
    const math = document.createElementNS("http://www.w3.org/1998/Math/MathML", "math");
    const symbols = [...expression];
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      if (/\s/u.test(symbol)) continue;
      const tag = /\p{L}/u.test(symbol) ? "mi" : /\p{N}/u.test(symbol) ? "mn" : "mo";
      const token = document.createElementNS(math.namespaceURI, tag);
      if (symbol === "d" && symbols[i + 1] === "t") {
        const space = document.createElementNS(math.namespaceURI, "mspace");
        space.setAttribute("width", "0.1667em");
        math.appendChild(space);
        token.setAttribute("mathvariant", "normal");
      } else if (symbol === "Δ") {
        token.setAttribute("mathvariant", "normal");
      }
      token.textContent = symbol;
      math.appendChild(token);
    }
    element.appendChild(math);
  }
  for (const paragraph of content.learningParagraphs) {
    const element = document.createElement("p");
    element.textContent = paragraph;
    $("learning-text").appendChild(element);
  }
  [...inputs, ...typeInputs, restitutionInput].forEach(input => input.addEventListener("input", () => {
    updateText();
    reset();
  }));
  $("start").addEventListener("click", start);
  $("reset").addEventListener("click", reset);
  updateText();
  reset();
})();
