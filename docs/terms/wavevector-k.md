# Wavevector k (Crystal Momentum)

> **Definition:** The quantum number labeling Bloch states in a periodic crystal, confined to the first Brillouin zone. $\mathbf{k}$ is not physical momentum but crystal momentum: it encodes the translational symmetry of the lattice, not the true momentum of the electron. The dispersion relation $E_n(\mathbf{k})$ defines the band structure. In k-point sampling, the integral of all k-dependent quantities over the Brillouin zone is approximated by a discrete sum over a finite k-point grid.

Every electron in a crystal carries a label $\mathbf{k}$. It looks like momentum. It behaves like momentum in scattering calculations. But it is not momentum. It is a symmetry label — a way of tracking how a wavefunction transforms under translations of the lattice. Understanding what $\mathbf{k}$ actually is makes band structures and k-point sampling make sense immediately.

---

## Hook

Why does a band structure plot show energy vs $\mathbf{k}$? What is $\mathbf{k}$, physically? Why does it only live in the Brillouin zone? Why do we say "k-point mesh" instead of just "sampling points"? These questions have crisp answers that most DFT users have never been given.

---

## Why should you care?

The number and placement of k-points controls the accuracy of every DFT calculation for a periodic solid. Too few k-points and your total energy, forces, and density of states are wrong. Metallic systems need dense k-meshes because the electronic structure changes rapidly near the Fermi surface. Insulators can get away with coarser meshes because the bands are smooth. You can only reason about this if you understand what $\mathbf{k}$ is and why the BZ is its natural domain.

---

## The wrong intuition

"$\mathbf{k}$ is the momentum of the electron, and $E(\mathbf{k})$ is the kinetic energy."

For a free electron in vacuum, $\mathbf{p} = \hbar\mathbf{k}$ and $E = \hbar^2k^2/2m$. That is true. But in a crystal, the electron is not free. It scatters off the periodic potential of the lattice. The resulting wavefunction is not a pure plane wave but a Bloch state, and $\hbar\mathbf{k}$ is not the expectation value of momentum. Crystal momentum is conserved in electron-phonon and electron-photon scattering only modulo a reciprocal lattice vector $\mathbf{G}$ — that "modulo $\mathbf{G}$" is the signature that this is not real momentum.

---

## The explanation

**From periodicity to quantum numbers.** In a periodic crystal, the Hamiltonian commutes with lattice translations: $H(\mathbf{r} + \mathbf{R}) = H(\mathbf{r})$ for any lattice vector $\mathbf{R}$. When an operator commutes with a symmetry, the eigenstates can be labeled by that symmetry. The label for translation symmetry is $\mathbf{k}$.

Concretely, Bloch's theorem says every eigenstate satisfies:

$$
\psi_{n\mathbf{k}}(\mathbf{r} + \mathbf{R}) = e^{i\mathbf{k}\cdot\mathbf{R}} \psi_{n\mathbf{k}}(\mathbf{r})
$$

The wavefunction picks up a phase $e^{i\mathbf{k}\cdot\mathbf{R}}$ under translation by $\mathbf{R}$. That phase is determined by $\mathbf{k}$. Two states with the same $\mathbf{k}$ but different band index $n$ pick up the same phase under translation — they transform the same way under the lattice symmetry. That is what $\mathbf{k}$ labels.

**Why $\mathbf{k}$ lives in the first BZ.** Adding a reciprocal lattice vector $\mathbf{G}$ to $\mathbf{k}$ gives the same phase factor:

$$
e^{i(\mathbf{k}+\mathbf{G})\cdot\mathbf{R}} = e^{i\mathbf{k}\cdot\mathbf{R}} \cdot e^{i\mathbf{G}\cdot\mathbf{R}} = e^{i\mathbf{k}\cdot\mathbf{R}} \cdot 1
$$

because $e^{i\mathbf{G}\cdot\mathbf{R}} = 1$ by definition of the reciprocal lattice. So $\mathbf{k}$ and $\mathbf{k} + \mathbf{G}$ label physically identical states. There is no reason to sample beyond the first BZ. The BZ is the irreducible domain.

**Band structure.** For each $\mathbf{k}$ in the BZ, solving the Kohn-Sham equations gives a discrete set of eigenvalues $\varepsilon_{1\mathbf{k}}, \varepsilon_{2\mathbf{k}}, \varepsilon_{3\mathbf{k}}, \ldots$ for band indices $n = 1, 2, 3, \ldots$. Plotting $\varepsilon_n(\mathbf{k})$ along a path through the BZ gives the band structure. The gap between occupied and unoccupied bands at all $\mathbf{k}$ is the (Kohn-Sham) band gap.

**K-point sampling.** The total energy requires integrating over all $\mathbf{k}$ in the BZ. With a finite k-mesh, you approximate:

$$
\frac{1}{V_{BZ}} \int_{BZ} f(\mathbf{k})\, d^3k \approx \sum_i w_i f(\mathbf{k}_i)
$$

where $w_i$ are weights summing to 1. Denser mesh means more $\mathbf{k}_i$ points and more accurate integration. For metals, $f(\mathbf{k})$ has a sharp feature at the Fermi surface — hence the need for dense meshes plus smearing.

---

## Reality check

In QE, high-symmetry k-point labels for common crystal structures follow standard conventions. For FCC (e.g., Al, Cu, Ni):

| Label | Coordinates (crystal) | Name |
|---|---|---|
| $\Gamma$ | 0, 0, 0 | Zone center |
| X | 0.5, 0.5, 0 | Face center |
| L | 0.5, 0.5, 0.5 | Edge center |
| K | 0.375, 0.375, 0.75 | Near edge |

For an `automatic` k-mesh in QE (`K_POINTS automatic`), the three integers define the grid density along $\mathbf{b}_1, \mathbf{b}_2, \mathbf{b}_3$. For a hexagonal system, you often want more points along the in-plane directions than along $c$.

!!! note "Key Insight"
    For a supercell N times larger in one direction, the BZ shrinks by a factor of N in that direction. A 1×1×1 k-point grid on a 4×4×4 supercell is equivalent to a 4×4×4 k-mesh on the primitive cell. This is why large supercell calculations can use Gamma-only k-sampling without losing much accuracy — the supercell k-folding provides the sampling implicitly.

---

## Takeaway

$\mathbf{k}$ is a symmetry label for how a Bloch state transforms under lattice translation, not physical momentum. It lives in the first Brillouin zone because adding any reciprocal lattice vector gives an identical label. The k-point mesh is the numerical quadrature for integrals over the BZ.
