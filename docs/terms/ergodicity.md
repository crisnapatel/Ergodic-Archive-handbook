# Ergodic Hypothesis

> **Definition:** The postulate that, for a system in statistical equilibrium, the time average of any phase-space observable over a sufficiently long trajectory is equal to the ensemble average over all accessible microstates weighted by their statistical probability. Formally: \(\langle A \rangle_{\text{time}} = \langle A \rangle_{\text{ensemble}}\). This is the foundational justification for extracting equilibrium thermodynamic quantities from a single finite-length MD trajectory.

If you wait long enough and your system is well-behaved, the average of what you measure along one MD trajectory equals the average you'd get if you ran a thousand independent copies of the same system simultaneously. That's the deal. That's the whole deal. And if it's broken — you're stuck in a local basin, and your "equilibrium" result is an artifact of where you started.

---

## Why should you care?

Everything you compute from an MD simulation — diffusivity, heat capacity, radial distribution function, adsorption energy — is a time average over your trajectory. You run one trajectory and compute \(\frac{1}{T}\int_0^T A(t)\, dt\).

But thermodynamics is defined by ensemble averages. The heat capacity, the diffusion coefficient, the free energy — these are all defined as averages over all microstates consistent with your macroscopic conditions.

The ergodic hypothesis is what lets you connect those two things. If ergodicity holds, your one long trajectory samples all of phase space with the right statistical weight, and your time average *is* the ensemble average. If it doesn't hold — you have a problem.

This isn't a detail. It's the reason MD gives physically meaningful results at all.

---

## The wrong intuition

"My simulation ran for 10 ns and temperature, energy, and pressure were all stable. Therefore it's equilibrated and ergodic."

No. Stability of macroscopic observables is necessary but not sufficient. A system can be trapped in a metastable basin — a local minimum of the free energy surface, separated from other basins by barriers much larger than \(k_B T\) — and show perfectly stable temperature and pressure for the entire run. It looks equilibrated. It isn't. The time average you're computing is an average *within that basin*, not over all of phase space.

The classic example: a supercooled liquid that should be crystalline. Temperature: stable. Pressure: stable. Energy: stable. RDF: liquid-like. It's not at equilibrium. It's stuck.

---

## The explanation

Phase space is the space of all possible configurations and momenta of your N-atom system. For N atoms in 3D, phase space has 6N dimensions. Each point in phase space is one microstate — one complete specification of every atom's position and velocity.

As your MD simulation evolves, the system traces a path (trajectory) through this 6N-dimensional space. At every timestep, the system is at one point in phase space.

**Ergodicity says:** given infinite time, this trajectory visits every accessible region of phase space, spending time proportional to the Boltzmann weight \(e^{-E/k_B T}\) in each region.

If this is true, then averaging A along the trajectory gives the same result as averaging A over all accessible microstates with Boltzmann weights — which is exactly the canonical ensemble average.

**When does it break?**

When there are barriers in free energy space that the system cannot cross on the timescale of your simulation. This is not a failure of physics — it's a failure of sampling. The barriers are real. The physics is correct. But your trajectory never gets over them, so you never sample those regions, and your time average is biased.

This is the central challenge of computational statistical mechanics. Most interesting systems are not ergodic on simulation timescales. That's why free energy methods (metadynamics, umbrella sampling) exist: they force the system to explore the full phase space by adding bias potentials.

---

## The math

For an ergodic system:

\[
\langle A \rangle_{\text{time}} = \lim_{T \to \infty} \frac{1}{T} \int_0^T A\bigl(\mathbf{r}(t), \mathbf{p}(t)\bigr)\, dt = \langle A \rangle_{\text{ensemble}} = \frac{\int A\, e^{-\beta H} \, d\mathbf{r}\, d\mathbf{p}}{\int e^{-\beta H}\, d\mathbf{r}\, d\mathbf{p}}
\]

where \(\beta = 1/k_B T\) and H is the Hamiltonian.

In practice, "infinite time" becomes "long enough that adding more time doesn't change the average significantly." How long is that? It depends entirely on the system. For simple liquids at ambient conditions: nanoseconds. For polymer chains: microseconds to milliseconds. For protein folding: milliseconds to seconds. For glass transition: seconds to geological timescales.

The autocorrelation time \(\tau_A\) of observable A tells you how long you need:

\[
\tau_A = \int_0^\infty \frac{\langle \delta A(0)\, \delta A(t)\rangle}{\langle \delta A^2 \rangle}\, dt
\]

You need your total simulation time \(T \gg \tau_A\). For properties with long autocorrelation times (slow collective modes, rare events), this is the crux of the problem.

---

## Reality check

In practice, you check for ergodicity by:

1. **Running multiple independent simulations** from different initial configurations. If they all converge to the same time-averaged properties, you have evidence (not proof) of ergodicity.

2. **Checking autocorrelation functions**. If the autocorrelation of your observable of interest decays to zero well within your simulation time, you have good sampling. If it doesn't decay, your trajectory is too short.

3. **Block averaging**. Split your trajectory into blocks and compute the block-to-block variance. If it's larger than the variance within blocks, your trajectory is not long enough and successive blocks are still correlated.

In LAMMPS, you can compute velocity autocorrelation functions (VAC) with `compute vacf`. Integrate it to get the diffusion coefficient independently of MSD — if they agree, that's a positive sign for ergodic sampling.

For DFT-MD (AIMD), trajectories are typically 10–100 ps. For many systems (particularly disordered or viscous ones), this is nowhere near ergodic. AIMD results for "liquid" systems should be interpreted cautiously.

---

!!! warning "Common Mistake"
    Confusing *stability* with *ergodicity*. A metastable system can have perfectly stable thermodynamic averages. If you're studying a phase transition, a reactive system, or anything with significant barriers, you need more than a stable time trace to claim equilibrium sampling.

!!! note "Simulation Note"
    When you compute an average in LAMMPS with `fix ave/time`, you are computing a time average. If the system is ergodic for that observable over your run length, this equals the ensemble average. If it isn't — the number you get is still the average over that trajectory; it just doesn't have thermodynamic meaning.

---

## Takeaway

Ergodicity is why MD works. Your one trajectory, if long enough and well-sampled, gives you the same thermodynamics as the ensemble. When it breaks — and it often does for interesting systems — you are computing a phase-space average over a restricted region, not over all of equilibrium. Knowing when to trust your trajectory is as important as knowing how to run it.
