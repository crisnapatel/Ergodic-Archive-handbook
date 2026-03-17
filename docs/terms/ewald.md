# Ewald Summation & PME

> **Definition:** A method for computing long-range Coulomb interactions under PBC without truncation. Splits the interaction into a short-range real-space contribution and a long-range reciprocal-space contribution evaluated via Fourier series. Particle Mesh Ewald (PME) uses fast Fourier transforms to evaluate the reciprocal sum in O(N log N). Essential for any charged or polar system; a simple real-space cutoff for Coulomb interactions in such systems introduces large systematic artifacts.

The Coulomb interaction decays as $1/r$. Under PBC, every charge interacts with every periodic image of every other charge — infinitely many interactions, none of which are individually negligible. A naive cutoff throws away real physics. A naive infinite sum doesn't converge. Ewald is the way out: split the problem into two parts that each converge, solve them separately, add the results.

---

## Hook

You simulate a salt solution (NaCl in water) with a real-space Coulomb cutoff at 12 Å. The simulation runs. The RDF looks mostly okay. But the ion pairing energies are wrong by 15%, the dielectric properties are off, and the diffusion coefficients of Na⁺ and Cl⁻ are systematically biased.

Truncating a $1/r$ potential isn't a controlled approximation. It's an error with no obvious signal that anything went wrong.

---

## Why should you care?

Any system with charges — ionic liquids, proteins, polar solvents, charged surfaces, electrolytes — requires proper long-range electrostatics. The artifacts from cutoff-truncated Coulomb interactions are not small and not random; they're systematic and depend on cutoff choice in a non-obvious way. PME is the standard solution. It's available in essentially every MD code. There's no good reason not to use it.

---

## The wrong intuition

"The Coulomb interaction is already weak at 12 Å, so a cutoff there is fine."

$U(r) \propto 1/r$ decays slowly. At 12 Å the interaction between monovalent ions is ~1.2 kJ/mol — not negligible compared to $k_BT$ = 2.5 kJ/mol at 300 K. Multiply by the number of image interactions and the error compounds. The absolute energy error from truncation can be hundreds of kJ/mol for a typical simulation box.

---

## The explanation

**The convergence problem.** The total Coulomb energy of a periodic system is:

$$
U_\text{Coul} = \frac{1}{2} \sum_{i \neq j} \sum_{\mathbf{n}} \frac{q_i q_j}{|\mathbf{r}_{ij} + \mathbf{n}L|}
$$

where the sum over $\mathbf{n}$ runs over all periodic images. This sum converges conditionally — the answer depends on the order of summation. It does not converge absolutely. You can't just truncate it.

**The Ewald split.** Add and subtract a Gaussian charge distribution $\rho_i(\mathbf{r}) = q_i (\alpha/\sqrt{\pi})^3 e^{-\alpha^2 r^2}$ centered on each atom. This splits the problem into:

**Real-space sum.** The original point charges screened by the Gaussian counter-charges. Decays as $\text{erfc}(\alpha r)/r$, which falls off much faster than $1/r$. Can be truncated at a real-space cutoff $r_c$ without significant error. Cost scales as $O(N)$ with cutoff.

**Reciprocal-space sum.** The Gaussian charges (which smooth out the short-range singularity) summed in Fourier space:

$$
U_\text{recip} = \frac{1}{2\pi V} \sum_{\mathbf{G} \neq 0} \frac{e^{-G^2/4\alpha^2}}{G^2} \left| \sum_j q_j e^{i\mathbf{G}\cdot\mathbf{r}_j} \right|^2
$$

This sum converges rapidly because the Gaussian envelope suppresses large-$G$ terms. Cost scales as $O(N^2)$ naively (all pairs of atoms contribute to the structure factor).

**Self-energy correction.** The Gaussian counter-charges interact with themselves — subtract this self-energy term analytically.

**PME (Particle Mesh Ewald).** The $O(N^2)$ reciprocal sum is the bottleneck. PME interpolates the charge density onto a regular mesh and evaluates the Fourier sum via FFT, reducing the cost to $O(N \log N)$. The mesh spacing and interpolation order (typically 4th or 5th order B-splines) control accuracy. This is the standard in GROMACS, NAMD, LAMMPS, and AMBER.

The parameter $\alpha$ (or equivalently the `ewald_gamma` or `kappa`) controls the balance between real-space and reciprocal-space accuracy. Most codes choose it automatically based on the real-space cutoff and a target accuracy.

---

## Reality check

In LAMMPS, enabling PME for a charged system:

```
kspace_style   pppm 1.0e-4        ! 1e-4 is the RMS force accuracy target
kspace_modify  mesh 64 64 64      ! optional: set mesh explicitly
pair_style     lj/cut/coul/long 12.0
pair_coeff     ...
```

LAMMPS calls its PME implementation PPPM (particle-particle particle-mesh) — same algorithm, different name.

In GROMACS:

```
coulombtype     = PME
rcoulomb        = 1.2       ! nm, real-space cutoff
fourierspacing  = 0.12      ! nm, controls mesh density
pme-order       = 4
```

For neutral systems with no long-range Coulomb (e.g., pure LJ argon), skip kspace entirely. For systems with partial charges (water, organic molecules, ions): always use PME. There is no good justification for using a Coulomb cutoff in a charged or polar system when PME is available.

!!! warning "Common Mistake"
    Using `coul/cut` instead of `coul/long` in LAMMPS for an ionic or polar system. The truncation introduces systematic artifacts in structure and dynamics. Also: forgetting the self-energy correction when computing absolute Coulomb energies manually.

!!! note "Simulation Note"
    For pure metal simulations with EAM potentials (no partial charges), PME is unnecessary. For any organic molecule, water model, ionic system, or protein: PME is mandatory.

---

## Takeaway

Never truncate Coulomb interactions for charged or polar systems. Use PME. It's fast, it's in every major code, and the alternative introduces systematic errors with no obvious warning signs.
