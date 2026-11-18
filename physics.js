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

  // En sinusformad kraftpuls och dess integraler ger kraft, hastighet och läge.
  function contactAtTime(model, time) {
    const t = Math.max(0, Math.min(time, model.duration));
    const angle = Math.PI * t / model.duration;
    const fraction = (1 - Math.cos(angle)) / 2;
    const integratedFraction = (t - model.duration * Math.sin(angle) / Math.PI) / 2;
    const forceA = t === 0 || t === model.duration ? 0 : model.impulseA * Math.PI / (2 * model.duration) * Math.sin(angle);
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
