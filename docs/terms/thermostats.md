# Thermostats & Barostats

> **Definition:** Thermostats are algorithms that couple an MD simulation to a heat bath, generating a canonical (NVT) ensemble by modifying atomic velocities or equations of motion to maintain a target temperature. Nosé-Hoover is a deterministic extended Lagrangian that rigorously samples the canonical ensemble and requires a correct coupling time constant. Langevin adds stochastic friction and a random force, and is natural for implicit solvent. Berendsen rescales velocities rapidly toward T_target but suppresses correct ensemble fluctuations and should not be used for production runs. Barostats control pressure by dynamically adjusting the simulation cell; Parrinello-Rahman generates the correct NPT ensemble, Berendsen barostat does not.

The Nosé-Hoover thermostat is that one friend who's always gently nudging your velocities to keep things chill. Literally. Not too hard, not too soft — just enough to keep the time-averaged temperature where you want it, while leaving the physics otherwise intact. Berendsen is the friend who grabs the steering wheel. Fast. Effective. Wrong.

---

## Hook

Here's the uncomfortable truth about thermostats. Temperature in MD is defined as the mean kinetic energy. But you want to run at 300 K. So you need something to maintain that.

The problem is that "maintaining temperature" can mean very different things depending on the algorithm. One approach gives you the correct statistical mechanics. Another gives you fast equilibration but systematically wrong fluctuations. They look identical in most thermo output. The difference only shows up when you compute heat capacity, or run Green-Kubo, or need the partition function to mean something.

---

## Why should you care?

Because you use a thermostat in literally every NVT and NPT simulation you run. And if you use the wrong one for production, your results are wrong in a way that's hard to detect from the trajectory alone.

The specific properties that are corrupted by a wrong thermostat: heat capacity (requires energy fluctuations), diffusion coefficients from velocity autocorrelation (requires correct velocity distribution), NMR/IR spectra from AIMD (requires correct dynamics), and anything derived from the partition function.

For simple structural properties like the RDF or lattice constant, it usually doesn't matter much. But as soon as you're computing dynamics or fluctuations, it matters enormously.

---

## The wrong intuition

"The thermostat just rescales velocities a bit every step. Any method that hits the target temperature is fine."

This is the Berendsen assumption, and it's wrong for production. Berendsen rescales velocities by a factor that drives T toward T_target. It works. Temperature stabilizes fast. But the velocity distribution it produces is not the Maxwell-Boltzmann distribution at temperature T. The kinetic energy fluctuations are suppressed. The result is an artificial ensemble that lies somewhere between NVE and NVT.

The consequences: heat capacity computed from energy fluctuations is wrong (fluctuations are too small). The dynamics near phase transitions are wrong. Any observable that depends on the width of the energy distribution is biased.

"A tighter coupling constant gives better temperature control."

Tighter coupling (smaller damping time) does reduce temperature fluctuations. But reducing temperature fluctuations *is the wrong goal for a production run*. Those fluctuations are physically real. You want them. A coupling constant that's too tight turns your NVT simulation into something closer to microcanonical with velocity rescaling.

---

## The explanation

**Nosé-Hoover thermostat.** The idea is elegant. You introduce an extra degree of freedom s into the Hamiltonian — a "heat bath variable" with its own mass Q and kinetic energy. The equations of motion for the real atoms are modified so that the heat bath variable acts as a friction coefficient on the velocities, speeding them up or slowing them down to maintain T on average.

The extended Hamiltonian is conserved (a good sign). The trajectory generated samples the canonical ensemble exactly in the long-time limit. The coupling constant Q (or equivalently the damping time τ = √(Q / 3Nk_BT)) controls how fast the thermostat responds. Typically τ ≈ 100 fs is a good starting point.

This is what `fix nvt` in LAMMPS uses by default.

**Nosé-Hoover chains.** The basic Nosé-Hoover thermostat can fail to ergodically sample phase space for small or stiff systems (like a single harmonic oscillator). Nosé-Hoover chains couple multiple heat bath variables in series, fixing this. LAMMPS uses chains by default.

**Langevin thermostat.** Each atom experiences a friction force proportional to its velocity plus a random force with the right amplitude to satisfy the fluctuation-dissipation theorem. The noise drives the system toward T; the friction damps it. It's stochastic, so trajectories are not deterministic. Good for implicit-solvent simulations where you want diffusive dynamics. Not ideal for computing dynamical properties from equilibrium trajectories because the random force perturbs the natural dynamics.

**Berendsen thermostat.** Velocities are rescaled at each step by a factor that exponentially relaxes T toward T_target with time constant τ. Fast. Simple. Wrong ensemble. Use only for equilibration, never for production.

---

## The math

Ready? Let's do this.

The Nosé-Hoover equations of motion (single thermostat, simplified):

\[
\dot{\mathbf{r}}_i = \frac{\mathbf{p}_i}{m_i}
\]
\[
\dot{\mathbf{p}}_i = \mathbf{F}_i - \xi \mathbf{p}_i
\]
\[
\dot{\xi} = \frac{1}{Q}\left(\sum_i \frac{p_i^2}{m_i} - 3Nk_BT\right)
\]

The third equation is the key. ξ is the friction coefficient. When the kinetic energy is above 3Nk_BT/2, ξ increases, adding friction to slow atoms down. When it's below, ξ decreases (becomes negative), effectively accelerating atoms. The system is driven toward the target temperature by this feedback.

The conserved quantity is the extended Hamiltonian:

\[
H_{\text{NH}} = H + \frac{Q\xi^2}{2} + 3Nk_BT \ln s
\]

Monitoring this quantity in your LAMMPS run (it's the `etotal` equivalent for the extended system) tells you if integration is working correctly.

For the Berendsen thermostat, the velocity rescaling factor at each step is:

\[
\lambda = \sqrt{1 + \frac{\Delta t}{\tau}\left(\frac{T_0}{T(t)} - 1\right)}
\]

Simple. Fast. Not the canonical ensemble.

---

## Barostats

The barostat is the pressure equivalent of the thermostat. It adjusts the simulation cell to maintain target pressure.

**Parrinello-Rahman barostat.** The cell vectors are dynamical variables with their own equations of motion. The cell can change shape as well as volume. Generates the correct NPT ensemble. This is what you want for production.

**Berendsen barostat.** Rescales the cell at each step to drive P toward P_target. Fast equilibration. Wrong ensemble fluctuations. Volume fluctuations are suppressed. Same story as the Berendsen thermostat.

**Practical note.** Parrinello-Rahman can be unstable when combined with an initial configuration that's far from equilibrium (the cell can oscillate wildly). The standard workflow: equilibrate first with Berendsen barostat, then switch to Parrinello-Rahman for production.

---

## Reality check

In LAMMPS:

```
# Nosé-Hoover NVT (default, correct)
fix 1 all nvt temp 300 300 100

# Langevin NVT (stochastic, good for implicit solvent)
fix 1 all langevin 300 300 100 12345
fix 2 all nve   # Langevin only adds forces; NVE does the integration

# Berendsen (equilibration only)
fix 1 all temp/berendsen 300 300 100

# NPT with Nosé-Hoover + Parrinello-Rahman equivalent
fix 1 all npt temp 300 300 100 iso 0 0 1000
```

The `100` after temperature is the thermostat damping time in femtoseconds. The `1000` after pressure is the barostat damping time. For the Langevin thermostat, the `12345` is the random seed.

In QE for AIMD:

```
ion_dynamics = 'langevin'
ion_temperature = 300
tempw = 300
fnosep = 0.5       ! Nosé-Hoover frequency in THz (if using nose)
```

!!! warning "Common Mistake"
    Using Berendsen for any run where you compute fluctuation-based properties (heat capacity, compressibility, diffusion via VACF). The suppressed fluctuations give systematically wrong results. This error is silent — your temperature looks perfect and your energy looks stable.

!!! note "Simulation Note"
    The Nosé-Hoover damping time (100 fs is typical) should be several times larger than the period of the fastest oscillation you care about. For graphene at 300 K, the fastest mode is around 50 THz (period ~20 fs), so 100 fs is fine. For a system with very soft modes (polymers, proteins), you may need a longer damping time.

---

## Takeaway

Nosé-Hoover for production NVT, Parrinello-Rahman for production NPT. Berendsen only for equilibration. The wrong thermostat looks fine until you compute something that actually depends on the ensemble.
