# Kohn-Sham Orbitals

> **Definition:** The set of single-particle wavefunctions $\psi_{n\mathbf{k}}(\mathbf{r})$ that are solutions of the Kohn-Sham single-particle equations for a fictitious non-interacting electron system. Their only rigorous physical content is that their squared moduli sum to the true ground-state electron density. They are not the true many-electron wavefunctions, and their eigenvalues are not formally the ionization or excitation energies of the real system (with the exception of the highest occupied orbital by Janak's theorem).

Kohn-Sham orbitals are a mathematical trick that happens to work. You replace the impossible N-electron problem with N one-electron problems, solve those instead, and extract the electron density from the solutions. The orbitals themselves are fictional — they describe electrons that don't interact with each other, which is not your system. But the density they produce is real. That is the deal Kohn-Sham makes.

---

## Hook

When you open a VASP `OUTCAR` and see a list of Kohn-Sham eigenvalues — those are not electron energies. They look like electron energies. They're used as electron energies in band structure plots. But formally they don't have that meaning. And the band gap you read off directly from them is systematically wrong.

This is one of the most consequential things to understand about DFT, and it gets glossed over constantly.

---

## Why should you care?

If you plot a band structure from VASP or QE, you are plotting Kohn-Sham eigenvalues $\varepsilon_{n\mathbf{k}}$. The gap between the highest occupied and lowest unoccupied eigenvalue is not the fundamental gap of your material. It is the Kohn-Sham gap, which underestimates the real gap systematically due to the derivative discontinuity of the exact XC functional. For silicon, PBE gives ~0.6 eV; experiment is 1.17 eV. If you report the Kohn-Sham gap as the band gap without qualification, that is a mistake.

---

## The wrong intuition

"The Kohn-Sham orbitals are approximations to the real electron wavefunctions."

They are not approximations to anything. They are solutions of a fictitious Hamiltonian for non-interacting electrons in an effective potential. The real electrons are interacting; the Kohn-Sham electrons are not. The orbitals solve different equations. What the Kohn-Sham orbitals do reproduce exactly (in principle, with the exact XC functional) is the ground-state electron density. That is their only guaranteed connection to reality.

---

## The explanation

**The Kohn-Sham mapping.** Kohn and Sham's insight was to replace the interacting N-electron system with a non-interacting system that has the same ground-state density. The non-interacting system has an effective potential $V_{KS}(\mathbf{r})$ chosen so that its density matches the true density. The Kohn-Sham equations for each orbital are:

$$
\left[ -\frac{\hbar^2}{2m}\nabla^2 + V_{KS}(\mathbf{r}) \right] \psi_{n\mathbf{k}}(\mathbf{r}) = \varepsilon_{n\mathbf{k}}\, \psi_{n\mathbf{k}}(\mathbf{r})
$$

These look like Schrödinger equations for single electrons. Each orbital $\psi_{n\mathbf{k}}$ and its eigenvalue $\varepsilon_{n\mathbf{k}}$ come out of this. Assemble the density as $\rho(\mathbf{r}) = \sum_{n\mathbf{k}} f_{n\mathbf{k}} |\psi_{n\mathbf{k}}|^2$. Done.

**What the eigenvalues mean and don't mean.** The eigenvalue $\varepsilon_{n\mathbf{k}}$ is the energy of the fictitious non-interacting electron in orbital $n$ at k-point $\mathbf{k}$. For the highest occupied orbital, Janak's theorem gives it physical meaning: $\varepsilon_\text{HOMO} = \partial E / \partial f_\text{HOMO}$, which connects to the ionization potential in the exact DFT limit. For all other orbitals, no such theorem applies. The eigenvalues are Lagrange multipliers that enforce orbital orthogonality in the variational problem. Useful for qualitative analysis — comparing orbital characters, identifying bonding vs antibonding states — but not quantitatively accurate excitation energies.

**The band gap problem.** The true fundamental gap is the difference between the ionization energy (remove one electron) and the electron affinity (add one electron). The Kohn-Sham gap (LUMO minus HOMO eigenvalue) is not this quantity. They differ by the derivative discontinuity of the exact $E_{xc}$ — a correction that all standard LDA and GGA functionals miss entirely. Hybrid functionals (HSE06) include a fraction of exact exchange that partially corrects this. GW many-body perturbation theory computes true quasiparticle energies and gets the gap right.

---

## Reality check

In VASP, the Kohn-Sham eigenvalues are the numbers in `EIGENVAL` and `PROCAR`. The `OUTCAR` line `E-fermi` is the Kohn-Sham Fermi energy. The band gap printed in the output is the Kohn-Sham gap — fine for metals (it tells you whether bands cross the Fermi level) but underestimated for semiconductors and insulators.

If you need a quantitative band gap:

- Use `LHFCALC = .TRUE.` with HSE06 in VASP for most semiconductors.
- Use `GW0` or `G0W0` for higher accuracy (much more expensive).
- For a quick check, PBE gap + ~0.5–1 eV gives the right ballpark for many common semiconductors, but it is not a substitute for the proper calculation.

!!! warning "Common Mistake"
    Reporting the PBE Kohn-Sham gap as the band gap without noting the systematic underestimation. In peer review, this will be flagged. It is not a minor correction for semiconductors — it is a factor of two or more in some materials.

---

## Takeaway

Kohn-Sham orbitals are a fictitious construction whose only guaranteed physical content is the electron density they produce. Their eigenvalues are not electron energies. Use them for qualitative orbital analysis and DOS, but not for quantitative excitation energies or band gaps without a correction.
