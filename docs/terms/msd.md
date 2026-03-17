# Mean Squared Displacement (MSD)

> **Definition:** The ensemble average of the squared displacement of atoms from their initial positions as a function of time. In the diffusive (long-time) regime, the slope of MSD versus time gives the self-diffusion coefficient via the Einstein relation.

How far does an atom wander over time? In a solid: barely at all. In a liquid: it drifts, and the faster it drifts, the steeper the MSD grows. That slope is the diffusion coefficient. That's the whole idea.

---

## Hook

You want the diffusion coefficient of hydrogen in your carbon membrane. You run MD. You have a trajectory. The MSD is how you turn that trajectory into a number you can put in a paper.

---

## Why should you care?

The MSD is the simplest route to the self-diffusion coefficient D, which characterizes atomic mobility. It distinguishes solid (atoms stay put), liquid (atoms drift), and glass (atoms are trapped initially but creep at long times). It's one of the first things you check after equilibration to confirm your system is behaving as expected.

---

## The wrong intuition

"Just compute MSD at the end of the run and divide by time to get D."

Fitting D from a single (t, MSD) point is wrong. You need to identify the linear regime — the region where MSD grows as 2dDt — and fit the slope there. Early times are ballistic (MSD ∝ t²) and won't give the right D. Late times, if your trajectory is too short for the system size, show cage effects or noise. The linear regime is what you want, and you have to find it.

---

## The explanation

An atom starts at position r(0). At time t it's at r(t). The squared displacement is |r(t) − r(0)|². Average this over all atoms and over multiple time origins, and you get MSD(t).

**Three regimes:**

At very short times, atoms move ballistically (no collisions yet). MSD grows as t². The slope in this regime is just 3k_BT/m — the mean thermal speed squared.

At intermediate times, atoms start colliding with neighbors and the motion becomes diffusive. MSD grows linearly in t. This is the regime you want for D.

At late times in a finite simulation, the MSD can plateau (atoms are confined) or show noise (you've run out of independent time origins). Both will give wrong D if you use them.

---

## The math

\[
\text{MSD}(t) = \left\langle |\mathbf{r}(t) - \mathbf{r}(0)|^2 \right\rangle
\]

Einstein relation for diffusion coefficient in d dimensions:

\[
D = \frac{1}{2d} \lim_{t \to \infty} \frac{d \, \text{MSD}(t)}{dt}
\]

For 3D: D = slope / 6, where slope is the MSD(t) slope in the linear regime, with MSD in Å² and t in ps, giving D in Å²/ps = 10⁻⁴ cm²/s.

---

## Reality check

In LAMMPS:

```
compute msd all msd com yes
fix msd_out all ave/time 1 1 100 c_msd[4] file msd.dat
```

`c_msd[4]` is the total MSD (x² + y² + z²). `com yes` removes center-of-mass drift before computing displacement. Without `com yes`, any net drift of the simulation box (e.g., from imperfect momentum conservation) inflates the MSD artificially.

Plot MSD vs time. Identify the linear regime by eye or by computing the local slope d(MSD)/dt and looking for a plateau. Fit that slope to get D.

!!! warning "Common Mistake"
    Forgetting `com yes` when the system has net momentum. In LAMMPS, momentum conservation isn't exact under domain decomposition; small net drifts accumulate and make the MSD look super-diffusive. Always remove center-of-mass motion.

!!! note "Simulation Note"
    MSD and VACF give two independent routes to D (Einstein vs Green-Kubo). If they agree, you have good ergodic sampling. If they disagree, your trajectory is too short, your system is not equilibrated, or the system is not ergodic on your simulation timescale.

---

## Takeaway

MSD tells you how mobile your atoms are. Fit the slope of the linear regime, not a single point, and always remove center-of-mass drift before you compute it.
