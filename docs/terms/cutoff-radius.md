# Cutoff Radius & Neighbor Lists

> **Definition:** The cutoff radius r_c is the maximum interatomic distance beyond which pair interactions are set to zero (or smoothly truncated to avoid a force discontinuity). Reduces the cost of force evaluation from O(N²) to O(N) via neighbor list algorithms. A necessary condition under MIC is r_c < L/2, where L is the shortest box dimension.

You only care about your neighbors, not the people two blocks away. Beyond r_c, the interaction is zero. It's not physically zero — it's a tradeoff we made. And it's the tradeoff that makes MD tractable for anything larger than a handful of atoms.

---

## Hook

Computing forces for N atoms naively requires N² distance evaluations. For 100,000 atoms that's 10 billion pair checks per timestep. At a timestep of 1 fs and a 10 ns simulation, that's 10^23 operations.

That's not a computer science problem. That's a physics problem. We need a way out. The cutoff is the way out.

---

## Why should you care?

The cutoff radius is one of the two numbers you set that most directly controls the speed-accuracy tradeoff of your simulation (the other is the timestep). Too small and you're missing real interactions. Too large and you're paying for distance checks that contribute nothing because the potential is negligible there. And if it's larger than L/2, you've broken MIC and your forces are wrong.

For carbon systems with AIREBO, the cutoff is baked into the potential and you don't choose it directly. But for Lennard-Jones, EAM, and most classical potentials, it's one of the first parameters you set.

---

## The wrong intuition

"Use a large cutoff to be safe. More is better."

No. There's no free lunch here. A larger `r_c` means a larger neighbor list. A larger neighbor list means more pair evaluations per timestep, more memory, and more frequent list rebuilds. Beyond the range where the potential is non-negligible, you're just computing zeros.

For LJ, the potential at 2.5σ is roughly 1.6% of the well depth. At 3.5σ it's 0.1%. Whether that matters depends on what you're computing. For bulk thermodynamics, 2.5σ is usually fine. For surface tension or free energy, you may need a longer cutoff or explicit tail corrections.

The other wrong picture: "A sharp cutoff is fine without any correction."

It's not fine for pressure. A sharp cutoff introduces a discontinuity in the pair force at r = r_c. This produces a spurious contribution to the virial (and therefore the pressure) that you have to correct for. This is what dispersion tail corrections fix.

---

## The explanation

Here's how the O(N²) → O(N) reduction works.

**The naive approach.** For every pair (i, j) with i < j, compute the distance r_ij and evaluate the force if r_ij < r_c. That's N(N-1)/2 distance computations per step. Doesn't scale.

**Verlet list.** Build a list of neighbors for each atom: all atoms j within r_c + r_skin of atom i. r_skin is a buffer beyond r_c, typically 1–2 Å. Now at each timestep, you only loop over the pairs in the list. The list is rebuilt only when any atom has displaced more than r_skin / 2 since the last build. Average cost per step drops dramatically.

**Cell list.** Divide the box into subcells of side length ≥ r_c. To find neighbors of atom i, only search the 27 adjacent subcells (3³ in 3D). This makes the list-build itself O(N) rather than O(N²).

**Combined.** LAMMPS uses cell lists to build Verlet lists. Rebuild cost is O(N). Per-step force evaluation cost is O(N). Done. Beautiful.

---

## The math

The pair force on atom i from atom j:

\[
\mathbf{F}_{ij} = -\nabla_i u(r_{ij}) \cdot \Theta(r_c - r_{ij})
\]

where Θ is the Heaviside step function (1 if r < r_c, 0 otherwise). For a smooth cutoff, replace Θ with a switching function S(r) that ramps smoothly to zero between r_inner and r_c.

The switching function avoids the force discontinuity at r_c that corrupts the pressure. In LAMMPS this is `pair_modify shift yes` (shifts energy to zero at r_c) or a taper function via `pair_style lj/cut/coul/cut`.

The tail correction for pressure (assuming uniform density beyond r_c):

\[
P_{\text{tail}} = \frac{2\pi \rho^2}{3} \int_{r_c}^{\infty} r^3 \frac{du}{dr} g(r) \, dr \approx \frac{2\pi \rho^2}{3} \int_{r_c}^{\infty} r^3 \frac{du}{dr} dr
\]

where the approximation assumes g(r) ≈ 1 beyond r_c. LAMMPS applies this analytically with `pair_modify tail yes`.

---

## Reality check

In LAMMPS:

```
pair_style lj/cut 10.0          # r_c = 10 Å
pair_coeff 1 1 0.01 3.4         # epsilon and sigma for LJ
pair_modify shift yes tail yes  # smooth cutoff + tail correction
neighbor 2.0 bin                # r_skin = 2.0 Å, cell-list algorithm
neigh_modify every 5 delay 0 check yes   # rebuild every 5 steps if needed
```

The `neighbor` command sets the skin distance. `check yes` means LAMMPS only rebuilds when an atom has displaced more than r_skin / 2. `every 5` sets the maximum rebuild interval.

For AIREBO, you don't set r_c directly:

```
pair_style airebo 3.0 1 1
pair_coeff * * CH.airebo C H
```

The `3.0` multiplies the inner cutoff of the AIREBO torsion term. The LJ cutoff in AIREBO is fixed at ~10.2 Å. Just make sure your box is large enough.

!!! warning "Common Mistake"
    Forgetting `pair_modify tail yes` for LJ simulations where pressure matters (NPT runs, bulk modulus calculations, equation of state). The uncorrected pressure can be off by several percent for typical cutoffs of 10–12 Å.

!!! note "Simulation Note"
    The skin distance r_skin controls the tradeoff between rebuild frequency and list size. A larger skin means less frequent rebuilds but a bigger list (more pairs to evaluate). For fast systems (high T, light atoms), use a larger skin. For slow systems, a smaller skin is fine. If LAMMPS reports "Dangerous builds" in the log, your skin is too small.

---

## Takeaway

The cutoff is what makes MD scale to real system sizes. Set it large enough to capture the physics you care about, small enough to keep the simulation fast, and never larger than half your box.
