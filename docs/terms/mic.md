# Minimum Image Convention (MIC)

> **Definition:** Under periodic boundary conditions, the convention that each atom interacts only with the nearest periodic image of every other atom. For a rectangular box, the nearest-image displacement in each dimension must be at most half the corresponding box dimension. This imposes a strict upper bound on the cutoff radius.

PBC tiles your box infinitely in every direction. For every atom j, there are now infinitely many copies of it. MIC answers the question you immediately have to ask: which copy does atom i actually interact with? The answer is always the closest one. One rule. Every pair. Every timestep.

---

## Hook

The moment you turn on PBC, you have a problem. You wanted to eliminate surfaces — great, done. But now atom i is surrounded by infinite copies of atom j, each at a different distance. Which image do you use to compute the force?

You can't use all of them. That sum diverges for short-range potentials. You need a rule. MIC is that rule.

---

## Why should you care?

If you get this wrong, your forces are wrong. Full stop. Every pair force calculation in your MD simulation goes through MIC. It's not an optional correction. It's the bookkeeping that makes PBC physically meaningful.

And it has a hard constraint attached. Your cutoff radius `r_c` must be strictly less than `L/2`, where `L` is the shortest box dimension. Violate that and an atom can interact with two different periodic images of the same neighbor, silently corrupting your forces. LAMMPS won't always catch this.

---

## The wrong intuition

Wrong picture: "PBC creates a periodic system, so I should sum interactions over all images."

For short-range potentials (Lennard-Jones, AIREBO, EAM) that's computationally insane and physically unnecessary. These potentials decay to zero by `r_c`. Beyond that distance, the interaction is zero by construction. You only need the nearest image.

Other wrong picture: "I can choose any image as long as I'm consistent."

No. You must choose the nearest one. Any other choice means the force is not the gradient of a well-defined potential energy function. Nearest image is not a convention for convenience. It's the only choice that gives you consistent forces.

---

## The explanation

Your box has side length L. Atom i is at x_i, atom j is at x_j. The naive separation is Δx = x_j − x_i.

Under PBC, the candidates are Δx, Δx + L, Δx − L, Δx + 2L, and so on forever. MIC says: take the one with the smallest absolute value. That's your nearest image.

In 3D with a rectangular box, you apply this independently to each Cartesian component. The nearest-image vector is assembled component by component.

That's it. The wrinkle is doing it efficiently for millions of pairs per timestep, which is where neighbor lists come in. But the concept is one line of arithmetic.

---

## The math

Ready? Let's do this.

For one component:

\[
\Delta x_{\text{MIC}} = \Delta x - L \cdot \text{round}\!\left(\frac{\Delta x}{L}\right)
\]

The `round` function returns the nearest integer, shifting Δx into the range \([-L/2, +L/2)\). Done.

Apply the same to Δy and Δz. Build the full separation vector. Compute the distance. Check against `r_c`.

The constraint falls directly out of this. If \(|\Delta x_{\text{MIC}}|\) can reach L/2, there are two equally-close images and the choice is ambiguous. So `r_c` must be strictly less than L/2. Not approximately. Exactly.

---

## Reality check

In LAMMPS, MIC is applied automatically inside the neighbor list and pair force routines. You don't call it explicitly. But it controls what box sizes are valid.

The constraint is `r_c < L/2`. For AIREBO with an effective cutoff around 10 Å, your box must be at least 20 Å in every dimension. When you write:

```
pair_style airebo 3.0
```

That `3.0` is a scale factor on the AIREBO cutoff, not the cutoff itself. The actual cutoff ends up around 10.2 Å. Your box must be at least ~20.4 Å per side.

For non-cubic boxes (triclinic), the constraint applies to the shortest *perpendicular* distance between opposite faces, not the box vector lengths. A highly tilted cell can have long lattice vectors but a short perpendicular height. Easy to get wrong.

!!! warning "Common Mistake"
    Running NPT with a box just barely above 2 × r_c at the start. The box can shrink under pressure. If it shrinks below the MIC limit mid-run, forces become corrupted with no obvious error message. Monitor box dimensions in your thermo output.

!!! note "Simulation Note"
    LAMMPS checks the MIC condition at run start and errors if the box is too small. But it does not recheck dynamically during NPT. Add `variable Lmin equal min(lx,ly,lz)` and a `fix halt` if you're running at high pressure and want a safety net.

---

## Takeaway

MIC is one rule applied to every pair: use the nearest periodic image. It's what makes PBC physically consistent, and the price you pay is a hard upper bound on your cutoff radius.
