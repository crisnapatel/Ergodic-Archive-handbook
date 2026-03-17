# Brillouin Zone & k-points

> **Definition:** Numerical integration of k-dependent quantities over the first Brillouin zone of a periodic crystal, required by Bloch's theorem. Monkhorst-Pack grids provide systematic uniform sampling; denser grids improve accuracy at higher cost. For metallic systems, partial occupancies near the Fermi level require smearing in addition to dense k-point meshes.

In a periodic crystal, every Kohn-Sham wavefunction carries a wavevector $\mathbf{k}$. To get the total energy you have to integrate over all $\mathbf{k}$ in the Brillouin zone. That integral is infinite in principle. In practice you sample it on a finite grid. The k-point mesh is your quadrature scheme for that integral — and like any quadrature, if the grid is too coarse, your answer is wrong.

---

## Hook

You compute the total energy of a metal with a 2×2×2 k-point grid. It converges. You compute the same metal with a 6×6×6 grid. The energy shifts by 50 meV/atom. Your adsorption energy differences from the coarse calculation are meaningless.

This is the most common DFT mistake made by people who are otherwise doing everything right.

---

## Why should you care?

The k-point grid directly affects total energies, forces, stress, band structure, and density of states. For metals it affects whether the Fermi level is even correctly resolved. For phonon calculations and elastic constants — which converge slower than total energy — an under-converged k-mesh is a systematic error that compounds through derived properties.

---

## The wrong intuition

"I converged the total energy with respect to k-points, so I'm done."

Total energy is the easiest thing to converge. Forces and stress are harder. Elastic constants are harder still. A mesh that gives energy differences to 1 meV/atom accuracy may give elastic constants that are off by 10%. Always converge the property you actually care about, not just the total energy.

---

## The explanation

**Bloch's theorem.** In a periodic potential, the Kohn-Sham wavefunctions take the form $\psi_{n\mathbf{k}}(\mathbf{r}) = e^{i\mathbf{k}\cdot\mathbf{r}} u_{n\mathbf{k}}(\mathbf{r})$, where $u_{n\mathbf{k}}$ has the periodicity of the lattice. The index $\mathbf{k}$ runs over the first Brillouin zone. The total energy is:

$$
E = \sum_n \int_\text{BZ} f_{n\mathbf{k}} \, \varepsilon_{n\mathbf{k}} \, \frac{d^3k}{(2\pi)^3}
$$

where $f_{n\mathbf{k}}$ is the occupation and $\varepsilon_{n\mathbf{k}}$ is the Kohn-Sham eigenvalue for band $n$ at point $\mathbf{k}$. This integral is approximated by a sum over a discrete k-point set with weights $w_\mathbf{k}$.

**Monkhorst-Pack grids.** A regular $N_1 \times N_2 \times N_3$ grid shifted off or including $\Gamma$. For insulators and semiconductors, convergence is smooth — a modest mesh like 4×4×4 is often sufficient. For metals, the Fermi surface cuts through the Brillouin zone and the integrand has a discontinuity. This requires dense meshes and smearing.

**Smearing.** Near the Fermi level in a metal, band occupations change sharply from 1 to 0. On a coarse k-mesh, this step function is poorly sampled and causes numerical noise. Smearing methods (Fermi-Dirac, Methfessel-Paxton, Marzari-Vanderbilt cold smearing) replace the step with a smooth function parameterized by a smearing width $\sigma$. Broader smearing stabilizes convergence but introduces a broadening error. The standard practice: use Marzari-Vanderbilt with $\sigma$ = 0.01–0.02 Ry in QE, then check that the entropy term (printed as `smearing contrib.`) is small relative to your energy differences.

**Supercells and k-folding.** When you use a supercell (for defects, surfaces, or MD), the Brillouin zone shrinks in proportion to the supercell size. A 4×4×4 supercell of a simple cubic unit cell has a BZ that is $4\times4\times4$ smaller — so a single $\Gamma$-point calculation of the supercell is equivalent to a 4×4×4 k-mesh of the primitive cell. This is why large supercell DFT calculations often use only the $\Gamma$ point.

---

## Reality check

In QE, a Monkhorst-Pack grid:

```
K_POINTS automatic
  6 6 6  0 0 0    ! 6x6x6 grid, Gamma-centered (shift = 0 0 0)
```

For a metal, add smearing:

```
&SYSTEM
  occupations = 'smearing'
  smearing    = 'mv'
  degauss     = 0.02
/
```

Convergence test procedure: run the same calculation at 2×2×2, 4×4×4, 6×6×6, 8×8×8 and plot total energy vs. k-point density. The grid where the energy change drops below ~2 meV/atom is your converged mesh. Rerun the test for the property you care about (force, stress, etc.) if it's different from total energy.

!!! warning "Common Mistake"
    Using a k-mesh converged for total energy but not for forces or elastic constants, which converge more slowly. Also: using the same k-mesh for a 1×1×1 unit cell and a 3×3×1 slab supercell without adjusting — the slab needs a denser in-plane sampling relative to the primitive cell.

---

## Takeaway

The k-point mesh is your integration grid. Converge it for the property you're computing, not just for the total energy, and always use smearing for metals.
