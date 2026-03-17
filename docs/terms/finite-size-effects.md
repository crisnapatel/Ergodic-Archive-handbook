# Finite Size Effects

> **Definition:** Artifacts in simulation results arising from the finite linear dimension of the simulation cell. When a physical correlation length approaches the box size, PBC artificially suppresses fluctuations and introduces image-image interactions. In charged-defect DFT calculations, periodic images of the defect interact electrostatically. Size convergence must be demonstrated explicitly.

You're simulating a finite chunk of matter and calling it bulk. PBC helps — you tile the box infinitely. But if something real in your system is trying to be bigger than your box, PBC doesn't solve the problem. It just wraps the artifact back into itself.

---

## Hook

You compute the diffusion coefficient of water at 300 K. You use a 216-molecule box. You get a number. Someone else uses 512 molecules. Different number. Neither of you changed the force field, the temperature, or the timestep.

Finite size effects did it. And the annoying part is they don't announce themselves — your simulation just runs and gives you a plausible-looking answer.

---

## Why should you care?

Any observable that involves a length scale — diffusion, viscosity, elastic moduli, phonon modes, defect formation energies — can be box-size dependent. For DFT, charged defects are the worst offender: a vacancy with charge +1 is periodically replicated, and those image charges interact over long range, shifting your formation energy by hundreds of meV.

---

## The wrong intuition

"PBC means I'm simulating an infinite system, so finite size effects don't apply."

PBC means you're simulating a *periodic* system, not an infinite *aperiodic* one. If your correlation length $\xi$ is comparable to $L$ (the box dimension), the periodicity is physically wrong. PBC suppresses fluctuations at wavelengths longer than $L$. For a liquid near a critical point or a solid with long-wavelength phonons, this is a real problem.

---

## The explanation

There are two distinct mechanisms depending on whether you're doing MD or DFT.

**In classical MD.** The relevant quantity is the correlation length of whatever you're computing. For diffusion, the hydrodynamic self-interaction of a particle with its own periodic image is the dominant effect — the particle's velocity field wraps around the box and pushes itself. This gives a systematic size dependence in $D$ that scales as $1/L$:

$$
D(L) = D_\infty - \frac{k_B T}{6\pi \eta L} \cdot \xi
$$

where $\eta$ is the shear viscosity. The correction is known analytically (Yeh-Hummer, 2004). You can either apply it or run multiple box sizes and extrapolate to $1/L \to 0$.

For structural quantities like RDF, size effects are usually negligible past $\sim$1000 atoms. For dynamical quantities, you often need much more.

**In DFT with charged defects.** A supercell with a net charge $q$ has a compensating jellium background added automatically by the code. The electrostatic interaction between periodic images of that charge scales as $q^2/L$. For a vacancy at charge +2 in a 64-atom cell, this can be 0.5–1 eV of spurious energy. Standard correction schemes: Makov-Payne or Freysoldt (FNV). VASP and QE don't apply these automatically — you have to run them post-hoc.

**The practical test.** Run your simulation at two or three box sizes. If the observable shifts by more than your acceptable error, you have a finite size problem. There's no shortcut.

---

## Reality check

In LAMMPS, size convergence for diffusion: run your system at $N$ = 500, 2000, 5000 atoms and plot $D$ vs $1/N^{1/3}$ (which is $\propto 1/L$). If it's linear, extrapolate. If it's flat, you're fine.

In QE/VASP for charged defects: use a supercell large enough that the defect-image distance exceeds the screening length of your material. For a semiconductor with $\varepsilon_r \approx 10$, a 3×3×3 supercell of a 4-atom unit cell (108 atoms) is often borderline. Always apply an electrostatic finite-size correction for charged cells.

!!! warning "Common Mistake"
    Comparing defect formation energies between different codes without checking that the same finite-size correction scheme was applied. The raw (uncorrected) energies are not directly comparable.

---

## Takeaway

The box is never really infinite. If your observable has a correlation length, check that the box is bigger than it — then check again with a larger box to prove it.
