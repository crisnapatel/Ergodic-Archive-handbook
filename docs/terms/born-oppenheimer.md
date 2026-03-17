# Born-Oppenheimer Approximation

> **Definition:** The decoupling of nuclear and electronic degrees of freedom based on the large nuclear-to-electron mass ratio (typically 10³ to 10⁵). The electronic Schrödinger equation is solved at each fixed nuclear geometry, yielding an electronic energy as a function of nuclear positions. This function defines the potential energy surface on which nuclei move. The approximation breaks down near conical intersections and for non-adiabatic processes.

Electrons are so fast compared to nuclei that from the electrons' point of view, the nuclei are standing still. Like trying to track a hummingbird while you're a glacier. The hummingbird adjusts instantly to wherever the glacier is. You solve for the hummingbird at each glacier position. That's Born-Oppenheimer.

---

## Hook

Every DFT calculation you've ever run assumes Born-Oppenheimer. Every classical force field was parameterized assuming Born-Oppenheimer. It's the reason you can even define a potential energy surface — the whole concept of "atoms interacting via a potential" requires that the electronic energy responds instantly to nuclear motion. Without BO, there is no potential energy surface. There's just a 3(N+n)-dimensional wavefunction nightmare.

---

## Why should you care?

Because it's the assumption that makes DFT and classical MD possible, and knowing when it fails tells you when neither approach is valid. If you're doing excited-state dynamics, studying a photochemical reaction, or computing proton transfer where tunneling matters — BO is wrong and you need non-adiabatic methods.

---

## The wrong intuition

"Born-Oppenheimer is an approximation, so it introduces error that I should try to correct."

For the vast majority of ground-state materials science — DFT structure/energy, phonons, classical MD, reaction energetics — BO is not a meaningful source of error. The mass ratio M/m_e is 10³ to 10⁵ depending on the element. The BO error scales as (m_e/M)^(1/4), which is 0.1–1%. Your functional choice, basis set, and k-point sampling introduce far larger errors.

---

## The explanation

The full molecular Hamiltonian has kinetic energy terms for both nuclei and electrons, plus all the Coulomb interactions. The wavefunction depends on both nuclear positions R and electron positions r.

The Born-Oppenheimer approximation says: because nuclei are much heavier, their kinetic energy term is small. Solve the electronic problem at fixed nuclear geometry:

\[
\hat{H}_{\text{el}}(\mathbf{r}; \mathbf{R}) \, \Psi_{\text{el}}(\mathbf{r}; \mathbf{R}) = E_{\text{el}}(\mathbf{R}) \, \Psi_{\text{el}}(\mathbf{r}; \mathbf{R})
\]

The electronic energy E_el(R) as a function of nuclear positions R is the **Born-Oppenheimer potential energy surface (PES)**. Nuclei then move on this surface according to Newton's equations (classical MD) or the nuclear Schrödinger equation (path integral MD).

This is exactly what happens in a DFT geometry optimization or AIMD run. At each ionic step, QE or VASP solves the electronic problem at the current nuclear geometry (the SCF cycle) and returns forces as −∇E_el(R). Nuclei move. Repeat.

**When it fails.** Near a conical intersection, two electronic states become degenerate at some nuclear geometry. The electronic wavefunction changes discontinuously, and the separation between electronic and nuclear motion breaks down. This is the domain of non-adiabatic dynamics (Ehrenfest, surface hopping) — beyond standard DFT-MD.

---

## Reality check

In your QE input, `calculation = 'scf'` solves the electronic problem at one fixed nuclear geometry (BO assumed). `calculation = 'relax'` iterates ionic positions on the BO surface. `calculation = 'md'` is AIMD — solves SCF at each ionic step, then moves nuclei.

The BO approximation is implicit everywhere. You never set a flag to turn it on; it's just the framework. The `ion_dynamics` setting in QE controls how the nuclei move on the BO surface:

```
calculation = 'md'
ion_dynamics = 'verlet'    ! NVE on the BO surface
dt = 20                    ! Ry atomic units (≈ 0.97 fs)
```

!!! note "Simulation Note"
    Car-Parrinello MD (CPMD code) treats electrons as fictitious classical particles rather than solving the SCF problem at each step. It's still BO in spirit — electrons follow nuclei — but uses a different algorithm that avoids the SCF cost. The fictitious electron mass must be small enough to keep electrons close to the BO surface (adiabaticity).

---

## Takeaway

Born-Oppenheimer is the reason potential energy surfaces exist, and the reason DFT and classical MD are possible. It's accurate to better than 1% for ground-state materials and breaks down only near electronic degeneracies or for light nuclei where quantum nuclear motion matters.
