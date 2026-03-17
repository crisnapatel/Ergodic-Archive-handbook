# Glossary

All terms, precise technical definitions, alphabetical within category. Linked terms have a deep-dive page. Math and illustrations live in the deep dives.

---

## MD Fundamentals

**[Cutoff Radius](terms/cutoff-radius.md) (r_c)**
The maximum interatomic distance beyond which pair interactions are set to zero (or smoothly truncated to avoid a force discontinuity). Reduces the cost of force evaluation from O(N²) to O(N) via neighbor list algorithms. A necessary condition under MIC is r_c < L/2, where L is the shortest box dimension.

*Why it matters:* Choice of r_c directly trades accuracy against computational cost. Too small and you miss medium-range interactions; too large and neighbor list rebuilds dominate runtime.

*Common mistake:* Using r_c > L/2, which violates MIC and allows an atom to interact with two periodic images of the same neighbor, corrupting forces.

---

**[Ensembles](terms/ensembles.md) — NVE · NVT · NPT**
Statistical mechanical frameworks defined by the set of macroscopic variables held constant during simulation. NVE (microcanonical): conserves particle number N, volume V, and total energy E; no thermostat or barostat. NVT (canonical): conserves N, V, and temperature T via a thermostat. NPT (isothermal-isobaric): conserves N, pressure P, and T via both thermostat and barostat. Each ensemble produces different statistical fluctuations and is appropriate for different physical questions.

*Common mistake:* Running a production simulation in NVT at a volume that was never equilibrated in NPT, generating residual stress artifacts.

---

**[Ergodic Hypothesis](terms/ergodicity.md)**
The postulate that, for a system in statistical equilibrium, the time average of any observable over a sufficiently long trajectory equals the ensemble average over all accessible microstates. This is the foundational justification for extracting equilibrium thermodynamic quantities from a finite-length MD trajectory.

*Common mistake:* Assuming a run is ergodic because energy and temperature appear stable. Metastable trapping produces stable-looking averages that are not thermodynamic equilibrium values.

---

**[Equipartition Theorem](terms/equipartition.md)**
In classical statistical mechanics at thermal equilibrium, every independent quadratic term in the Hamiltonian contributes one-half k_B T to the mean energy. For N atoms with 3N translational degrees of freedom, the mean kinetic energy is 3Nk_BT/2. This is used in MD to define and compute instantaneous temperature from kinetic energy.

*Common mistake:* Not subtracting translational (and rotational, for gas-phase molecules) degrees of freedom from the denominator, giving a systematically underestimated temperature.

---

**[Force Fields / Interatomic Potentials](terms/force-fields.md)**
Parameterized mathematical functions that approximate the potential energy surface as a function of atomic positions, without solving the electronic Schrödinger equation. Forces are derived analytically as the negative gradient of the potential energy. Common examples: Lennard-Jones (noble gases and simple fluids), EAM and Finnis-Sinclair (metals), Tersoff and AIREBO (covalent carbon and hydrocarbon systems), ReaxFF (reactive systems with bond-breaking).

*Common mistake:* Using a potential outside its parameterization domain; for example, AIREBO at high strain rates for graphene gives unphysical forces.

---

**[Ghost Atoms](terms/cutoff-radius.md)**
Copies of atoms in neighboring MPI subdomains that are imported to the local subdomain to compute forces on atoms near domain boundaries. Ghost atoms receive computed forces but do not evolve their own dynamics; they are refreshed each time the neighbor list is rebuilt. Essential for correct force computation with domain decomposition parallelism.

---

**[Hamiltonian](terms/ensembles.md)**
The total energy function of a classical mechanical system, expressed as the sum of kinetic and potential energy as a function of atomic positions and momenta. In NVE MD, the Hamiltonian is a conserved quantity; drift in its value over time is the primary diagnostic for integrator quality and timestep correctness.

---

**[Minimum Image Convention](terms/mic.md) (MIC)**
Under periodic boundary conditions, the convention that each atom interacts only with the nearest periodic image of every other atom. For a rectangular box, the nearest-image displacement in each dimension must be at most half the corresponding box dimension. This imposes a strict upper bound on the valid cutoff radius.

*Common mistake:* Using r_c > L/2, which allows interaction with non-nearest images and corrupts forces.

---

**[Neighbor Lists](terms/cutoff-radius.md)**
Data structures that cache the set of atom pairs within a distance r_c plus a skin buffer, avoiding O(N²) distance checks at every timestep. Verlet lists store pair indices; cell lists partition space into subcells for efficient neighbor identification. Lists are rebuilt when any atom displaces more than half the skin distance.

---

**[Periodic Boundary Conditions](terms/pbc.md) (PBC)**
A boundary condition in which the simulation cell is replicated infinitely in all spatial directions, eliminating artificial surfaces. Atoms leaving one face re-enter from the opposite face with unchanged velocity. Appropriate for bulk crystals, liquids, and amorphous materials. Surface simulations use PBC in two dimensions with a vacuum gap in the third.

*Common mistake:* Using PBC for an isolated molecule without sufficient vacuum, causing the molecule to interact with its own periodic image.

---

**[Thermalization and Equilibration](terms/equilibration.md)**
The initial phase of an MD simulation in which the system evolves from an artificially prepared starting configuration toward thermal equilibrium at the target temperature and pressure. Equilibration is complete when energy, temperature, pressure, density, and relevant structural quantities have all stabilized. Production data are collected only afterward.

*Common mistake:* Declaring equilibration complete based on temperature stability alone, while slower structural relaxation (density, diffusivity) has not converged.

---

**[Thermostats](terms/thermostats.md)**
Algorithms that couple an MD simulation to a heat bath, generating a canonical (NVT) ensemble by modifying atomic velocities or equations of motion to maintain a target temperature. Nosé-Hoover: deterministic extended Lagrangian, rigorous NVT sampling, requires correct coupling time constant. Langevin: stochastic friction plus random force, natural for implicit solvent. Berendsen: velocity rescaling, fast equilibration but suppresses correct ensemble fluctuations and should not be used for production runs.

*Common mistake:* Using a Nosé-Hoover coupling time constant close to the timestep, which drives artificial high-frequency temperature oscillations.

---

**[Barostats](terms/thermostats.md)**
Algorithms that control pressure in an MD simulation by dynamically adjusting the simulation cell volume or shape. Parrinello-Rahman: extended Lagrangian, allows full cell shape fluctuations, rigorous NPT ensemble. Berendsen: fast but incorrect ensemble fluctuations, equilibration only. MTTK (Martyna-Tuckerman-Tobias-Klein): combines Nosé-Hoover chains with Parrinello-Rahman for rigorous NPT.

*Common mistake:* Using an isotropic barostat for a system undergoing anisotropic deformation (uniaxial compression, phase transition with symmetry change), which artificially constrains cell shape.

---

**[Velocity Verlet Integrator](terms/verlet.md)**
A symplectic, time-reversible, second-order algorithm for integrating Newton's equations of motion. Updates positions using current velocities and accelerations, then updates velocities using the average of accelerations at the current and next step. The symplectic property ensures phase-space volume conservation and bounded (non-divergent) long-time energy errors.

*Common mistake:* Using a timestep too large to resolve the fastest vibrational mode in the system. For C-H or O-H bonds this requires dt ≤ 1 fs; violation causes immediate energy blow-up.

---

**Water Models**
Empirical force field representations of water that balance computational cost with accuracy for bulk properties (density, diffusivity, dielectric constant, hydrogen bond geometry). Multiple models exist (SPC, SPC/E, TIP3P, TIP4P, TIP4P/2005, OPC, TIP5P) because no single parameterization reproduces all properties simultaneously; each is optimized for a specific subset. Choice of water model significantly affects protein solvation, ion hydration, and membrane simulations.

---

## Analysis and Observables

**[Finite Size Effects](terms/finite-size-effects.md)**
Artifacts in simulation results arising from the finite linear dimension of the simulation cell. When a physical correlation length approaches the box size, PBC artificially suppresses fluctuations and introduces image-image interactions. In charged-defect DFT calculations, periodic images of the defect interact electrostatically. Size convergence must be demonstrated explicitly.

---

**[Mean Squared Displacement](terms/msd.md) (MSD)**
The ensemble average of the squared displacement of atoms from their initial positions as a function of time. In the diffusive (long-time) regime, the slope of MSD versus time gives the self-diffusion coefficient via the Einstein relation.

*Common mistake:* Fitting D from a single MSD value rather than from the slope of the linear regime; early ballistic contributions and late-time noise both bias the result.

---

**[Radial Distribution Function](terms/rdf.md) (RDF, g(r))**
The ratio of the local number density of atoms at distance r from a reference atom to the bulk number density, normalized so that g(r) approaches 1 at large r in a homogeneous system. Sharp peaks indicate crystalline order; a first peak followed by decay to 1 indicates liquid-like short-range order. Directly comparable to X-ray and neutron diffraction structure factors via Fourier transform.

*Common mistake:* Computing the RDF from an under-equilibrated or insufficiently long trajectory, producing spurious or asymmetric peaks.

---

**Structure Factor S(Q)**
The Fourier transform of the pair distribution function, directly measurable by X-ray and neutron diffraction. Peaks in S(Q) correspond to characteristic length scales in the material. Provides experimental validation of simulation structure; agreement between computed and measured S(Q) is a standard benchmark.

---

## DFT Fundamentals

**[Basis Sets](terms/basis-sets.md)**
The set of mathematical functions used to expand Kohn-Sham wavefunctions in a DFT calculation. In periodic codes (QE, VASP), the standard basis is plane waves, controlled by a single kinetic energy cutoff. In molecular or mixed codes (CP2K, FHI-aims, ORCA), localized atomic orbitals (Gaussian-type or numerical) are used instead; these require choosing basis functions per element and are susceptible to basis-set superposition error (BSSE) in energy differences. Plane-wave bases are systematically improvable by raising the cutoff and are free of BSSE.

*Common mistake:* Assuming total energies are comparable between different basis set types. Only energy differences computed within the same basis are meaningful.

---

**[Born-Oppenheimer Approximation](terms/born-oppenheimer.md)**
The decoupling of nuclear and electronic degrees of freedom based on the large nuclear-to-electron mass ratio (typically 10³ to 10⁵). The electronic Schrödinger equation is solved at each fixed nuclear geometry, yielding an electronic energy as a function of nuclear positions. This function defines the potential energy surface on which nuclei move. The approximation breaks down near conical intersections and for non-adiabatic processes.

*Common mistake:* Applying BO-based methods to excited-state dynamics or proton transfer in quantum regimes, where non-adiabatic and nuclear quantum effects are significant.

---

**[Brillouin Zone Sampling](terms/kpoints.md) (k-points)**
Numerical integration of k-dependent quantities over the first Brillouin zone of a periodic crystal, required by Bloch's theorem. Monkhorst-Pack grids provide systematic uniform sampling; denser grids improve accuracy at higher cost. For metallic systems, partial occupancies near the Fermi level require smearing in addition to dense k-point meshes.

*Common mistake:* Using a k-mesh converged for total energy but not for forces or elastic constants, which converge more slowly.

---

**Bloch's Theorem**
The exact result that, in a periodic potential, every eigenstate takes the form of a plane wave modulated by a function with the periodicity of the lattice. Reduces the infinite periodic system to a family of finite eigenproblems at each crystal momentum k in the first Brillouin zone. The computational foundation of all plane-wave DFT codes.

---

**[Reciprocal Lattice](terms/reciprocal-lattice.md)**
The Fourier-dual of the real-space crystal lattice, defined by the set of wavevectors **G** satisfying $e^{i\mathbf{G}\cdot\mathbf{R}} = 1$ for all real-space lattice vectors **R**. The first Brillouin zone is the Wigner-Seitz cell of the reciprocal lattice and is the domain over which k-point sampling is performed. Plane waves with wavevectors **G** form the natural basis for expanding periodic wavefunctions; the reciprocal lattice vectors define the discrete Fourier frequencies used in plane-wave DFT.

---

**[Wavevector k](terms/wavevector-k.md) (Crystal Momentum)**
The quantum number labeling Bloch states in a periodic crystal, confined to the first Brillouin zone. k is not physical momentum but crystal momentum: it encodes the translational symmetry of the lattice, not the true momentum of the electron. The dispersion relation $E_n(\mathbf{k})$ defines the band structure. In k-point sampling, the integral of all k-dependent quantities over the Brillouin zone is approximated by a discrete sum over a finite k-point grid.

*Common mistake:* Confusing crystal momentum k with physical momentum. They differ by a reciprocal lattice vector; the distinction matters for optical transitions and transport calculations.

---

**[Convergence Testing](terms/convergence.md)**
The systematic verification that computed DFT results are insensitive to numerical discretization parameters within an acceptable tolerance (typically 1 to 5 meV/atom for energy differences). The two primary parameters in plane-wave DFT are the kinetic energy cutoff (size of the plane-wave basis) and the k-point grid density. Convergence is system- and property-specific; values from one system do not transfer to another.

*Common mistake:* Demonstrating convergence of total energy per atom and assuming energy differences (adsorption energies, reaction barriers) are equally converged. Cancellation is incomplete for differences involving different chemical environments.

---

**[Electron Density](terms/electron-density.md)**
The probability distribution of electrons in real space, defined as the expectation value of the electron number density operator. In DFT, the electron density $\rho(\mathbf{r})$ is the primary variable: by the Hohenberg-Kohn theorem, all ground-state properties of a system are uniquely determined by $\rho(\mathbf{r})$ alone. In a Kohn-Sham calculation, it is constructed as the sum of squared orbital moduli over all occupied states: $\rho(\mathbf{r}) = \sum_n f_n |\psi_{n\mathbf{k}}(\mathbf{r})|^2$. The SCF loop converges when the input and output electron densities are self-consistent.

*Why it matters:* The converged charge density is the physical output of a DFT calculation; all energies, forces, and potentials are derived from it.

---

**Density of States (DOS)**
The number of electronic states per unit energy interval as a function of energy. The total DOS integrates to the number of electrons; features correspond to bonding or antibonding character, band edges, and van Hove singularities. The projected or partial DOS (PDOS) resolves contributions by atom and angular momentum channel, enabling chemical interpretation of bonding.

---

**Band Structure**
The dispersion relation of Kohn-Sham eigenvalues as a function of crystal momentum k along high-symmetry paths in the Brillouin zone. Reveals whether a material is metallic (bands cross the Fermi level), semiconducting or insulating (a gap separates valence and conduction bands), or topologically nontrivial (band inversions, Dirac cones).

---

**Band Gap**
The energy difference between the top of the valence band and the bottom of the conduction band. LDA and GGA functionals systematically underestimate band gaps due to self-interaction error; hybrid functionals (HSE06) or many-body perturbation theory (GW) are required for quantitative accuracy.

---

**[Exchange-Correlation Functional](terms/xc-functional.md)**
The term in the Kohn-Sham energy functional that accounts for all quantum electron-electron interaction effects beyond classical Hartree repulsion: exchange (Pauli exclusion) and correlation. Must be approximated. Hierarchy: LDA (local density), GGA (adds density gradient; PBE, PBEsol), meta-GGA (adds kinetic energy density), hybrid (mixes exact exchange; HSE06), vdW-corrected (adds dispersion; vdW-DF2, DFT-D3, rev-vdW-DF2 / QE label `vdw-df2-b86r`).

*Common mistake:* Using PBE for a property requiring dispersion corrections or accurate band gaps, then attributing the error to DFT rather than to the functional choice.

---

**[Functional](terms/functional.md)**
A mapping from a function to a scalar number. Where an ordinary function maps numbers to numbers ($f: \mathbb{R} \to \mathbb{R}$), a functional maps entire functions to numbers ($F[g]: \text{function} \to \mathbb{R}$). In DFT, the total energy is a functional of the electron density, written $E[\rho]$: given any density distribution $\rho(\mathbf{r})$, $E[\rho]$ returns a single energy value. The exchange-correlation energy $E_{xc}[\rho]$ is the specific functional that must be approximated in practice. The notation $[\cdot]$ denotes a functional argument by convention.

---

**Fermi Energy**
The electrochemical potential of electrons, defined as the energy below which all states are occupied at zero temperature. In metals it lies within a band; in semiconductors and insulators it lies within the gap. Sets the energy reference for DOS, band structure, and transport calculations.

---

**Hybrid Functional**
A DFT exchange-correlation functional that mixes a fraction of exact Hartree-Fock exchange into a GGA functional. Partially corrects the self-interaction error inherent in GGA, improving band gaps, reaction barriers, and localized electronic states. Standard examples: HSE06 (screened exchange, preferred for periodic solids), B3LYP (molecular chemistry). Computationally 10x to 100x more expensive than GGA.

---

**[Kohn-Sham Effective Potential](terms/vks-effective-potential.md) (V_KS)**
The total single-particle potential in which fictitious non-interacting Kohn-Sham electrons move, constructed as the sum of three contributions: the external potential from nuclei $V_\text{ext}$, the classical Hartree potential from electron-electron repulsion $V_H[\rho]$, and the exchange-correlation potential $V_{xc}[\rho] = \delta E_{xc}/\delta\rho$. Because all three terms depend on the electron density, $V_{KS}$ must be updated self-consistently at each SCF cycle. The quality of $V_{xc}$ determines the accuracy of the total potential and all derived properties.

---

**[Kohn-Sham Orbitals](terms/kohn-sham-orbitals.md) (Wavefunctions)**
The set of single-particle wavefunctions $\psi_{n\mathbf{k}}(\mathbf{r})$ that are solutions of the Kohn-Sham single-particle equations for a fictitious non-interacting electron system. Their only rigorous physical content is that their squared moduli sum to the true ground-state electron density. They are not the true many-electron wavefunctions, and their eigenvalues are not formally the ionization or excitation energies of the real system (with the exception of the highest occupied orbital by Janak's theorem).

*Common mistake:* Interpreting Kohn-Sham eigenvalue differences as true quasiparticle excitation energies. The Kohn-Sham band gap is not the fundamental gap of the real material; it systematically underestimates it.

---

**[Kohn-Sham Equations and SCF Cycle](terms/kohn-sham-scf.md)**
The central reformulation of the interacting many-electron problem in DFT (Kohn-Sham, 1965), which maps it onto a set of non-interacting electrons moving in an effective potential that depends on the electron density. The equations are solved self-consistently (SCF cycle): guess the density, compute the effective potential, solve the single-particle equations, update the density, repeat until convergence. Convergence indicates self-consistency between input and output charge density.

*Common mistake:* Using too loose an SCF convergence threshold for geometry optimization, producing noisy forces and an incorrectly relaxed structure.

---

**Mulliken and Bader Charge Analysis**
Methods for partitioning the continuous electron density into atomic charges. Mulliken analysis projects molecular orbital coefficients onto atomic basis functions; it is basis-set dependent and formally ill-defined in plane-wave codes. Bader analysis partitions the density in real space by zero-flux surfaces of the density gradient; it is basis-set independent and is the standard for charge transfer analysis in plane-wave DFT.

---

**Plane Wave Basis Set**
A complete, orthonormal basis of plane waves used to expand Kohn-Sham orbitals in periodic DFT calculations. Controlled by a single parameter: the kinetic energy cutoff, which determines the maximum spatial frequency represented. Plane waves are free of atomic basis set superposition error and are systematically improvable by increasing the cutoff.

---

**[Pseudopotentials and PAW](terms/pseudopotentials.md)**
Methods that replace chemically inert core electrons and the nucleus with a smooth effective potential, reducing the number of explicitly treated electrons and the required kinetic energy cutoff. Norm-conserving pseudopotentials preserve the charge integral inside the core radius. Ultrasoft pseudopotentials relax this constraint, allowing lower cutoffs. The Projector Augmented Wave (PAW) method recovers full all-electron character near the nucleus via a linear transformation, combining USPP efficiency with all-electron accuracy. PAW is the default in VASP; NC-PP and USPP are standard in QE.

*Common mistake:* Mixing pseudopotential libraries or DFT functional labels between codes without checking transferability.

---

**Smearing**
A broadening of the electron occupation function near the Fermi energy, replacing the sharp zero-temperature step function with a smooth function. Required for metallic systems to achieve k-point convergence without prohibitively dense grids. Common methods: Gaussian (simple), Methfessel-Paxton (accurate total energies), Marzari-Vanderbilt or cold smearing (variational, minimizes the smearing contribution to the free energy). The smearing width must be small enough not to bias ground-state energetics.

*Common mistake:* Using a large smearing width for a gapped (semiconductor) system, which artificially broadens the DOS and shifts computed energies.

---

**Van der Waals Correction**
Additive or non-local corrections to DFT exchange-correlation functionals to account for long-range dispersion (London) forces absent from LDA and GGA. Pairwise atom-atom corrections: DFT-D2, DFT-D3, DFT-D3(BJ). Non-local correlation functionals: vdW-DF, vdW-DF2, rev-vdW-DF2 (QE 7.3.x input label `vdw-df2-b86r`). Many-body dispersion (MBD) captures screening effects. Essential for layered materials, molecular crystals, physisorption, and any system where van der Waals binding contributes to cohesion.

---

**Density Functionals and Functional Hierarchy (Jacob's Ladder)**
The systematic hierarchy of DFT exchange-correlation approximations ordered by increasing accuracy and computational cost: LDA (1), GGA (2), meta-GGA (3), hybrid functionals (4), double hybrids or random phase approximation (5). Each rung adds a new ingredient (density gradient, kinetic energy density, exact exchange, virtual orbitals) to improve on the limitations of the previous level. No rung is universally best; the choice depends on the property and system.

---

**AIMD (Ab Initio Molecular Dynamics)**
MD in which interatomic forces are computed from a DFT electronic structure calculation at each timestep, rather than from an empirical force field. Captures chemical reactions, charge transfer, and bond-breaking and formation. Limited to systems of roughly 100 to 1000 atoms and timescales of 10 to 100 ps due to the cost of the electronic structure step.

---

**Car-Parrinello MD (CPMD)**
An AIMD method in which electronic degrees of freedom (orbital coefficients) are treated as classical fictitious dynamical variables and propagated simultaneously with ionic degrees of freedom via an extended Lagrangian. Avoids the full SCF minimization at each step; requires careful tuning of the fictitious electron mass to maintain adiabaticity between electronic and ionic subsystems.

---

## Sampling and Enhanced Sampling

**Collective Variables (CVs)**
Low-dimensional order parameters or reaction coordinates that capture the slow degrees of freedom relevant to a process of interest. Examples: interatomic distance, coordination number, torsion angle, bond-orientational order parameters, RMSD from a reference structure. CVs are the input to all enhanced sampling and free energy methods; their quality determines whether the computed free energy surface is meaningful.

---

**Metadynamics**
An enhanced sampling method in which a history-dependent bias potential (a sum of Gaussians) is progressively deposited along chosen collective variables, discouraging the system from revisiting already-sampled configurations. Over time the accumulated bias fills the underlying free energy surface, enabling its reconstruction as a function of the chosen collective variables.

*Common mistake:* Choosing collective variables that do not capture all relevant slow modes; the resulting free energy surface is projected onto an incomplete subspace and will not converge correctly.

---

**Umbrella Sampling**
An enhanced sampling method in which a series of harmonic bias potentials are applied at successive windows along a reaction coordinate, forcing sampling of otherwise inaccessible regions. The unbiased free energy profile is reconstructed from the overlapping windowed histograms using WHAM (Weighted Histogram Analysis Method) or MBAR.

---

**Transition State Theory (TST)**
A theoretical framework for estimating the rate of a thermally activated process from the properties of the saddle point on the potential energy surface. Classical harmonic TST expresses the rate as a prefactor multiplied by an Arrhenius factor involving the free energy barrier. Extended by variational TST and quantum corrections for tunneling and zero-point energy.

---

**Nudged Elastic Band (NEB)**
A method for finding the minimum energy path between two known local minima on a potential energy surface, and locating the saddle point (transition state). A chain of images (replicas) is placed between initial and final states; spring forces along the path and true forces perpendicular to it are combined to converge the chain to the minimum energy path.

---

**Replica Exchange MD (REMD)**
An enhanced sampling method in which multiple replicas of the system are simulated simultaneously at different temperatures, with periodic exchanges of configurations between replicas accepted by a Metropolis criterion. Low-temperature replicas benefit from configurations accessed at high temperature, improving sampling of complex free energy landscapes.

---

**Non-Equilibrium MD (NEMD)**
MD simulations in which an external perturbation (shear flow, heat flux, electric field) is applied to drive the system away from equilibrium, enabling direct computation of transport properties (viscosity, thermal conductivity, electrical conductivity) from the non-equilibrium response. Computationally more efficient than equilibrium Green-Kubo approaches for high-viscosity or high-thermal-resistance materials.

---

**Path Integral MD (PIMD)**
Extension of MD that incorporates nuclear quantum effects (zero-point energy, tunneling) by replacing each quantum particle with a ring polymer of classical replicas connected by harmonic springs, following Feynman's path integral discretization. Required for quantitative simulation of light nuclei (H, Li) at low temperatures where quantum motion of nuclei is significant.

---

**[Free Energy Methods and Rare Events](terms/free-energy.md)**
See [Metadynamics](#metadynamics), [Umbrella Sampling](#umbrella-sampling), [Transition State Theory](#transition-state-theory-tst), [NEB](#nudged-elastic-band-neb), [REMD](#replica-exchange-md-remd). General overview and comparison in the deep-dive page.

---

## Numerical Methods and Stability

**[Nyquist Criterion](terms/nyquist.md)**
Applied to MD timestep selection: to faithfully integrate a vibration of frequency f, the timestep must satisfy Δt < 1/(2f). For C-H bond stretching at ~3300 cm⁻¹ (period ~10 fs), Nyquist requires Δt < 5 fs, but accurate energy conservation in practice demands Δt ≤ 1 fs (roughly 10 samples per period). Violating the criterion causes the integrator to alias or diverge on the fastest mode.

---

**[Timestep](terms/nyquist.md) (Δt)**
The discrete time interval by which atomic positions and velocities are advanced at each MD step. Must be small enough to resolve the fastest atomic vibration in the system; for systems with C-H or O-H bonds this requires Δt at most 1 fs. Larger timesteps reduce computational cost but introduce integration error and can cause energy drift or simulation explosion.

---

**Symplectic and Non-Symplectic Integrators**
A symplectic integrator preserves the symplectic structure of Hamiltonian mechanics, which corresponds to conservation of phase-space volume (Liouville's theorem). This property guarantees that long-time energy errors are bounded and oscillatory rather than secular (diverging). The Velocity Verlet and leapfrog algorithms are symplectic. Euler and Runge-Kutta schemes are not; they exhibit secular energy drift unsuitable for long MD trajectories.

---

**Domain Decomposition**
A parallelization strategy in which the simulation box is spatially divided among MPI processes, each owning the atoms in its subdomain. Forces on atoms near boundaries require communication with adjacent processes via ghost atom exchange. Standard in LAMMPS and other large-scale MD codes; scales well to large N but communication overhead grows with the surface-to-volume ratio of subdomains.

---

**Constraint Algorithms (SHAKE and RATTLE)**
Algorithms that enforce holonomic constraints (fixed bond lengths or angles) during MD integration, removing the fastest vibrational modes and allowing larger timesteps. SHAKE constrains positions after the position update step; RATTLE also constrains velocities. Both solve iteratively for Lagrange multipliers satisfying the constraint equations to a specified tolerance.

---

**[Energy Minimization and Structural Relaxation](terms/energy-minimization.md)**
Iterative algorithms that move atoms (and optionally cell parameters) along the negative gradient of the potential energy surface until forces are below a convergence threshold. Steepest descent: robust far from the minimum, slow near it. Conjugate gradient: uses gradient history, standard for ionic relaxation in DFT. BFGS or quasi-Newton: approximates the inverse Hessian, fastest near a minimum. FIRE (fast inertial relaxation engine): robust for large or poorly conditioned classical systems.

*Common mistake:* Declaring convergence from energy change alone when forces are still large, particularly for soft modes where energy is insensitive to force errors.

---

**[Ewald Summation and PME](terms/ewald.md)**
A method for computing long-range Coulomb interactions under PBC without truncation. Splits the interaction into a short-range real-space contribution and a long-range reciprocal-space contribution evaluated via Fourier series. Particle Mesh Ewald (PME) uses fast Fourier transforms to evaluate the reciprocal sum in O(N log N). Essential for any charged or polar system; a simple real-space cutoff for Coulomb interactions in such systems introduces large systematic artifacts.

---

**Dispersion Tail Correction**
A long-range analytical correction to the total energy and pressure in classical MD that accounts for the contribution of pair interactions beyond the cutoff radius, assuming uniform density beyond r_c. Added as an integral of the pair potential tail from r_c to infinity. Standard for Lennard-Jones and similar pair styles in LAMMPS; relevant when the cutoff is smaller than the range over which the pair potential is non-negligible.

---

**SCF Convergence**
The iterative process in which Kohn-Sham equations are solved repeatedly, updating the charge density and effective potential at each cycle, until the change between successive cycles falls below a threshold. Convergence indicates self-consistency between input and output charge density. Failure modes include charge sloshing (density oscillates between cycles) and slow convergence for metallic systems; both are addressed by mixing schemes (Pulay, Broyden) and smearing.

---

**Reproducibility**
The ability to reproduce a simulation result given identical input files. In classical MD this is complicated by floating-point non-associativity in parallel force accumulation (result can depend on domain decomposition and number of MPI processes). In DFT, results should be reproducible across restarts but may differ between pseudopotential libraries or compiler optimizations. Reproducibility must be documented: code version, pseudopotential source, compiler, and key numerical parameters.

---

## Machine Learning Interatomic Potentials

**MLIPs (Machine Learning Interatomic Potentials)**
Interatomic potentials constructed by fitting a flexible machine learning model to a database of DFT-computed energies and forces, rather than using a fixed functional form. Aim to achieve near-DFT accuracy at a fraction of the computational cost. Common architectures: GAP (Gaussian Approximation Potential), NNP (neural network potential), DeePMD, MACE, NequIP, CHGNet.

---

**Descriptors**
Mathematical representations of the local atomic environment that are invariant under rotation, translation, and permutation of identical atoms. Serve as input features to MLIP models. Examples: SOAP (smooth overlap of atomic positions), bispectrum coefficients, Behler-Parrinello symmetry functions, ACE (atomic cluster expansion). Quality of the descriptor determines the expressiveness and transferability of the potential.

---

**Gaussian Approximation Potential (GAP)**
A class of MLIP that uses Gaussian process regression with SOAP descriptors as the kernel. Provides uncertainty estimates (GP posterior variance) alongside energy and force predictions. Well-established for materials such as carbon, silicon, and water; computationally more expensive at inference than neural network architectures.

---

**Neural Network Potential (NNP)**
An MLIP in which the total energy is expressed as a sum of atomic energy contributions, each predicted by a neural network taking the local environment descriptor as input. Computationally efficient at inference. Common architectures: Behler-Parrinello (symmetry function descriptors), DeePMD (embedding network plus fitting network), AENET.

---

**Embedding Network and Fitting Network (DeePMD)**
Components of the DeePMD neural network potential architecture. The embedding network maps the local environment (neighbor positions and types) into a rotationally equivariant descriptor vector. The fitting network maps this descriptor to the atomic energy contribution. The separation enables efficient training and inference.

---

**Graph Network Potential**
An MLIP architecture in which atoms are nodes and bonds are edges in a molecular graph; message-passing neural network layers propagate information between neighbors. Equivariant variants (NequIP, MACE, Allegro) encode rotational symmetry directly into the architecture using irreducible representations. Achieve high accuracy with fewer training points than earlier architectures.

---

**Training Set and Validation Set**
In MLIP development: the training set is the DFT database of structures (energies, forces, stresses) used to optimize potential parameters; the validation set is a held-out subset used to monitor overfitting and assess transferability. Composition, diversity, and size of the training set are the primary determinants of MLIP quality.

---

**Active Learning**
An iterative workflow for constructing MLIP training sets in which: (1) a candidate potential runs MD, (2) configurations where model uncertainty exceeds a threshold are flagged as new training candidates, (3) DFT labels are computed for those configurations, (4) the model is retrained. Focuses expensive DFT effort on the most informative configurations. Implemented in dpgen (DP-GEN), FLARE, and MACE active learning workflows.

---

**Model Transferability**
The ability of an MLIP to accurately predict energies and forces for configurations outside its training distribution (different phases, defect types, compositions, temperature and pressure ranges). Not guaranteed and must be validated explicitly. The central practical limitation of current MLIPs.

---

**Uncertainty Quantification (UQ)**
Methods for estimating the prediction error of an MLIP for a given configuration. Gaussian process models (GAP) provide natural posterior variance. For neural network potentials, UQ is obtained via committee models (ensemble of independently trained models; their disagreement is the uncertainty) or Monte Carlo dropout. Required for active learning and for detecting out-of-distribution configurations during production MD.

---

## Transport and Dynamic Properties

**VACF (Velocity Autocorrelation Function)**
The time correlation function of an atom's velocity with itself at a later time. Decays from its maximum value at zero time to zero in the diffusive regime. Its time integral gives the self-diffusion coefficient (Green-Kubo relation); its Fourier transform gives the vibrational density of states (phonon spectrum in the classical limit).

---

**Green-Kubo Relations**
A family of exact linear-response expressions relating equilibrium transport coefficients (diffusivity, shear viscosity, thermal conductivity, electrical conductivity) to time integrals of equilibrium time correlation functions. Provide an alternative to non-equilibrium methods for computing transport properties from unperturbed MD trajectories.

---

**Time Correlation Functions**
Functions that measure the statistical correlation between an observable at time zero and the same (auto-correlation) or different (cross-correlation) observable at a later time. Their time integrals give transport coefficients (Green-Kubo); their Fourier transforms give spectral densities (IR and Raman spectra, inelastic neutron scattering cross sections, phonon DOS).

---

**Stress Tensor and Virial Stress**
The stress tensor is the 3×3 tensor characterizing the mechanical state of a material, relating force per unit area to surface orientation. In atomistic simulations it is computed as the virial stress: the sum of kinetic energy (velocity outer product) and interatomic force (position-force outer product) contributions per unit volume. Required for pressure computation, elastic constant calculation, and mechanical response.

---

**Virial Theorem**
The classical statistical mechanical relation connecting the time-averaged kinetic energy of a system to its time-averaged potential energy and external forces. In MD, the instantaneous pressure is computed from the virial of the interatomic forces plus the kinetic energy contribution. The virial theorem is also the basis for computing bulk modulus and elastic constants from stress-strain relations.

---
