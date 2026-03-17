# Equipartition Theorem

> **Definition:** In classical statistical mechanics at thermal equilibrium, every independent quadratic term in the Hamiltonian contributes one-half k_B T to the mean energy. For N atoms with 3N translational degrees of freedom, the mean kinetic energy is 3Nk_BT/2, which is used in MD to define and compute instantaneous temperature from kinetic energy.

Every degree of freedom gets an equal share of the thermal energy. Not proportional to mass, not proportional to frequency. Equal. That's the whole theorem. And it's why you can extract temperature from velocities.

---

## Hook

In MD, you never directly set the temperature. You set target velocities. The thermostat works by driving the mean kinetic energy toward 3Nk_BT/2. Why that number? Because equipartition says each of the 3N velocity components contributes k_BT/2 on average. That's where the formula comes from.

---

## Why should you care?

Because the equipartition theorem is the bridge between your trajectory (positions and velocities, which are mechanical) and thermodynamics (temperature, heat capacity, which are statistical). Every time LAMMPS prints a temperature in the thermo output, it's computing 2⟨E_kin⟩ / (3Nk_B). That calculation assumes equipartition holds.

---

## The wrong intuition

"If the thermostat is set to 300 K, the system is at 300 K."

The thermostat drives the mean kinetic energy toward the equipartition value for 300 K. But if the system has internal constraints (frozen bonds, rigid molecules), some degrees of freedom are removed. The temperature calculation must account for this — divide by the actual number of unconstrained degrees of freedom, not 3N. LAMMPS handles this automatically with `fix nvt`, but it's worth understanding why.

---

## The explanation

The Hamiltonian of an N-atom classical system has kinetic energy terms of the form p²/2m for each Cartesian momentum component. That's 3N quadratic terms. Equipartition says each contributes k_BT/2 on average:

\[
\left\langle \frac{p_{ix}^2}{2m_i} \right\rangle = \frac{1}{2} k_B T
\]

Sum over all 3N components:

\[
\langle E_{\text{kin}} \rangle = \frac{3N}{2} k_B T
\]

Rearranging: instantaneous temperature from a trajectory frame is T = 2E_kin / (3Nk_B). This is what LAMMPS reports.

**Where it breaks down.** Equipartition is classical. Quantum modes (high-frequency vibrations like C-H stretching at room temperature, where hf >> k_BT) are not fully excited. Their actual energy contribution is less than k_BT/2. Classical MD overestimates the heat capacity and the effective temperature of stiff modes. This is one reason AIMD and PIMD exist — to handle quantum nuclear effects.

---

## Reality check

In LAMMPS, temperature is computed automatically. To see what the code is doing:

```
compute T all temp         # standard kinetic temperature
compute T_partial group1 temp   # temperature of a subset
```

If you use SHAKE to constrain bonds, LAMMPS automatically reduces the degrees of freedom in the temperature calculation. If you remove center-of-mass momentum (`momentum` fix), that also removes 3 degrees of freedom. Forgetting these corrections gives a temperature that's slightly off — usually small but worth knowing.

---

## Takeaway

Equipartition is why temperature and kinetic energy are interchangeable in classical MD. Each degree of freedom gets k_BT/2. Count your degrees of freedom correctly, especially with constraints.
