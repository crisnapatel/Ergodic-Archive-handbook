# Nyquist Criterion & Timestep

> **Definition:** Applied to MD timestep selection: to faithfully integrate a vibration of frequency f, the timestep must satisfy Δt < 1/(2f). For C-H bond stretching at ~3300 cm⁻¹ (period ~10 fs), Nyquist requires Δt < 5 fs, but accurate energy conservation in practice demands Δt ≤ 1 fs. Violating the criterion causes the integrator to alias or diverge on the fastest mode.

Your timestep has to be small enough to see the fastest thing happening in your system. If the fastest vibration completes a full cycle in 10 fs and you're stepping at 5 fs, you're catching it at only two points per cycle. That's not integration. That's guessing.

---

## Hook

You set `timestep 2.0` in your LAMMPS script. Simulation runs. Energy looks stable for the first 100 ps. Then it starts drifting. Then it explodes.

You didn't violate MIC. Your box is big enough. Your force field is fine. The problem is that a C-H bond completes one full oscillation in about 10 fs, and you're sampling it every 2 fs. That's five points per cycle — barely enough, and not enough for a symplectic integrator to conserve energy over millions of steps.

---

## Why should you care?

The timestep is the single most common source of silent simulation failure. Too large and you get energy drift that may take hundreds of picoseconds to become obvious. The Nyquist criterion gives you the hard lower bound. In practice you need to be well inside it, not sitting at the edge.

---

## The wrong intuition

"If the simulation doesn't immediately explode, the timestep is fine."

Not true. Energy drift from an oversized timestep can be subtle. A trajectory that drifts 0.1% in total energy per nanosecond looks stable in short runs but is sampling the wrong distribution over long times. The NVE energy conservation test is the right check, not visual inspection of the trajectory.

---

## The explanation

The Nyquist–Shannon sampling theorem says: to reconstruct a signal of frequency f without aliasing, you need at least 2f samples per unit time. In MD, "reconstructing" the vibration means integrating it accurately. Two samples per period is the absolute minimum for aliasing-free sampling. For stable energy conservation in a symplectic integrator, you need roughly 10–20 samples per period of the fastest mode.

**Fastest modes by system type:**

| Bond / Mode | Frequency | Period | Max safe Δt |
|---|---|---|---|
| O-H stretch | ~3600 cm⁻¹ | ~9 fs | 0.5–1 fs |
| C-H stretch | ~3000 cm⁻¹ | ~11 fs | 0.5–1 fs |
| C-C stretch (graphene) | ~1600 cm⁻¹ | ~21 fs | 1–2 fs |
| Metal phonon (EAM Fe) | ~300 cm⁻¹ | ~110 fs | 2–5 fs |

If your system has no hydrogen, 2 fs is almost always fine. If it does, use 1 fs or constrain the H bonds with SHAKE/RATTLE and use 2 fs.

---

## Reality check

```
timestep 1.0      # fs — safe for any system with C-H bonds
timestep 2.0      # fs — fine for metals and carbon-only systems
timestep 0.5      # fs — conservative for systems with O-H bonds
```

To check your timestep is acceptable, run 10–50 ps in NVE and plot total energy. You want flat, with oscillations below 0.01% of the total. Any monotonic drift means your timestep is too large.

SHAKE/RATTLE in LAMMPS constrains bond lengths and removes the high-frequency stretching modes from the dynamics, allowing 2 fs even for hydrogen-containing systems:

```
fix shk all shake 1e-4 20 0 b 1 a 1
```

!!! warning "Common Mistake"
    Using `timestep 2.0` for a hydrocarbon or water system without SHAKE. The C-H or O-H stretching modes are under-sampled, leading to energy drift that appears only after hundreds of picoseconds of production run.

---

## Takeaway

The Nyquist criterion is the floor. In practice, stay at 10× below the fastest period, not 2×. When in doubt, run a short NVE test and look at the energy.
