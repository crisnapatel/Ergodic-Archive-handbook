# Kohn-Sham Equations & SCF Cycle

> **Definition:** The central reformulation of the interacting many-electron problem in DFT (Kohn-Sham, 1965), which maps it onto a set of non-interacting electrons moving in an effective potential that depends on the electron density. The equations are solved self-consistently (SCF cycle): guess the density, compute the effective potential, solve the single-particle equations, update the density, repeat until convergence.

Every DFT calculation you run is solving the same loop: guess the electrons' arrangement, figure out what potential that creates, solve for how electrons move in that potential, update the arrangement, repeat until nothing changes. That's the SCF cycle. The Kohn-Sham equations are the loop.

---

## Hook

The many-body Schrödinger equation for N electrons is unsolvable exactly for any real material. Even helium with two electrons is hard. Carbon with six is worse. Iron with twenty-six is out of the question.

Kohn and Sham's 1965 idea was: what if you replace the interacting electron problem with a non-interacting one that has the same ground-state density? The non-interacting problem is solvable. The density it produces is exact — provided you have the exact exchange-correlation functional. You don't. But good approximations exist. That's the deal.

---

## Why should you care?

Because the SCF cycle is what your QE or VASP run is actually doing at every ionic step. When the output says "convergence has been achieved" or prints the iteration count, that's the inner loop of the Kohn-Sham problem converging. Understanding it lets you diagnose convergence failures, choose the right settings, and know what the output numbers actually mean.

---

## The wrong intuition

"DFT gives you the exact ground-state energy."

It gives you the exact ground-state density — in principle, given the exact exchange-correlation functional. In practice, you're using an approximate functional (LDA, GGA, hybrid). The energy is exact for the approximate functional, not for the true physical system. The functional approximation is where most DFT error lives.

---

## The explanation

The Kohn-Sham effective potential has three parts:

\[
V_{\text{KS}}(\mathbf{r}) = V_{\text{ext}}(\mathbf{r}) + V_{\text{Hartree}}(\mathbf{r}) + V_{\text{xc}}(\mathbf{r})
\]

**V_ext** is the external potential from the nuclei. Fixed for a given geometry.

**V_Hartree** is the classical electrostatic potential of the electron density with itself. It depends on the current density n(r), so it must be updated each SCF cycle.

**V_xc** is the exchange-correlation potential — the functional derivative of E_xc with respect to n(r). This is where the approximation lives (LDA, GGA, hybrid).

The SCF cycle:

1. Start with an initial guess for n(r) (usually from superposition of atomic densities)
2. Compute V_KS from n(r)
3. Solve the Kohn-Sham single-particle equations to get orbitals ψ_i
4. Build a new density: n_new(r) = Σ_i |ψ_i(r)|²
5. Mix n_new with the old density (Pulay/Broyden mixing to prevent oscillations)
6. Check convergence: if ||n_new − n_old|| < threshold, done. Otherwise, go to step 2.

**Why mixing?** If you directly replace n with n_new at each step, the density oscillates and never converges — this is "charge sloshing," common for metals. Mixing algorithms dampen these oscillations by blending the new and old densities intelligently.

---

## Reality check

In QE, SCF convergence is controlled by:

```
conv_thr = 1.0e-8    ! threshold on energy change (Ry)
mixing_beta = 0.3    ! mixing parameter (0.1-0.7)
mixing_mode = 'plain'   ! or 'TF' (Thomas-Fermi) for metals
```

A lower `conv_thr` gives more accurate forces but more SCF iterations. For geometry optimization, `1e-8` Ry is standard. For a quick structure check, `1e-6` is fine. For phonons or NEB, you may need `1e-10`.

If SCF is not converging:
- Reduce `mixing_beta` (0.1–0.2 for metallic systems)
- Switch to `mixing_mode = 'TF'` or `'local-TF'` for metals
- Increase `electron_maxstep` (default 100 is often not enough for hard cases)
- Add smearing for metallic systems

In VASP the equivalent is `EDIFF` (convergence criterion) and `AMIX`/`BMIX` (mixing parameters).

!!! warning "Common Mistake"
    Using a loose `conv_thr` for geometry optimization or NEB calculations. Forces are derivatives of the energy, and a loosely converged SCF gives noisy forces. The ionic relaxation will oscillate or converge to the wrong geometry. A good rule: SCF threshold should be at least 100× smaller than the force threshold.

!!! note "Simulation Note"
    The number of SCF iterations per ionic step shows up in QE output as lines like `iteration #  1 ... `. For a well-behaved system with a good initial guess, convergence in 10–20 iterations is typical. More than 50 iterations per step usually means your system is metallic, your mixing parameters need adjustment, or the geometry is far from the ground state.

---

## Takeaway

The KS-SCF cycle maps the interacting electron problem onto a solvable non-interacting one, solved iteratively until the input and output densities agree. Convergence failures are diagnosed and fixed through mixing parameters and smearing, not by running longer.
