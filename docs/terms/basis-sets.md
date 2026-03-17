# Basis Sets

> **Definition:** The set of mathematical functions used to expand Kohn-Sham wavefunctions in a DFT calculation. In periodic codes (QE, VASP), the standard basis is plane waves, controlled by a single kinetic energy cutoff. In molecular or mixed codes (CP2K, FHI-aims, ORCA), localized atomic orbitals (Gaussian-type or numerical) are used instead; these require choosing basis functions per element and are susceptible to basis-set superposition error (BSSE) in energy differences. Plane-wave bases are systematically improvable by raising the cutoff and are free of BSSE.

A basis set is the vocabulary your code uses to describe wavefunctions. The wavefunction is a continuous function in space; the computer needs to represent it as a finite list of numbers. The basis set is the set of "shapes" you allow — the wavefunction is expressed as a weighted sum of those shapes. Choose the right vocabulary and you can describe anything. Choose the wrong one and you're stuck trying to describe a curve using only straight lines.

---

## Hook

You open an ORCA input file and see `def2-TZVP`. You open a CP2K input and see `DZVP-MOLOPT-SR-GTH`. You use QE and just set `ecutwfc = 60`. All three are basis sets. They are completely different in philosophy. And your inability to transfer numbers between codes is not a bug — it is a direct consequence of them using fundamentally different bases.

---

## Why should you care?

The basis set controls the accuracy of your wavefunction representation. Use a basis that is too small (too few functions, too low a cutoff) and your wavefunction is wrong, your forces are wrong, your energies are wrong. But unlike a physical approximation (the XC functional), basis set error is purely numerical and goes away systematically as you increase the basis. This means you can always test for it, and you always should.

---

## The wrong intuition

"A larger basis set is always better, so I should always use the biggest one available."

For plane-wave codes, yes — higher `ecutwfc` is always more accurate, at higher cost. For localized basis codes, "bigger" is more complicated. Diffuse basis functions that are important for anions or excited states can cause numerical linear dependence and worsen rather than improve convergence. And comparing energies between different basis types is meaningless — the absolute energies live on completely different scales.

---

## The explanation

**What a basis set does.** You want to solve for the Kohn-Sham orbital $\psi_{n\mathbf{k}}(\mathbf{r})$. Instead of storing the value of $\psi$ at every point in space (infinite information), you expand it as:

$$
\psi_{n\mathbf{k}}(\mathbf{r}) = \sum_\mu c_{n\mathbf{k},\mu}\, \phi_\mu(\mathbf{r})
$$

where $\{\phi_\mu\}$ is the basis set and $\{c_{n\mathbf{k},\mu}\}$ are coefficients. The DFT problem becomes finding the coefficients. The quality of the answer depends on whether the basis can represent the true wavefunction well.

**Plane waves.** For a periodic solid, the natural basis is plane waves: $\phi_\mathbf{G}(\mathbf{r}) = e^{i(\mathbf{k}+\mathbf{G})\cdot\mathbf{r}}$. Every reciprocal lattice vector $\mathbf{G}$ contributes one basis function. The cutoff `ecutwfc` selects all $\mathbf{G}$ with $\hbar^2|\mathbf{k}+\mathbf{G}|^2/2m < E_\text{cut}$. Advantages: complete and unbiased (no atom-centered prejudice), systematically improvable with one parameter, free of BSSE. Disadvantage: requires pseudopotentials or PAW to avoid needing enormous cutoffs for core electrons.

**Gaussian-type orbitals (GTO).** Centered on atoms, shaped like atomic orbitals: $\phi(\mathbf{r}) = r^l e^{-\alpha r^2} Y_l^m(\hat{r})$. The exponents $\alpha$ and the number of functions per angular momentum channel define the basis. Standard naming convention: STO-3G (minimal, one function per occupied orbital), 6-31G (split valence, two sizes of functions), def2-TZVP (triple-zeta valence plus polarization). Standard in molecular codes (Gaussian, ORCA, PySCF). Natural for molecules; awkward for solids due to periodicity complications.

**Numerical atomic orbitals (NAO).** Similar idea to GTO but the radial part is a numerical tabulation rather than a Gaussian function. Used in FHI-aims, CP2K, SIESTA, OpenMX. More compact than GTO for the same accuracy; no analytic integral formulas so all integrals must be evaluated numerically.

**Basis set superposition error (BSSE).** In localized basis codes, when two fragments A and B come together to form a complex AB, fragment A partially borrows basis functions from fragment B's atoms to improve its own wavefunction description. This artificially lowers the energy of the complex and overestimates the binding energy. The counterpoise correction (Boys-Bernardi) estimates and subtracts this error. Plane-wave bases have no BSSE because the basis does not depend on atomic positions.

---

## Reality check

In QE — plane waves:

```
&SYSTEM
  ecutwfc = 60    ! Ry — wavefunction cutoff
  ecutrho = 480   ! Ry — charge density cutoff (8x for USPP)
/
```

In ORCA — Gaussian basis, triple-zeta quality:

```
! B3LYP def2-TZVP
```

In CP2K — mixed Gaussian/plane-wave (GPW) scheme: localized basis for wavefunctions, plane waves for the charge density. Best of both worlds for large periodic systems with molecules.

For plane-wave codes: run the convergence test (see the Convergence Testing deep dive). For localized basis codes: the community has established standard basis sets per element for each accuracy level — use the recommended basis for the property you're computing (geometry: TZV2P; energetics: TZVP or larger; excited states: aug-cc-pVTZ or similar).

!!! warning "Common Mistake"
    Comparing total energies between calculations with different basis sets, or between a plane-wave code and a localized-basis code. The absolute total energy depends entirely on the basis — only energy differences within the same basis and code are meaningful.

---

## Takeaway

A basis set is the set of functions used to represent wavefunctions numerically. Plane waves (periodic codes) are controlled by one cutoff and are free of BSSE. Localized bases (molecular codes) require per-element choices and have BSSE. Both converge to the same physics in the complete basis limit — but you have to test for that convergence yourself.
