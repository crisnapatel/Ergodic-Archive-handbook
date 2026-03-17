# Velocity Verlet Integrator

> **Definition:** A symplectic, time-reversible, second-order algorithm for integrating Newton's equations of motion. Updates positions using current velocities and accelerations, then updates velocities using the average of accelerations at the current and next step. The symplectic property ensures phase-space volume conservation and bounded (non-divergent) long-time energy errors.

Newton's equations are continuous. MD is discrete. You are approximating a smooth trajectory with a series of finite jumps. The question is how good that approximation is — not just at the next step, but after a million steps. Velocity Verlet is the answer that keeps working even after you've long forgotten the system started.

---

## Hook

Here's the thing about integration error. Every numerical integrator makes an error at each step. The question is whether those errors accumulate.

For a simple Euler integrator, they do. Energy drifts upward monotonically. Given enough time, your simulation explodes. For Velocity Verlet, the errors don't accumulate in that way. Energy oscillates around the correct value but never diverges. That difference — bounded vs. drifting error — is the whole game.

---

## Why should you care?

Because you're running millions of timesteps. Integration error that's negligible per step can absolutely destroy your long-time trajectory if it accumulates. The choice of integrator is what separates a simulation that's valid over nanoseconds from one that blows up in picoseconds.

Also: in NVE, the conserved quantity is energy. If your integrator is not symplectic, energy drifts. And if energy drifts, your NVE trajectory is not sampling the microcanonical ensemble. The whole statistical mechanics foundation cracks.

---

## The wrong intuition

"Higher-order integrators are better. Runge-Kutta gives smaller per-step error than Verlet."

True in general numerical analysis. Wrong for Hamiltonian mechanics. Runge-Kutta is not symplectic. It dissipates phase-space volume. In an MD simulation, this means energy drifts systematically downward (or upward). The per-step error is smaller but the long-time behavior is worse because errors accumulate monotonically instead of canceling.

Symplecticity is more important than per-step accuracy for long MD trajectories. That's the key insight, and it's not obvious until you've seen what a Runge-Kutta trajectory looks like after 10 ns.

"A smaller timestep is always better."

Smaller timestep means smaller per-step error, yes. But it also means more steps for the same simulated time, which means more floating-point operations and more accumulated roundoff. In practice there's an optimal timestep range where integration error is small but you're not wasting compute. For most systems, that's 1–2 fs.

---

## The explanation

The Velocity Verlet algorithm in two steps.

**Step 1: Update positions.**

Use current positions, velocities, and accelerations to predict where atoms will be at t + Δt. This is a second-order Taylor expansion. You need positions and velocities at time t, and accelerations (from forces) at time t.

**Step 2: Update velocities.**

Compute forces at the new positions to get accelerations at t + Δt. Then update velocities using the *average* of accelerations at t and t + Δt. This average is what makes Velocity Verlet second-order in Δt.

The key word is average. Not just the current acceleration, not just the next acceleration. The average of both. That's what gives Verlet its time-reversibility and symplectic structure.

**Symplectic means this:** the map from (r, p) at time t to (r, p) at time t + Δt preserves phase-space volume. Liouville's theorem says the exact trajectory does too. By preserving this structure, Velocity Verlet stays close to the correct trajectory in a qualitative sense even when the per-step error is not tiny.

**Time-reversible means this:** if you take a Velocity Verlet trajectory and flip all the velocities, you retrace the same path backward. This is a property of Newton's equations, and Velocity Verlet inherits it. Euler does not.

---

## The math

Ready? Let's do this. We're taking baby steps.

**Position update:**

\[
\mathbf{r}(t + \Delta t) = \mathbf{r}(t) + \mathbf{v}(t)\Delta t + \frac{1}{2}\mathbf{a}(t)\Delta t^2
\]

This is just the Taylor expansion of r(t + Δt) truncated at second order. The acceleration a(t) = F(t)/m comes from forces evaluated at the current positions.

**Velocity update:**

\[
\mathbf{v}(t + \Delta t) = \mathbf{v}(t) + \frac{1}{2}\left[\mathbf{a}(t) + \mathbf{a}(t + \Delta t)\right]\Delta t
\]

Notice you need a(t + Δt), which means you must evaluate forces at the new positions before you can complete the velocity update. This is why the algorithm in practice proceeds as:

1. Update positions using r(t), v(t), a(t)
2. Compute forces at new positions → get a(t + Δt)
3. Update velocities using a(t) and a(t + Δt)

The energy error per step is O(Δt^3) for positions and O(Δt^3) for velocities. The global error over a fixed time interval T is O(Δt^2). But because of symplecticity, the energy error is bounded rather than growing as T/Δt. That's the practical win.

---

## Reality check

In LAMMPS, Velocity Verlet is the default integrator and you get it automatically with any `fix nve`, `fix nvt`, or `fix npt`. You don't set it explicitly.

The timestep is set with:

```
timestep 1.0   # in femtoseconds
```

**How to choose the timestep:**

The timestep must resolve the fastest vibration in your system. For a rough rule:

- Carbon-carbon bonds (graphene, AIREBO): ~1 fs
- Metals (EAM, no bond vibrations): ~2 fs
- Systems with hydrogen (C-H bonds, ~3300 cm⁻¹): ~0.5–1 fs
- Coarse-grained models: 5–20 fs or larger

If your timestep is too large, you'll see one of two things: immediate energy explosion (obvious), or slow energy drift that takes a few hundred ps to become apparent (sneaky). Always validate with a short NVE run before production.

**Validating your integrator:**

Run 10–100 ps in NVE. Plot the total energy (kinetic + potential) as a function of time. You want:

- Bounded oscillations, no net drift
- Fluctuations < 0.01% of total energy for a good integration

If you see drift: timestep is too large. Halve it and check again.

!!! warning "Common Mistake"
    Using 2 fs timestep for a system containing hydrogen. C-H bond vibrations have a period of ~10 fs. The Nyquist criterion for integration requires at least 5–10 points per period, so you need Δt ≤ 1 fs, ideally 0.5 fs. With 2 fs, you're under-sampling the fastest mode and the integrator will eventually fail.

!!! note "Simulation Note"
    The leapfrog integrator, used in some codes, is mathematically equivalent to Velocity Verlet but stores velocities at half-integer timesteps. The physical results are identical. GROMACS uses leapfrog by default. LAMMPS uses Velocity Verlet. Don't worry about the difference; it's purely a bookkeeping choice.

---

## Illustration

Two NVE simulations side by side: one with Euler integration (energy drifts upward, simulation eventually explodes), one with Velocity Verlet (energy oscillates around the correct value, bounded forever). The difference is the entire argument for why the integrator matters.

*(Figure: `docs/assets/figures/verlet_vs_euler_energy.png` — generated by `scripts/plot_verlet_comparison.py`)*

---

## Takeaway

Velocity Verlet is symplectic: it preserves phase-space volume and keeps energy errors bounded over arbitrarily long trajectories. That property matters more than per-step accuracy for MD. Pick your timestep to resolve the fastest vibration in your system, and validate with an NVE energy conservation test before you trust anything else.
