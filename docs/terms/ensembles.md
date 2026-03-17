# Ensembles — NVE · NVT · NPT

> **Definition:** Statistical mechanical frameworks defined by the set of macroscopic variables held constant during simulation. NVE (microcanonical) conserves particle number N, volume V, and total energy E with no thermostat or barostat. NVT (canonical) conserves N, V, and temperature T via a thermostat. NPT (isothermal-isobaric) conserves N, pressure P, and T via both thermostat and barostat. Each ensemble produces different statistical fluctuations and is appropriate for different physical questions.

Think of it this way. NVE is a perfectly sealed, perfectly insulating box. NVT is that same box but someone stuck a temperature probe through the wall connected to a heat bath. NPT is that box with the probe, and now the walls can flex. What you hold fixed determines what you're allowed to measure, and what gets to fluctuate.

---

## Hook

You want to run your simulation at 300 K. You set `fix nvt temp 300`. Temperature is 300 K.

Then you check the energy. It's fluctuating. Is that a bug?

No. That's the canonical ensemble doing exactly what it's supposed to do. Energy fluctuates in NVT. That's physics, not an error. Understanding why is what this page is about.

---

## Why should you care?

Because every time you start a LAMMPS script you choose an ensemble, and the wrong choice gives you either wrong numbers or unphysical dynamics.

Want the correct density of your material at ambient conditions? You need NPT. Want to compute the Green-Kubo viscosity or phonon spectrum? You want NVE after equilibrating in NPT. Want to test your integrator and validate energy conservation? NVE is the only honest test.

The ensemble isn't just a technical setting. It's the physical situation you're simulating. Choose it deliberately.

---

## The wrong intuition

Ensembles are interchangeable and you just pick whichever is convenient. They are not.

NVT and NVE give you different energy fluctuations, different heat capacities, different dynamics depending on which thermostat you use. NPT gives you a fluctuating volume, which means your density is a result, not an input. If you run NVT at the wrong density, you've built in residual stress that contaminates every property you measure.

The other wrong picture: "NVT means temperature is exactly 300 K at every timestep."

It doesn't. The thermostat controls the time-averaged temperature. Instantaneous kinetic temperature fluctuates around T_target. Those fluctuations are physically real. Berendsen suppresses them artificially. That's not more physical. It's less physical, and it's why Berendsen is wrong for production runs.

---

## The explanation

**NVE.** You integrate Newton's equations with no external coupling. Total energy H = T + U is conserved up to integration error. Temperature fluctuates because kinetic and potential energy exchange constantly as atoms move. Nothing intervenes. This is the microcanonical ensemble.

NVE is the purest diagnostic of your setup. Monotonic energy drift in NVE means something is wrong with your timestep, force field, or neighbor list. Fix it before you run anything else.

**NVT.** You add a thermostat. It acts as a heat bath at temperature T, exchanging energy with your system to maintain T on average. Energy is no longer conserved. The system now samples configurations weighted by the Boltzmann factor at temperature T. This is the canonical ensemble.

The thermostat doesn't freeze the temperature. It drives the time-averaged kinetic energy toward 3Nk_BT/2. Individual timesteps will be warmer or cooler. That's correct behavior.

**NPT.** You add a barostat. Now the simulation cell changes volume to maintain target pressure. Volume fluctuates. Density fluctuates. The material finds its own equilibrium density at your target T and P. This is the isothermal-isobaric ensemble.

NPT is almost always what you want for equilibration. Don't guess the density. Let the simulation find it.

---

## The math

Ready? Let's do this.

In NVE, the conserved quantity is the Hamiltonian:

\[
H = \sum_i \frac{p_i^2}{2m_i} + U(\mathbf{r}_1, \ldots, \mathbf{r}_N) = \text{const}
\]

In NVT, configurations are sampled proportional to the Boltzmann weight. The canonical partition function:

\[
Z_{NVT} = \int e^{-\beta H} \, d\mathbf{r} \, d\mathbf{p}, \qquad \beta = \frac{1}{k_B T}
\]

Every equilibrium property you compute is an integral over this distribution. The thermostat's job is to generate trajectories that sample it correctly.

In NPT, you add a pressure-volume term and integrate over volumes:

\[
Z_{NPT} = \int_0^\infty dV \int e^{-\beta(H + PV)} \, d\mathbf{r} \, d\mathbf{p}
\]

The barostat makes the cell fluctuate so this distribution is sampled correctly.

Plain language restatement. NVE conserves energy. NVT fixes temperature and lets energy float. NPT fixes temperature and pressure and lets both energy and volume float. Each samples a different statistical distribution and is the right tool for different questions.

---

## Reality check

In LAMMPS, the ensemble is set by your `fix` command.

```
fix 1 all nve
fix 1 all nvt temp 300 300 100
fix 1 all npt temp 300 300 100 iso 0 0 1000
```

The three numbers after `temp` are T_start, T_end, and the thermostat damping time in femtoseconds. The three numbers after `iso` are P_start, P_end, and the barostat damping time.

Damping times matter. Too short (10 fs) and the thermostat over-corrects, producing artificial temperature oscillations. Too long (10,000 fs) and it barely responds. A typical starting point is 100 fs for the thermostat and 1000 fs for the barostat. Adjust if your system has unusually fast or slow modes.

**A workflow that actually works:**

1. Energy minimize first (`min_style cg`)
2. Equilibrate in NPT until volume and energy stabilize
3. Switch to NVT at the equilibrated volume for property measurements
4. Switch to NVE for transport properties via Green-Kubo

Don't compute transport properties in NPT. Volume fluctuations contaminate stress autocorrelation functions.

!!! warning "Common Mistake"
    Using Berendsen thermostat or barostat for production runs. Berendsen equilibrates fast but generates incorrect ensemble fluctuations. Heat capacity, compressibility, and any fluctuation-based property will be wrong. Use Nosé-Hoover for production NVT, Parrinello-Rahman for production NPT.

!!! note "Simulation Note"
    In QE AIMD, the ensemble is set by `ion_dynamics`. `'verlet'` is NVE-like. `'langevin'` gives stochastic NVT. For geometry optimization, `'bfgs'` or `'damp'` are minimizers, not MD ensembles, and they don't sample any statistical distribution.

---

## Takeaway

The ensemble is the physical situation you're simulating. NVE is the truth test, NVT is the workhorse, NPT gives you the correct density. Equilibrate in NPT, measure in NVT or NVE.
