# Force Fields & Interatomic Potentials

> **Definition:** Parameterized mathematical functions that approximate the potential energy surface as a function of atomic positions, without solving the electronic Schrödinger equation. Forces are derived analytically as the negative gradient of the potential energy. Common examples: Lennard-Jones (noble gases and simple fluids), EAM and Finnis-Sinclair (metals), Tersoff and AIREBO (covalent carbon and hydrocarbon systems), ReaxFF (reactive systems with bond-breaking).

A force field is a mathematical lie that's useful enough to be worth telling. It pretends that you can describe how atoms interact with a fixed functional form and a set of numbers fitted to experiments or quantum calculations. For many systems, in the right regime, it works shockingly well. Outside that regime, it fails silently and gives you confident wrong answers.

---

## Hook

You run 10 ns of graphene under uniaxial tension using AIREBO. You get a fracture strain. You publish it. Someone else runs the same system with a machine-learned potential trained on DFT data and gets a completely different fracture strain.

Who's right? Probably not AIREBO. The AIREBO LJ term produces unphysical attractive interactions at high strain, and the potential wasn't designed for fracture mechanics. It gives you a number. The number is wrong.

This is the central problem with force fields. They always give you a number.

---

## Why should you care?

The force field is the most consequential choice in any classical MD simulation. It determines every accessible physical property: structural, mechanical, thermal, dynamical. A wrong potential gives you wrong RDFs, wrong diffusion coefficients, wrong elastic moduli. And unlike a wrong timestep or box size, you can't fix it by running longer or using a bigger system.

---

## The wrong intuition

"If a force field reproduces the lattice constant and cohesive energy, it's good for my system."

Those are necessary conditions, not sufficient ones. A potential fitted to equilibrium bulk properties can completely fail for defects, surfaces, grain boundaries, amorphous phases, or extreme temperatures. The validation set used to fit the potential may not overlap with your simulation conditions at all.

---

## The explanation

Force fields are built from terms that capture different physical contributions to the energy.

**Pair potentials.** The simplest case: energy depends only on the distance between atom pairs. Lennard-Jones is the classic — a repulsive r⁻¹² wall and an attractive r⁻⁶ van der Waals tail. Works well for noble gases and as a baseline. Fails for anything with directional bonding.

**Many-body potentials.** For metals, bonding strength depends on local coordination — an atom in a bulk environment bonds differently than one on a surface. EAM (embedded atom method) captures this with an embedding function that depends on the local electron density. Essential for metals. A pure pair potential for copper or iron is physically wrong.

**Covalent potentials.** Carbon chemistry requires bond-order terms — the interaction between two atoms changes depending on their local environment and hybridization. Tersoff and AIREBO do this. AIREBO extends Tersoff with a Lennard-Jones term for non-bonded interactions and a torsion term. It's the standard for carbon and hydrocarbons in LAMMPS. Its known failure modes: unphysical behavior at high strain (the LJ cutoff artifact), and it doesn't handle bond breaking/forming between carbon and non-C/H elements.

**Reactive potentials.** ReaxFF allows bonds to break and form dynamically by using continuously varying bond orders. Much more expensive than AIREBO. Required for combustion, oxidation, catalysis. The parameterization is system-specific and must be chosen carefully.

---

## How a classical force field is built

OPLS, AMBER, CHARMM — these are the workhorses for biomolecules and organic chemistry. They're built on a different philosophy than EAM or AIREBO. Instead of one unified potential, they decompose the total energy into physically motivated contributions:

$$
U_\text{total} = U_\text{bond} + U_\text{angle} + U_\text{dihedral} + U_\text{vdW} + U_\text{elec}
$$

Each term handles a different part of the chemistry. Let's go through them.

**Bonds** are modeled as harmonic springs between covalently bonded pairs:

$$
U_\text{bond} = \sum_\text{bonds} k_b \left(r - r_0\right)^2
$$

$r_0$ is the equilibrium bond length, $k_b$ is the spring constant. That's it. You're saying a C-C bond is a spring. It works near equilibrium. It cannot break — the harmonic well goes to infinity at both ends, so bond dissociation is physically impossible with this term.

**Angles** work the same way but for three-body bond angles:

$$
U_\text{angle} = \sum_\text{angles} k_\theta \left(\theta - \theta_0\right)^2
$$

**Dihedrals** are where it gets interesting. A dihedral (torsion) describes the energy as a function of rotation around a bond, felt by four atoms in sequence. The functional form is a Fourier series:

$$
U_\text{dihedral} = \sum_\text{dihedrals} \sum_n \frac{V_n}{2}\left[1 + \cos(n\phi - \delta)\right]
$$

$n$ is the periodicity (how many energy minima per full rotation), $\delta$ is a phase offset. This is what gives molecules their preferred conformations — gauche vs anti in a carbon chain, for example.

**Non-bonded interactions** cover every atom pair not connected by 1-2 or 1-3 bonds. Van der Waals via LJ, electrostatics via Coulomb:

$$
U_\text{vdW} = 4\varepsilon_{ij}\left[\left(\frac{\sigma_{ij}}{r_{ij}}\right)^{12} - \left(\frac{\sigma_{ij}}{r_{ij}}\right)^{6}\right], \qquad U_\text{elec} = \frac{q_i q_j}{4\pi\varepsilon_0 r_{ij}}
$$

The partial charges $q_i$ are not integer charges. They're fractional values derived from quantum chemistry calculations (usually RESP fitting to the electrostatic potential of the isolated molecule). Getting these charges right is often the hardest part of parameterizing a new molecule.

**Parameterization: where the numbers come from.**

You have a functional form. Now you need $k_b$, $r_0$, $k_\theta$, $\theta_0$, $V_n$, $\varepsilon_{ij}$, $\sigma_{ij}$, and $q_i$ for every atom type in your system.

The standard workflow is:

1. Run high-level QM calculations (typically MP2 or B3LYP) on a small model molecule.
2. Fit $r_0$ and $\theta_0$ to the QM-optimized geometry.
3. Fit $k_b$ and $k_\theta$ to the QM vibrational frequencies (Hessian).
4. Fit dihedral terms $V_n$ by scanning the torsional energy profile in QM and matching it.
5. Fit partial charges $q_i$ via RESP to the QM electrostatic potential.
6. Fit LJ parameters $\varepsilon$ and $\sigma$ to experimental liquid densities and heats of vaporization.

That last step is important. LJ parameters in OPLS are fitted to condensed-phase thermodynamic data, not gas-phase QM. This is why OPLS gives good liquid densities but the parameters aren't transferable to every situation.

The result is a lookup table: atom types (C_sp3, N_amide, O_carbonyl, ...) with their associated parameters. OPLS-AA has hundreds of atom types covering most organic chemistry. When you encounter a molecule outside those types, you either find a close analogue or parameterize from scratch.

---

## The math — non-classical potentials

Ready? Two more examples for the potentials that don't fit the OPLS mold.

**Lennard-Jones (pair potential)**

$$
U_\text{LJ}(r_{ij}) = 4\varepsilon \left[ \left(\frac{\sigma}{r_{ij}}\right)^{12} - \left(\frac{\sigma}{r_{ij}}\right)^{6} \right]
$$

Two parameters. That's it. $\varepsilon$ is the well depth (how strongly the pair attracts), $\sigma$ is the diameter where the potential crosses zero. The $r^{-12}$ term is the Pauli repulsion wall. The $r^{-6}$ term is the London dispersion attraction. Force is $F_{ij} = -\nabla U$, computed analytically at every step.

The function is smooth, cheap to evaluate, and physically motivated for closed-shell systems. It has zero transferability to systems with directional bonding.

**EAM (many-body potential for metals)**

$$
U = \sum_i F_i\!\left(\bar{\rho}_i\right) + \frac{1}{2}\sum_{i \neq j} \phi(r_{ij})
$$

where $\bar{\rho}_i = \sum_{j \neq i} \rho(r_{ij})$ is the local electron density at atom $i$, summed over neighbors. $F_i$ is the embedding energy — how much energy it costs to place atom $i$ into that electron density. $\phi(r_{ij})$ is a short-range pair repulsion.

The embedding function $F_i$ is what makes EAM many-body. That sum over neighbors means the bond between two atoms depends on their local environment — a surface atom bonds differently than a bulk atom. That's physically real. LJ misses it entirely.

The forces are still just $-\nabla U$, but now each force depends on the positions of all neighbors within cutoff, not just the pair.

---

## Reality check

In LAMMPS, a typical AIREBO setup for graphene:

```
pair_style airebo 3.0 1 1
pair_coeff * * CH.airebo C
```

The `3.0` scales the LJ cutoff (set to 0 to disable the LJ term, which is sometimes done to avoid the high-strain artifact). The `1 1` flags enable the REBO and torsion terms.

For a Lennard-Jones simulation:

```
pair_style lj/cut 10.0
pair_coeff 1 1 0.01 3.4    # epsilon (eV), sigma (Å)
pair_modify shift yes tail yes
```

Always check the original paper for the potential's validation set. If your simulation conditions (temperature, strain, chemistry) are outside that set, your results need careful interpretation.

!!! warning "Common Mistake"
    Using a potential parameterized for one crystal phase to simulate another. EAM potentials fitted to FCC copper can give qualitatively wrong results for high-pressure BCC phases. AIREBO fitted for graphene doesn't transfer to carbyne or fullerenes without re-validation.

!!! note "Simulation Note"
    Machine-learned interatomic potentials (GAP, DeePMD, MACE) trained on DFT data can achieve near-DFT accuracy at a fraction of the cost. If your system has known AIREBO failure modes, an MLIP is worth the training cost.

---

## Takeaway

The force field defines the physics your simulation can access. Know its parameterization domain, know its failure modes, and never trust a number from a potential you haven't validated for your specific conditions.
