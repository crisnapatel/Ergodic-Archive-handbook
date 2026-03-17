# Periodic Boundary Conditions

> **Definition:** A boundary condition in which the simulation cell is replicated infinitely in all spatial directions, eliminating artificial surfaces. An atom leaving one face of the cell re-enters from the opposite face with the same velocity. The simulation effectively models one unit cell of an infinite periodic system, making it appropriate for bulk crystals, liquids, and amorphous materials. Surface simulations use PBC in two dimensions and a vacuum gap in the third.

You're not simulating a tiny box. You're simulating one tile of an infinite floor. The edges don't exist — they're just where your tile meets the next one. Same atoms, same velocities, tiled forever in every direction.

---

## Why should you care?

Here's the problem PBC solves. Take 1000 atoms, no periodic boundaries. How many of them are at or near the surface? Roughly the outer shell — that's on the order of N^(2/3) atoms. For 1000 atoms, that's ~100 surface atoms. That's 10% of your system behaving like they're at a vacuum interface when you're trying to simulate bulk iron.

Surface atoms behave completely differently: different coordination, dangling bonds, reconstruction. If you're trying to compute bulk elastic constants, bulk diffusivity, bulk phonon spectrum — you just poisoned 10% of your sample.

PBC kills the surface. Every atom sees the same environment as if it were deep in the bulk.

---

## The wrong intuition

The most common wrong picture: "PBC means my atoms bounce off the walls."

No. There are no walls. The atom doesn't bounce — it teleports. It exits one face and enters the opposite face with identical velocity. Momentum is conserved. The trajectory is continuous. What looks like a boundary is just a bookkeeping convention for where we count the atom.

Another wrong picture: "My simulation box is the whole system."

Your simulation box is *one periodic image*. The system is infinite. When you compute properties, you're computing properties of an infinite periodic system — which is exactly what you want for bulk materials.

---

## The explanation

Here's the geometry. Say you have a cubic box of side length L. The position of every atom is described in fractional coordinates \(s_i \in [0, 1)\). When the x-component of \(s_i\) reaches 1, it wraps back to 0. That's it.

In Cartesian space: if an atom exits at \(x = L\), it re-enters at \(x = 0\). If it exits at \(x = 0\), it re-enters at \(x = L\). The atom's velocity doesn't change. The forces on it don't change. It just gets reassigned to the opposite face of the box.

The simulation box tiles space. Every image of the box contains identical atoms in identical configurations — just shifted by integer multiples of L. There is no special "original" box.

For non-cubic boxes (monoclinic, triclinic — common in DFT for crystals), the wrapping happens in fractional coordinates of the lattice vectors. The physics is the same.

---

## The math

The wrapping operation in Cartesian coordinates (cubic box):

\[
x_i \leftarrow x_i - L \cdot \text{round}\left(\frac{x_i}{L}\right)
\]

This keeps every atom in \([-L/2, +L/2)\). In LAMMPS, this happens automatically; you can check it by inspecting atom positions in the dump file — you'll never see \(|x_i| > L/2\).

The potential energy of the system is computed as a sum over all periodic images:

\[
U = \frac{1}{2} \sum_{\mathbf{n}} \sum_{i,j}^{'} u(|\mathbf{r}_{ij} + \mathbf{n} L|)
\]

where \(\mathbf{n} = (n_x, n_y, n_z)\) runs over all integer lattice vectors and the prime excludes the \(i = j, \mathbf{n} = 0\) self-interaction. For short-range potentials, this sum is truncated at the cutoff radius and further simplified by the Minimum Image Convention (each atom interacts only with the closest image of each other atom). For long-range Coulomb interactions, the sum converges conditionally and requires Ewald summation.

---

## Reality check

In your LAMMPS input, PBC is turned on with:

```
boundary p p p
```

One letter per dimension: `p` = periodic, `f` = fixed (hard wall), `s` = shrink-wrapped. For a slab simulation (surface in vacuum): `p p f` or `p p s`. For a nanotube: `f f p` (periodic only along the tube axis).

The box dimensions determine L. In NPT runs, L fluctuates. In NVE/NVT, L is fixed. In QE/VASP (DFT), the cell vectors defined in your input file define the periodic cell — equivalent to the LAMMPS box.

One thing that will bite you: if your molecule is larger than L/2, the molecule interacts with its own image. Check your box is big enough before running.

---

!!! warning "Common Mistake"
    Using PBC for a gas-phase molecule calculation without enough vacuum. The molecule must not "see" its own periodic image. Rule of thumb: at least 10–15 Å of vacuum in each periodic dimension. In DFT (QE/VASP), this is why isolated molecule calculations use a large cubic box.

!!! note "Simulation Note"
    When you image atoms for visualization (e.g., in OVITO), you're reconstructing the visual of the infinite tiling. The simulation never "knows" atoms are split across the boundary — that's just how we visualize it. Use OVITO's "unwrap trajectories" option to see continuous diffusion paths.

---

## Illustration

A 2D schematic of PBC: the central simulation box tiled in all directions, with an atom crossing the boundary and re-entering from the opposite face.

*(Figure: `docs/assets/figures/pbc_tiling.png` — generated by `scripts/plot_pbc_demo.py`)*

---

## Takeaway

PBC makes your finite box simulate an infinite bulk. The boundary is not a wall — it's a seam in an infinite tiling. Every atom in your box behaves as if it's surrounded by identical neighbors in all directions, which is exactly what bulk behavior means.
