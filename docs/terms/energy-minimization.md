# Energy Minimization

> **Definition:** Iterative algorithms that move atoms (and optionally cell parameters) along the negative gradient of the potential energy surface until forces are below a convergence threshold. Steepest descent: robust far from the minimum, slow near it. Conjugate gradient: uses gradient history, standard for ionic relaxation in DFT. BFGS or quasi-Newton: approximates the inverse Hessian, fastest near a minimum. FIRE (fast inertial relaxation engine): robust for large or poorly conditioned classical systems.

Energy minimization is not MD. No time, no temperature, no thermostat. You just roll the atoms downhill on the potential energy surface until they stop moving. The goal is the nearest local minimum from your starting configuration — not the global minimum, not the equilibrium structure at finite temperature.

---

## Hook

You put together a structure by hand: atoms placed on a crystal lattice, a defect dropped in. Some bonds are too short, some angles are slightly wrong. If you launch MD at 300 K from this structure, the excess energy will cause an uncontrolled spike — potentially crashing the simulation or sending atoms flying. Minimization first removes this artifactual strain. It's not optional. It's part of the setup protocol.

---

## Why should you care?

Every DFT calculation that reports atomic positions is implicitly reporting a minimized structure. Every MD simulation of a solid should start from a minimized cell. The minimization algorithm and its convergence threshold directly control how accurately the forces are zeroed. Forces that aren't fully converged mean your subsequent phonon, elastic, or stress calculations inherit systematic errors.

---

## The wrong intuition

"The total energy stopped changing, so the minimization converged."

Energy is insensitive to small force residuals in flat regions of the PES. You can have residual forces of 0.1 eV/Å while the energy changes by less than 0.01 meV between steps. If you're computing elastic constants or phonons, those force residuals will show up as spurious imaginary modes. Always converge on forces, not energy.

---

## The explanation

All minimizers follow the same structure: compute the gradient (forces = $-\nabla U$), determine a step direction, line-search along that direction, update positions, repeat.

**Steepest descent.** Step direction is always $-\nabla U$. No memory of previous steps. Robust far from the minimum where the gradient direction is informative. Near the minimum, it zigzags inefficiently across narrow valleys. Use it to remove gross strain from a badly constructed starting structure, then switch to a better algorithm.

**Conjugate gradient (CG).** Combines the current gradient with the previous step direction to construct a conjugate direction that avoids the zigzagging. Converges in $N$ steps for a quadratic surface (where $N$ is degrees of freedom). In practice, the PES is not quadratic but CG is still dramatically faster than steepest descent near the minimum. Standard for ionic relaxation in QE (`ion_dynamics = 'cg'`) and VASP (`IBRION = 2`).

**BFGS / quasi-Newton.** Builds an approximate inverse Hessian from the history of gradient changes. Steps use curvature information — it knows the PES is flat in some directions and steep in others, and takes large steps in flat directions. Fastest near a minimum. Can fail if the approximate Hessian becomes ill-conditioned (e.g., saddle point regions, very asymmetric cells). VASP uses RMM-DIIS by default which is similar in spirit.

**FIRE.** Treats the minimization as a damped dynamics problem. Atoms are given velocities in the direction of force; when the power $P = \mathbf{F} \cdot \mathbf{v}$ goes negative (you're going uphill), velocities are reset and the timestep is shortened. Robust for large disordered systems where BFGS struggles. Standard in classical MD minimizers (LAMMPS `min_style fire`).

**Cell relaxation.** For DFT, you often want to relax both atomic positions and the unit cell shape and volume. This means the stress tensor also needs to converge to zero, not just forces. In VASP: `ISIF = 3` (relax cell shape, volume, and positions). In QE: `calculation = 'vc-relax'`. Cell relaxation requires tighter k-point meshes than single-point calculations because the Pulay stress from basis set incompleteness makes the computed stress noisy.

---

## Reality check

In QE, a conjugate gradient ionic relaxation:

```
&CONTROL
  calculation = 'relax'
/
&IONS
  ion_dynamics = 'bfgs'    ! BFGS is default in QE 7.x, despite the label
/
```

Force convergence threshold: `forc_conv_thr = 1.0d-3` (Ry/Bohr) is the QE default. For phonon calculations or elastic constants, tighten to `1.0d-4`.

In LAMMPS for a classical system before MD:

```
min_style   cg
minimize    1e-6 1e-8 10000 100000
```

(energy tolerance, force tolerance, max iterations, max evaluations).

!!! warning "Common Mistake"
    Declaring convergence from energy change alone when forces are still large, particularly for soft modes where the energy surface is flat. Also: forgetting to relax the cell when computing pressures or elastic properties — a cell with residual stress will give wrong elastic constants.

---

## Takeaway

Always minimize before MD, always converge on forces not energy, and for DFT property calculations tighten the force threshold beyond the default.
