const test = require("node:test");
const assert = require("node:assert/strict");
const { momentum, kineticEnergy, impulse, collision, contactModel, contactAtTime } = require("./physics.js");

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
}

for (const restitution of [0, 0.5, 1]) {
  test(`rörelsemängden bevaras med studstalet ${restitution}`, () => {
    const result = collision(2, 2, 1, -1, restitution);
    close(momentum(2, result.velocityA) + momentum(1, result.velocityB), momentum(2, 2) + momentum(1, -1));
    close(impulse(2, 2, result.velocityA), -impulse(1, -1, result.velocityB));
    close(result.velocityB - result.velocityA, restitution * (2 - (-1)));
    const before = kineticEnergy(2, 2) + kineticEnergy(1, -1);
    const after = kineticEnergy(2, result.velocityA) + kineticEnergy(1, result.velocityB);
    if (restitution === 1) close(after, before);
    else assert.ok(after < before);
    if (restitution === 0) close(result.velocityA, result.velocityB);
  });
}

for (const restitution of [0, 0.5, 1]) {
  test(`kontakten bevarar rörelsemängd genom stöten med studstalet ${restitution}`, () => {
    const model = contactModel(2, 2, 1, -1, restitution);
    assert.ok(model.duration > 0 && model.duration <= 0.6);
    for (const fraction of [0, 0.25, 0.5, 1]) {
      const time = fraction * model.duration;
      const current = contactAtTime(model, time);
      close(momentum(2, current.velocityA) + momentum(1, current.velocityB), 3);
      close(impulse(2, 2, current.velocityA), -impulse(1, -1, current.velocityB));
      close(current.forceA, -current.forceB);
    }
    const end = contactAtTime(model, model.duration);
    close(end.velocityA, model.final.velocityA);
    close(end.velocityB, model.final.velocityB);
    const steps = 10000;
    let areaA = 0;
    let areaB = 0;
    for (let i = 0; i < steps; i++) {
      const force = contactAtTime(model, (i + 0.5) * model.duration / steps);
      areaA += force.forceA * model.duration / steps;
      areaB += force.forceB * model.duration / steps;
    }
    assert.ok(Math.abs(areaA - impulse(2, 2, end.velocityA)) < 1e-7);
    assert.ok(Math.abs(areaB - impulse(1, -1, end.velocityB)) < 1e-7);
    if (restitution === 0) close(model.final.velocityA, model.final.velocityB);
  });
}

test("kraften börjar och slutar på noll och är störst i mitten", () => {
  const model = contactModel(2, 2, 1, -1, 1);
  const start = contactAtTime(model, 0);
  const first = contactAtTime(model, model.duration / 4);
  const middle = contactAtTime(model, model.duration / 2);
  const last = contactAtTime(model, 3 * model.duration / 4);
  const end = contactAtTime(model, model.duration);
  close(start.forceA, 0);
  close(end.forceA, 0);
  close(first.forceA, last.forceA);
  assert.ok(Math.abs(middle.forceA) > Math.abs(first.forceA));
  const dt = model.duration * 1e-5;
  const before = contactAtTime(model, model.duration / 2 - dt);
  const after = contactAtTime(model, model.duration / 2 + dt);
  assert.ok(Math.abs((after.displacementA - before.displacementA) / (2 * dt) - middle.velocityA) < 1e-8);
  assert.ok(Math.abs(2 * (after.velocityA - before.velocityA) / (2 * dt) - middle.forceA) < 1e-7);
});

test("stöttiden begränsar deformation vid hög relativ hastighet", () => {
  const model = contactModel(1, 5, 1, -5, 0);
  close(model.duration, 0.032);
  close(10 * model.duration / 2, 0.16);
  close(contactModel(1, 0.1, 1, 0, 1).duration, 0.6);
});

test("impuls är förändringen i rörelsemängd med riktning", () => {
  close(impulse(2, 2, 0), -4);
  close(impulse(1, -1, 3), 4);
  close(impulse(2, 2, 2), 0);
});

test("lika stora vagnar byter hastighet vid elastisk stöt", () => {
  const result = collision(1, 3, 1, -2, 1);
  close(result.velocityA, -2);
  close(result.velocityB, 3);
});
