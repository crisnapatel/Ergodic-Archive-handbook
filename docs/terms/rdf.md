# Radial Distribution Function (RDF, g(r))

> **Definition:** The ratio of the local number density of atoms at distance r from a reference atom to the bulk number density, normalized so that g(r) approaches 1 at large r in a homogeneous system. Sharp peaks indicate crystalline order; a first peak followed by decay to 1 indicates liquid-like short-range order. Directly comparable to X-ray and neutron diffraction structure factors via Fourier transform.

The RDF is your simulation's fingerprint. Show it to anyone in the field and they'll immediately tell you whether your material is a crystal, a liquid, or a glass — just from the shape of the curve.

---

## Hook

You finish a 10 ns MD run of a carbon system. Is it graphitic? Amorphous? Did it crystallize? You could render it in OVITO and squint at atom positions. Or you could compute the RDF and know in thirty seconds.

---

## Why should you care?

The RDF is the primary structural diagnostic in atomistic simulation. It's also directly measurable by X-ray and neutron diffraction — which means you can validate your simulation against experiment without fitting any parameters. If your simulated g(r) disagrees with measured diffraction data, something is wrong with your force field or your equilibration.

---

## The wrong intuition

"The RDF tells me where the atoms are."

Not quite. It tells you the *probability* of finding an atom at distance r from another atom, relative to what you'd expect from a uniform distribution. A sharp peak at r = 1.42 Å in graphene doesn't tell you where a specific atom is. It tells you that if you stand on any carbon atom, the probability of finding another carbon 1.42 Å away is much higher than the bulk average.

---

## The explanation

Imagine standing on one atom and looking outward in all directions. You count how many atoms you find in a thin shell between r and r + dr. You divide by the number you'd expect from a uniform distribution at the bulk density. That ratio, averaged over all reference atoms and over time, is g(r).

In a **crystal**, the coordination shells are sharp and well-defined. g(r) has delta-function-like peaks at the nearest-neighbor, next-nearest-neighbor distances, and so on. The peaks don't decay to 1 — they persist to large r because of long-range order.

In a **liquid**, you see a prominent first peak (nearest neighbors), a broader second peak (second shell), and then g(r) → 1 fairly quickly. Short-range order exists; long-range order does not.

In an **ideal gas**, g(r) = 1 everywhere. No correlations at all.

The area under the first peak gives the average coordination number — the average number of nearest neighbors per atom. For graphene, integrating the first peak of the C-C g(r) gives exactly 3.

---

## The math

Ready? Let's do this.

\[
g(r) = \frac{V}{N^2} \left\langle \sum_{i} \sum_{j \neq i} \delta(r - r_{ij}) \right\rangle
\]

The outer average is over time (trajectory frames). V is the box volume, N is the number of atoms. The Dirac delta picks out pairs at exactly distance r.

In practice you bin by distance: count pairs with r_ij in [r, r + Δr], divide by the expected count for a uniform distribution in that shell (which is N × 4πr²Δr × ρ, where ρ = N/V is the bulk density), and average over frames.

The coordination number from the first shell:

\[
n_1 = 4\pi\rho \int_0^{r_{\min}} r^2 g(r) \, dr
\]

where r_min is the first minimum of g(r) after the first peak. For graphene C-C: n_1 ≈ 3. For FCC metals: n_1 = 12.

---

## Reality check

In LAMMPS, compute and dump the RDF with:

```
compute rdf all rdf 100 1 1        # 100 bins, type-1 to type-1
fix rdf_out all ave/time 100 1 100 c_rdf[*] file rdf.dat mode vector
```

This averages over frames and writes to `rdf.dat`. The first column is r in Å, the second is g(r).

For a multi-component system (e.g., C-H), specify partial RDFs:

```
compute rdf all rdf 100 1 1 1 2 2 2   # C-C, C-H, H-H
```

OVITO can compute RDFs interactively and plot them directly.

!!! warning "Common Mistake"
    Computing the RDF before the system is equilibrated. If your carbon system is still structurally relaxing, the RDF will show transient features (split peaks, wrong coordination numbers) that look like physical structure but are artifacts of the initial condition.

!!! note "Simulation Note"
    For comparison to X-ray or neutron diffraction, compute the structure factor S(Q) via Fourier transform of g(r). LAMMPS does not do this natively but OVITO and the `freud` Python library handle it well.

---

## Takeaway

g(r) is your first check after any simulation. Crystal, liquid, or glass — the answer is in the shape of the curve, and it connects directly to what experimentalists measure.
