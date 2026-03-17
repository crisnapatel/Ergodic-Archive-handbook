# Electron Density

> **Definition:** The probability distribution of electrons in real space, defined as the expectation value of the electron number density operator. In DFT, the electron density $\rho(\mathbf{r})$ is the primary variable: by the Hohenberg-Kohn theorem, all ground-state properties of a system are uniquely determined by $\rho(\mathbf{r})$ alone. In a Kohn-Sham calculation, it is constructed as the sum of squared orbital moduli over all occupied states: $\rho(\mathbf{r}) = \sum_n f_n |\psi_{n\mathbf{k}}(\mathbf{r})|^2$. The SCF loop converges when the input and output electron densities are self-consistent.

The electron density is the central object of DFT. Not the wavefunction. Not the Hamiltonian. The density. Three coordinates, one number at each point in space, and somehow that is enough to determine everything about the ground state of your system. That result is shocking and it took a Nobel Prize to prove it.

---

## Hook

Quantum mechanics says you need the full N-electron wavefunction to describe a system — a function of $3N$ coordinates for $N$ electrons. For iron with 26 electrons, that is a function of 78 variables. For a 100-atom simulation cell that is tens of thousands of variables. Nobody can work with that directly.

Then Hohenberg and Kohn (1964) proved that you don't need it. The ground-state density — a function of just 3 spatial coordinates — contains everything. All of it. That is either deeply satisfying or deeply unsettling depending on your mood. Let's unpack why it's true.

---

## Why should you care?

The electron density is what your DFT code actually computes, stores, and converges. It is what you visualize in VESTA when you look at charge density plots, differential charge density, or electron localization functions. When an SCF cycle converges, it means the density stopped changing. When it doesn't converge, the density is oscillating. Understanding what the density is makes all of that concrete.

---

## The wrong intuition

"The electron density is a simplified version of the wavefunction."

It is not a simplification. The Hohenberg-Kohn theorem says the density is exactly equivalent to the full wavefunction for ground-state properties. There is no information lost. The density uniquely determines the external potential (up to a constant), which determines the Hamiltonian, which determines all eigenstates including the ground state. The density is not less than the wavefunction. It is a different way of encoding the same information.

---

## The explanation

**What the density is.** For a system with $N$ electrons described by a many-body wavefunction $\Psi(\mathbf{r}_1, \mathbf{r}_2, \ldots, \mathbf{r}_N)$, the electron density at position $\mathbf{r}$ is:

$$
\rho(\mathbf{r}) = N \int |\Psi(\mathbf{r}, \mathbf{r}_2, \ldots, \mathbf{r}_N)|^2\, d\mathbf{r}_2 \cdots d\mathbf{r}_N
$$

You're integrating out all but one electron coordinate. The result is the probability of finding any electron at $\mathbf{r}$, times $N$. So $\rho(\mathbf{r})$ has units of electrons per volume, and integrates to $N$:

$$
\int \rho(\mathbf{r})\, d\mathbf{r} = N
$$

**How Kohn-Sham builds it.** Instead of working with the true many-body $\Psi$, Kohn-Sham maps the problem onto $N$ single-particle orbitals $\psi_{n\mathbf{k}}(\mathbf{r})$. The density is then assembled as:

$$
\rho(\mathbf{r}) = \sum_{n, \mathbf{k}} f_{n\mathbf{k}} |\psi_{n\mathbf{k}}(\mathbf{r})|^2
$$

where $f_{n\mathbf{k}}$ is the occupation of orbital $n$ at k-point $\mathbf{k}$. This sum runs over all occupied bands and all k-points in the Brillouin zone. The density is a real-space scalar field, stored on a discrete grid in the code.

**The SCF loop.** The effective potential $V_{KS}[\rho]$ depends on the density (via the Hartree and XC terms). But solving the Kohn-Sham equations gives you new orbitals, which give you a new density. The new density gives a new potential, which gives new orbitals, and so on. This is why it is self-consistent: the density that goes in must match the density that comes out.

---

## Reality check

In VASP, the converged charge density is written to `CHGCAR`. You can restart from it with `ICHARG = 1`, skipping the initial SCF iterations. This is why restarting a VASP calculation from a previous `CHGCAR` converges much faster — you're starting the SCF loop from an already-reasonable density.

In QE, the charge density is stored in the `charge-density.dat` file in the `outdir`. Visualize it in VESTA by converting the charge density output to a `.cube` or `.xsf` format.

The `ecutrho` parameter in QE (and `NGXF` in VASP) controls the grid resolution on which $\rho(\mathbf{r})$ is stored. For USPP, this grid needs to be 4–8x finer than the wavefunction grid because the augmentation charges are harder to represent.

!!! note "Key Insight"
    The difference between the converged density and a superposition of atomic densities is the differential charge density — it directly shows you charge transfer between atoms. This is one of the most physically informative quantities you can extract from a DFT calculation, and it costs nothing extra once the SCF is converged.

---

## Takeaway

The electron density is the fundamental object in DFT. Three spatial coordinates, one scalar per point, integrates to $N$ electrons, and by Hohenberg-Kohn it contains everything about the ground state. The SCF loop is the process of finding the density that is consistent with itself.
