# Exchange-Correlation Functional

> **Definition:** The term in the Kohn-Sham energy functional that accounts for all quantum electron-electron interaction effects beyond classical Hartree repulsion: exchange (Pauli exclusion) and correlation. Must be approximated. Hierarchy: LDA (local density), GGA (adds density gradient; PBE, PBEsol), meta-GGA (adds kinetic energy density), hybrid (mixes exact exchange; HSE06), vdW-corrected (adds dispersion; vdW-DF2, DFT-D3, rev-vdW-DF2 / QE label `vdw-df2-b86r`).

The exchange-correlation functional is the part of DFT where we admit we don't know the exact answer and make our best approximation. Everything else in Kohn-Sham DFT is formally exact. This term is where the physics gets buried in approximations — and your entire result depends on how good those approximations are for your system.

---

## Hook

You calculate the band gap of silicon with PBE. You get ~0.6 eV. The experimental value is 1.17 eV. You're off by a factor of two.

You switch to HSE06. You get ~1.1 eV. That's close.

Same system, same geometry, same code. The only thing that changed was $E_{xc}$. That's how much it matters.

---

## Why should you care?

Functional choice determines band gaps, magnetic ordering, adsorption energies, reaction barriers, and whether van der Waals interactions are captured at all. There's no single functional that works for everything. Using PBE for a layered material where interlayer binding is purely dispersive gives you qualitatively wrong interlayer distances. Using LDA for a strongly correlated oxide gives you a metal where the experiment says insulator.

---

## The wrong intuition

"DFT gives the ground state energy, so it should give the right band gap."

No. The Kohn-Sham band gap (difference in eigenvalues) is not the true quasiparticle gap. It underestimates it systematically, a pathology known as the DFT band gap problem. It comes directly from the self-interaction error in the approximate $E_{xc}$: an electron interacts with the smeared-out charge density that includes itself, and the exchange term doesn't fully cancel this. Hybrid functionals reduce this error by mixing in a fraction of exact (Hartree-Fock) exchange.

---

## The explanation

The Kohn-Sham total energy is:

$$
E = T_s[\rho] + E_\text{Hartree}[\rho] + E_\text{ext}[\rho] + E_{xc}[\rho]
$$

The first three terms are handled exactly (kinetic energy of non-interacting electrons, classical electron-electron repulsion, external potential from nuclei). $E_{xc}[\rho]$ catches everything else: the quantum exchange interaction (Pauli exclusion keeps like-spin electrons apart) and correlation (electrons avoid each other beyond Pauli).

The exact $E_{xc}$ is unknown. The Jacob's ladder of approximations goes:

**LDA.** $E_{xc}$ depends only on the local electron density $\rho(\mathbf{r})$. Parameterized from exact results for the homogeneous electron gas. Overbinds, underestimates lattice constants. Still useful for metals where the electron density is relatively uniform.

**GGA.** Adds the density gradient $\nabla\rho(\mathbf{r})$. PBE is the standard; PBEsol is PBE re-optimized for solids. Better bond lengths and energies than LDA for most systems. Still underestimates band gaps. Does not capture van der Waals interactions.

**meta-GGA.** Also uses the kinetic energy density $\tau(\mathbf{r})$. SCAN is the most prominent. Better for main-group chemistry and some correlated systems. Computationally more expensive.

**Hybrid.** Mixes a fraction $\alpha$ of exact Hartree-Fock exchange into the GGA functional. HSE06 uses $\alpha = 0.25$ with a range-separation that makes it affordable for periodic systems. Dramatically better band gaps and reaction barriers. Roughly 10x more expensive than PBE.

**vdW-corrected.** GGA with dispersion added either empirically (DFT-D3 adds $C_6/r^6$ pair corrections) or via a non-local correlation kernel (vdW-DF2, rev-vdW-DF2). Essential for layered materials, molecular crystals, adsorption on surfaces. In QE 7.3.1 use `input_dft = 'vdw-df2-b86r'` for rev-vdW-DF2.

---

## Reality check

In a QE input for a GGA calculation:

```
&SYSTEM
  input_dft = 'PBE'
/
```

For vdW-corrected:

```
&SYSTEM
  input_dft = 'vdw-df2-b86r'
/
```

For hybrid in VASP:

```
LHFCALC = .TRUE.
HFSCREEN = 0.2
AEXX = 0.25
```

The functional choice should be driven by the property you need. Band gap or magnetic moment: use hybrid. Layered system or molecule-surface adsorption: use vdW correction. Bulk metal at equilibrium: PBE or PBEsol is usually fine.

!!! warning "Common Mistake"
    Using PBE for a property requiring dispersion corrections or accurate band gaps, then attributing the error to DFT rather than to the functional choice. The approximation is in $E_{xc}$, not in the DFT formalism.

!!! note "DFT note"
    DFT+U adds an on-site Hubbard correction to localized d or f orbitals — a cheap fix for strongly correlated systems (NiO, FeO, transition metal oxides). The U parameter is empirical. It is not a substitute for a properly chosen hybrid functional, but it costs almost nothing extra.

---

## Takeaway

The functional is the single biggest physics decision in a DFT calculation. Know what your functional captures, what it misses, and choose based on the property you're computing.
