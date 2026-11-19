// Fysiken finns här, helt separat från sidans utseende och knappar.
(function (root) {
  "use strict";

  function momentum(mass, velocity) {
    return mass * velocity;
  }

  function kineticEnergy(mass, velocity) {
    return 0.5 * mass * velocity * velocity;
  }

  function impulse(mass, velocityBefore, velocityAfter) {
    return momentum(mass, velocityAfter) - momentum(mass, velocityBefore);
  }

  // Studstalet är 1 vid elastisk stöt och 0 när vagnarna fastnar.
  function collision(massA, velocityA, massB, velocityB, restitution) {
    const impulse = (1 + restitution) * (velocityA - velocityB) / (1 / massA + 1 / massB);
    return {
      velocityA: velocityA - impulse / massA,
      velocityB: velocityB + impulse / massB
    };
  }

  // Begränsa deformationen i den förenklade modellen till högst 0,16 m.
  function collisionDuration(velocityA, velocityB) {
    return Math.min(0.6, 0.32 / (velocityA - velocityB));
  }

  function contactModel(massA, velocityA, massB, velocityB, restitution) {
    const duration = collisionDuration(velocityA, velocityB);
    const final = collision(massA, velocityA, massB, velocityB, restitution);
    return {
      duration, massA, massB, velocityA, velocityB, final,
      impulseA: impulse(massA, velocityA, final.velocityA)
    };
  }

  const pulseShape = 18;
  const pulseRoot = Math.sqrt(pulseShape);
  const pulseEdge = Math.exp(-pulseShape / 4);

  // Integralen av exp(-x²), beräknad med en positiv potensserie.
  function gaussianIntegral(x) {
    let term = x;
    let sum = term;
    for (let n = 1; n <= 50; n++) {
      term *= 2 * x * x / (2 * n + 1);
      sum += term;
      if (Math.abs(term) <= Math.abs(sum) * Number.EPSILON) break;
    }
    return Math.exp(-x * x) * sum;
  }

  const pulseStartIntegral = gaussianIntegral(-pulseRoot / 2);
  const pulseArea = (gaussianIntegral(pulseRoot / 2) - pulseStartIntegral) / pulseRoot - pulseEdge;

  // Klockformad kraftpuls: dra av ändvärdet så att kraften är noll vid kontaktens början och slut.
  function contactAtTime(model, time) {
    const t = Math.max(0, Math.min(time, model.duration));
    const u = t / model.duration;
    const gaussian = Math.exp(-pulseShape * (u - 0.5) ** 2);
    const area = (gaussianIntegral(pulseRoot * (u - 0.5)) - pulseStartIntegral) / pulseRoot;
    const fraction = (area - pulseEdge * u) / pulseArea;
    const firstMoment = area / 2 + (pulseEdge - gaussian) / (2 * pulseShape) - pulseEdge * u * u / 2;
    const integratedFraction = model.duration * (u * fraction - firstMoment / pulseArea);
    const forceA = t === 0 || t === model.duration ? 0 : model.impulseA * (gaussian - pulseEdge) / (model.duration * pulseArea);
    return {
      forceA,
      forceB: -forceA,
      velocityA: model.velocityA + model.impulseA / model.massA * fraction,
      velocityB: model.velocityB - model.impulseA / model.massB * fraction,
      displacementA: model.velocityA * t + model.impulseA / model.massA * integratedFraction,
      displacementB: model.velocityB * t - model.impulseA / model.massB * integratedFraction
    };
  }

  const physics = { momentum, kineticEnergy, impulse, collision, contactModel, contactAtTime };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = physics;
  } else {
    root.CollisionPhysics = physics;
  }
})(globalThis);
