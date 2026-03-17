# Thermalization & Equilibration

> **Definition:** The initial phase of an MD simulation in which the system evolves from an artificially prepared starting configuration toward thermal equilibrium at the target temperature and pressure. Equilibration is complete when energy, temperature, pressure, density, and relevant structural quantities have all stabilized. Production data are collected only afterward.

You built a perfect crystal at 0 K and now want to simulate it at 1000 K. You can't just teleport it there. You have to let it get there, wait for it to forget where it started, and only then start measuring. Equilibration is the forgetting.

---

## Hook

I've collected data from a simulation that wasn't equilibrated. The RDF looked reasonable. The temperature was stable. The energy was stable. And the diffusion coefficient was off by a factor of three.

The system was still structurally relaxing — slowly, invisibly — and I collected production data on top of it. The temperature convergence fooled me. Don't let it fool you.

---

## Why should you care?

Any observable you compute during equilibration is biased by the initial condition. If you started from a perfect crystal and your system should be amorphous at the target temperature, your early-time RDF is crystalline. Your early-time MSD starts in a regime where the atoms remember their perfect lattice positions. None of that is equilibrium.

Production data collected before equilibration is not a sample from the target ensemble. It's a sample from the transient between your initial condition and equilibrium.

---

## The wrong intuition

"Temperature stabilized, so the system is equilibrated."

Temperature is a kinetic quantity — it responds fast, typically within a few picoseconds of thermostat application. Structural quantities (density, coordination number, RDF peak positions) relax much more slowly. Viscous liquids, glasses, and complex materials can take orders of magnitude longer to structurally equilibrate than to thermalize.

The right check is not temperature. It's the slowest observable you plan to measure.

---

## The explanation

Equilibration has two stages that often get conflated.

**Thermalization.** Getting the kinetic energy distribution right. Apply the thermostat, let the temperature reach T_target, wait for velocity distribution to approach Maxwell-Boltzmann. Fast. Typically a few picoseconds.

**Structural equilibration.** Getting the atomic arrangement right for the target T and P. This requires the system to explore enough of configuration space to forget the initial geometry. Slow. Depends entirely on the system.

For a simple liquid at high temperature, a few hundred picoseconds may be enough. For a dense amorphous solid near its glass transition, you may need microseconds — which is often inaccessible to direct MD. For a crystal with point defects, equilibration time depends on the defect migration barrier.

**Practical check.** Plot your key observables (potential energy, density, and whatever structural quantity you'll measure in production) as a function of simulation time. Equilibration is complete when all of them have settled into stationary fluctuations — no trend, no drift, just noise around a mean.

---

## Reality check

A standard equilibration workflow in LAMMPS:

```
# 1. Minimize
minimize 1e-6 1e-8 1000 10000

# 2. Heat from 0 K to target T in NVT
fix 1 all nvt temp 1 1000 100
run 50000     # 50 ps

# 3. Equilibrate at target T and P in NPT
unfix 1
fix 1 all npt temp 1000 1000 100 iso 0 0 1000
run 500000    # 500 ps — check convergence

# 4. Production in NVT at equilibrated volume
unfix 1
fix 1 all nvt temp 1000 1000 100
run 1000000   # 1 ns production
```

During step 3, watch the potential energy per atom and the box volume in the thermo output. When both plateau into noise, you're equilibrated. If they're still trending at the end of 500 ps, you need more time.

!!! warning "Common Mistake"
    Using a fixed equilibration time (e.g., "always 500 ps") regardless of system. Equilibration time varies by orders of magnitude across systems. Check the observables, not the clock.

!!! note "Simulation Note"
    For AIMD (QE/VASP), trajectories are short (10–100 ps). Equilibration eats a significant fraction of your compute budget. Be aggressive about starting from a good initial geometry (pre-relaxed with classical MD or DFT relaxation) to reduce the equilibration time needed.

---

## Takeaway

Equilibration is complete when your slowest observable has stabilized, not when your temperature has. Check everything you plan to measure, not just the thermostat output.
