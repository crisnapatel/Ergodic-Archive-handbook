# Reciprocal Lattice

> **Definition:** The Fourier-dual of the real-space crystal lattice, defined by the set of wavevectors $\mathbf{G}$ satisfying $e^{i\mathbf{G}\cdot\mathbf{R}} = 1$ for all real-space lattice vectors $\mathbf{R}$. The first Brillouin zone is the Wigner-Seitz cell of the reciprocal lattice and is the domain over which k-point sampling is performed. Plane waves with wavevectors $\mathbf{G}$ form the natural basis for expanding periodic wavefunctions; the reciprocal lattice vectors define the discrete Fourier frequencies used in plane-wave DFT.

The reciprocal lattice is what you get when you Fourier-transform a crystal. Real space has atoms repeating on a lattice. Reciprocal space has a different lattice that encodes those periodicities as frequencies. Everything periodic in real space — the charge density, the wavefunctions, the potential — lives naturally in reciprocal space. Plane-wave DFT is done almost entirely there.

---

## Hook

You set `ecutwfc = 60 Ry` in QE. What does that number mean geometrically? It means you're including all plane waves $e^{i\mathbf{G}\cdot\mathbf{r}}$ whose wavevector $\mathbf{G}$ has kinetic energy $\hbar^2 G^2 / 2m < 60$ Ry. That is a sphere in reciprocal space. Everything inside the sphere is in your basis. Everything outside is ignored. To understand why this works, you need to understand the reciprocal lattice.

---

## Why should you care?

Band structures are plotted along paths through the reciprocal lattice. K-point grids live in the reciprocal lattice. The plane-wave basis set is indexed by reciprocal lattice vectors. The charge density and Hartree potential are evaluated in reciprocal space. If you work with periodic DFT at all, you are constantly working in reciprocal space without necessarily knowing it.

---

## The wrong intuition

"The reciprocal lattice is just a mathematical abstraction with no physical meaning."

Wrong. The reciprocal lattice has direct physical observables. The positions of Bragg peaks in X-ray diffraction are reciprocal lattice vectors. The Brillouin zone boundaries are where electron wavefunctions Bragg-scatter off the lattice and open band gaps. The reciprocal lattice is the natural space for any wave phenomenon in a periodic system.

---

## The explanation

**Building the reciprocal lattice.** Take a real-space lattice with primitive vectors $\mathbf{a}_1, \mathbf{a}_2, \mathbf{a}_3$. The reciprocal lattice primitive vectors $\mathbf{b}_1, \mathbf{b}_2, \mathbf{b}_3$ are defined by:

$$
\mathbf{b}_i \cdot \mathbf{a}_j = 2\pi \delta_{ij}
$$

For a cubic lattice with spacing $a$: $\mathbf{a}_1 = a\hat{x}$, so $\mathbf{b}_1 = (2\pi/a)\hat{x}$. The reciprocal lattice is also cubic, with spacing $2\pi/a$. Physically: a shorter real-space period means a longer reciprocal-space period, and vice versa.

For an FCC lattice, the reciprocal lattice is BCC. For a BCC lattice, the reciprocal is FCC. Every real-space crystal structure has a corresponding reciprocal-space structure.

**Why the condition $e^{i\mathbf{G}\cdot\mathbf{R}} = 1$ matters.** A function with the periodicity of the lattice must satisfy $f(\mathbf{r} + \mathbf{R}) = f(\mathbf{r})$ for all lattice vectors $\mathbf{R}$. If you expand that function in plane waves $e^{i\mathbf{G}\cdot\mathbf{r}}$, only waves satisfying $e^{i\mathbf{G}\cdot\mathbf{R}} = 1$ can appear — otherwise they would break the periodicity. Those are exactly the reciprocal lattice vectors. So any periodic quantity (charge density, KS potential) is a Fourier series over $\mathbf{G}$ vectors of the reciprocal lattice.

**The Brillouin zone.** The first Brillouin zone (BZ) is the Wigner-Seitz cell of the reciprocal lattice — the region of reciprocal space closer to the origin than to any other reciprocal lattice point. It is the irreducible domain for k-point sampling: every crystal momentum $\mathbf{k}$ can be mapped back into the first BZ by adding a reciprocal lattice vector. For a cubic lattice the first BZ is a cube from $-\pi/a$ to $\pi/a$ in each direction.

**Bloch's theorem and the plane-wave basis.** By Bloch's theorem, Kohn-Sham orbitals take the form $\psi_{n\mathbf{k}}(\mathbf{r}) = e^{i\mathbf{k}\cdot\mathbf{r}} u_{n\mathbf{k}}(\mathbf{r})$, where $u_{n\mathbf{k}}$ has the lattice periodicity. Expanding $u_{n\mathbf{k}}$ in its Fourier series:

$$
\psi_{n\mathbf{k}}(\mathbf{r}) = \sum_\mathbf{G} c_{n\mathbf{k}}(\mathbf{G})\, e^{i(\mathbf{k}+\mathbf{G})\cdot\mathbf{r}}
$$

The plane-wave basis is indexed by $\mathbf{G}$ vectors. The cutoff `ecutwfc` truncates this sum to all $\mathbf{G}$ satisfying $\hbar^2|\mathbf{k}+\mathbf{G}|^2/2m < E_\text{cut}$.

---

## Reality check

In QE, the code automatically generates the reciprocal lattice from your `CELL_PARAMETERS` block. The `ibrav` parameter specifies the Bravais lattice type, and QE uses that to construct $\mathbf{b}_1, \mathbf{b}_2, \mathbf{b}_3$ internally. You never set the reciprocal lattice manually.

The k-path for a band structure is specified in reciprocal lattice coordinates. For example, in a cubic system:

```
K_POINTS crystal_b
4
  0.0 0.0 0.0  30   ! Gamma
  0.5 0.0 0.0  30   ! X
  0.5 0.5 0.0  30   ! M
  0.0 0.0 0.0  1    ! Gamma
```

The coordinates `0.5 0.0 0.0` are in units of $\mathbf{b}_1, \mathbf{b}_2, \mathbf{b}_3$. The high-symmetry point labels ($\Gamma$, X, M, K, L...) are conventional names for specific reciprocal lattice points whose locations depend on the lattice type.

To find the correct k-path for any crystal structure, use the SeeK-path tool or the Bilbao Crystallographic Server.

!!! note "Key Insight"
    The real-space charge density grid (controlled by `ecutrho`) and the reciprocal-space $\mathbf{G}$ vector set are directly related via FFT. A denser real-space grid corresponds to a larger sphere of $\mathbf{G}$ vectors in reciprocal space. This is why `ecutrho` controls the charge density accuracy: more $\mathbf{G}$ vectors means a more complete representation of $\rho(\mathbf{r})$ in Fourier space.

---

## Takeaway

The reciprocal lattice is the Fourier dual of the crystal lattice. Plane-wave DFT lives in it — the basis set, the BZ, the k-point grid, and all periodic quantities are naturally expressed as sums over reciprocal lattice vectors.
