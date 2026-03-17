# Free Energy & Rare Events

> **Definition:** The free energy difference between two states is the reversible work required to transform one into the other at constant temperature and pressure. Because rare events (phase transitions, chemical reactions, conformational changes) involve energy barriers much larger than $k_BT$, standard MD does not sample them on accessible timescales. Enhanced sampling methods bias the simulation to cross these barriers and then correct for the bias to recover the true free energy surface.

The problem is simple to state and brutal to solve. You want to know the free energy difference between state A and state B. Direct MD will sit in state A essentially forever if the barrier is more than ~5 $k_BT$. You need to either force the system over the barrier and account for that forcing, or run many replicas at different conditions and stitch the results together.

---

## Hook

You're simulating a protein folding event. The timescale is microseconds. Your MD timestep is 2 fs. You'd need $5 \times 10^8$ steps to see one event — and that assumes you'd even recognize it. Standard MD cannot do this. Enhanced sampling is not an advanced technique. For any problem involving barrier crossing, it's the only option.

---

## Why should you care?

Reaction rates, phase transition temperatures, binding affinities, diffusion barriers in solids — all require free energy differences, not just potential energy differences. The potential energy minimum gives you the ground state structure. The free energy minimum gives you what actually happens at finite temperature with entropy included. These are not the same thing.

---

## The wrong intuition

"I'll just run a long enough simulation and it will sample everything."

For a barrier of 10 $k_BT$ at 300 K (about 0.25 eV), the crossing probability per attempt is $e^{-10} \approx 5 \times 10^{-5}$. If attempts happen at 1 THz (every 1 ps), you'd expect one crossing every ~20 µs. A 10 ns simulation has essentially zero probability of seeing it. "Longer" doesn't help at this scale — it needs to be 3–4 orders of magnitude longer.

---

## The explanation

**Free energy basics.** The Helmholtz free energy is $A = U - TS$. The barrier in free energy space is smaller than in potential energy space when entropy favors the transition path — and larger when it doesn't. You cannot read the free energy barrier from a potential energy landscape alone.

**The four main approaches.**

**Umbrella sampling.** Add a harmonic biasing potential $U_\text{bias}(\xi) = \frac{k}{2}(\xi - \xi_0)^2$ along a collective variable (reaction coordinate) $\xi$. Run windows at different $\xi_0$ values covering the transition. The bias forces sampling in regions that would otherwise be unvisited. After simulation, remove the bias using the Weighted Histogram Analysis Method (WHAM) or MBAR to recover the unbiased free energy profile (potential of mean force, PMF). Requires choosing a good reaction coordinate upfront.

**Metadynamics.** Deposit repulsive Gaussian hills on the free energy surface as you simulate, discouraging the system from revisiting where it's been. The accumulated hills fill up the free energy wells. At convergence, the negative of the deposited bias approximates the free energy surface. Well-tempered metadynamics (WTMetaD) controls the hill height to converge smoothly. The key input: the collective variables (CVs) must describe the slow degrees of freedom. If you miss a relevant CV, the simulation doesn't know what it's missing.

**Thermodynamic integration (TI).** Compute the free energy difference by integrating the mean force along a path from state A to state B:

$$
\Delta A = \int_0^1 \left\langle \frac{\partial U(\lambda)}{\partial \lambda} \right\rangle_\lambda d\lambda
$$

$\lambda$ is a coupling parameter that smoothly transforms $U$ from state A ($\lambda=0$) to state B ($\lambda=1$). Run simulations at discrete $\lambda$ values, compute the average of $\partial U/\partial \lambda$ at each, integrate numerically. Standard for solvation free energies and protein-ligand binding in biomolecular simulation.

**Nudged Elastic Band (NEB).** For minimum energy path finding in DFT or classical MD. Connect initial and final states with a chain of images (typically 5–10). Relax the chain so each image converges to the minimum energy path. The highest-energy image gives the saddle point and transition state energy. Unlike TI or umbrella sampling, NEB gives you the reaction pathway in configuration space, not a free energy at finite temperature — it's a zero-temperature method. For finite-temperature free energy barriers, add a vibrational correction (harmonic transition state theory).

**Replica Exchange MD (REMD).** Run $N$ replicas at different temperatures simultaneously. Periodically attempt swaps between adjacent replicas with a Metropolis criterion. The high-temperature replicas overcome barriers; swaps propagate configurations down to lower-temperature replicas. Computationally expensive ($N$ replicas), but requires no reaction coordinate. Useful when you don't know what the slow collective variable is.

---

## Reality check

In LAMMPS, umbrella sampling requires external CV definition (use PLUMED plugin). In GROMACS + PLUMED, metadynamics is directly supported. For solid-state NEB: VASP's `ICHAIN = 0` + `IMAGES`, or ASE's NEB implementation with any DFT backend.

Choosing the method:

| Situation | Method |
|---|---|
| Known reaction coordinate, PMF needed | Umbrella sampling |
| Unknown slow CV, biomolecular | Metadynamics or REMD |
| Transition state energy in DFT | NEB |
| Solvation / alchemical free energy | Thermodynamic integration |

!!! warning "Common Mistake"
    Running umbrella sampling or metadynamics without validating that the chosen collective variable actually describes the slow degree of freedom. If the CV doesn't capture the transition, the simulation will run, look converged, and give you the wrong free energy surface.

---

## Takeaway

If there's a barrier more than a few $k_BT$ high, plain MD won't cross it. Choose the enhanced sampling method based on what you know about the reaction coordinate — and if you don't know the RC, REMD or metadynamics with multiple CVs is your starting point.
