# Convergence Testing

> **Definition:** The systematic verification that computed DFT results are insensitive to numerical discretization parameters within an acceptable tolerance (typically 1 to 5 meV/atom for energy differences). The two primary parameters in plane-wave DFT are the kinetic energy cutoff (size of the plane-wave basis) and the k-point grid density. Convergence is system- and property-specific; values from one system do not transfer to another.

Convergence testing is the DFT equivalent of checking that your timestep is small enough in MD. You have numerical parameters that control accuracy. You need to prove that your results don't depend on them. If you skip this, every number you report has an unknown systematic error built in.

---

## Hook

You find a paper reporting adsorption energies on a TiO₂ surface. `ENCUT = 400 eV`, k-mesh `2×2×1`. Sounds reasonable. But TiO₂ with oxygen needs at least 500 eV to converge the O 2p states, and a `2×2×1` mesh on a slab is almost certainly too sparse. The reported binding energies could be off by 0.2–0.5 eV. Nobody checked.

Published DFT numbers without convergence tests are guesses with confidence intervals you can't know.

---

## Why should you care?

Convergence testing is what separates a DFT result from a DFT number. The workflow is mechanical and not expensive — you run a few extra calculations once per new system. Skip it and every subsequent calculation built on that setup inherits an unknown error.

---

## The wrong intuition

"I used the same `ENCUT` as the pseudopotential's recommended value and a moderately dense k-mesh. That's good enough."

The pseudopotential's recommended cutoff is a lower bound for the wavefunction to be physically meaningful — not a guarantee of converged energy differences. Adsorption energies, vacancy formation energies, and reaction barriers involve partial cancellation between large numbers. Incomplete cancellation at an under-converged cutoff introduces errors that survive the subtraction.

---

## The explanation

**The two primary parameters in plane-wave DFT.**

The Kohn-Sham wavefunctions are expanded in plane waves up to a maximum kinetic energy:

$$
E_\text{cut} = \frac{\hbar^2 |\mathbf{G}_\text{max}|^2}{2m_e}
$$

Larger `ENCUT` means more plane waves, a more complete basis, higher accuracy, and higher cost. The total energy decreases monotonically with increasing `ENCUT` and plateaus when the basis is complete enough. The k-point grid sets the sampling density in reciprocal space (see the k-points deep dive).

**What convergence actually means.** You're not converging to the "true" DFT answer — you're converging to the complete-basis, infinite-k limit of your specific functional and pseudopotential. That limit still has errors from the XC approximation. You're eliminating numerical errors on top of the physical approximation.

**The standard convergence test.** Fix all other parameters and vary one at a time.

For `ENCUT`: run the same structure at 300, 400, 500, 600, 700 eV. Plot total energy vs. cutoff. The converged cutoff is where $\Delta E < 1$ meV/atom between successive points. For energy *differences* (adsorption, reaction energies), the cancellation means you often need slightly lower cutoffs than for absolute energies — but test both.

For k-points: run the same structure at increasing grid densities. Plot total energy vs. number of k-points. Same tolerance.

**System specificity.** A converged cutoff for bulk Cu (typically 400 eV with PAW-PBE) does not transfer to Cu with an O adatom. Oxygen 2p states are harder to represent; they push the required cutoff up. A converged k-mesh for a 4-atom bulk cell is not the same as for a 40-atom slab — the BZ is smaller for the slab and in-plane sampling requirements change.

---

## Reality check

In VASP, a convergence test script loops `ENCUT` in the `INCAR`:

```
ENCUT = 400   ! change to 500, 600, 700 and rerun
EDIFF = 1E-8  ! tight SCF convergence during cutoff tests
```

In QE:

```
&SYSTEM
  ecutwfc = 60    ! in Ry; test 40, 60, 80, 100
  ecutrho = 480   ! for USPP, keep ratio ~8x ecutwfc
/
```

A quick way to assess: if your formation energy changes by more than 5 meV/atom when you increase `ENCUT` by 100 eV, you haven't converged yet.

!!! warning "Common Mistake"
    Demonstrating convergence of total energy per atom and assuming energy differences (adsorption energies, reaction barriers) are equally converged. Partial cancellation in differences is incomplete when chemical environments differ — an adsorbate on a surface introduces new atom types with potentially different convergence requirements.

!!! note "Simulation Note"
    For high-throughput workflows (materials databases), convergence parameters are often set conservatively high for the whole dataset. When you're running targeted calculations on specific systems, tighten the parameters but always run the convergence test yourself — do not assume database defaults are optimal for your specific property.

---

## Takeaway

Run convergence tests for `ENCUT` and k-points for every new system and every new type of calculation. It's cheap insurance against systematic errors that will undermine every result you build on top.
