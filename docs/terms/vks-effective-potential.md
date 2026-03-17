# Kohn-Sham Effective Potential

> **Definition:** The total single-particle potential in which fictitious non-interacting Kohn-Sham electrons move, constructed as the sum of three contributions: the external potential from nuclei $V_\text{ext}$, the classical Hartree potential from electron-electron repulsion $V_H[\rho]$, and the exchange-correlation potential $V_{xc}[\rho] = \delta E_{xc}/\delta\rho$. Because all three terms depend on the electron density, $V_{KS}$ must be updated self-consistently at each SCF cycle. The quality of $V_{xc}$ determines the accuracy of the total potential and all derived properties.

The Kohn-Sham effective potential is the environment every Kohn-Sham electron thinks it lives in. It is not the real potential — real electrons interact with each other quantum mechanically in ways that are not captured by any simple potential. But it is the best effective one-body potential you can construct such that the electrons moving in it produce the correct density. The approximation is entirely in the $V_{xc}$ piece. Get that right and you get everything right. That's the unsolved problem.

---

## Hook

Every SCF iteration in QE or VASP does the same thing: build $V_{KS}$, solve the Kohn-Sham equations, get a new density, build a new $V_{KS}$, repeat. But what is $V_{KS}$ made of? Three terms, each physically distinct, each computed differently. Understanding them is understanding why DFT works and where it fails.

---

## Why should you care?

When your SCF doesn't converge, it is usually because $V_{KS}$ is oscillating — the density update makes the potential worse, which makes the density worse, and so on. This is charge sloshing. Knowing the three components of $V_{KS}$ tells you which one is causing trouble (almost always the Hartree or XC term in metallic systems) and which mixing schemes help.

---

## The wrong intuition

"The Kohn-Sham potential is just the nuclear potential plus some corrections."

The Hartree term is not a small correction — for many electrons, the classical electron-electron repulsion is enormous, often comparable in magnitude to the nuclear attraction. The XC term is smaller but physically the most subtle: it carries all the quantum effects that make DFT non-trivial. Without it, you would have Hartree theory, which overbinds and gives wrong bond lengths.

---

## The explanation

**The three terms.** The Kohn-Sham potential is:

$$
V_{KS}(\mathbf{r}) = V_\text{ext}(\mathbf{r}) + V_H(\mathbf{r}) + V_{xc}(\mathbf{r})
$$

**External potential $V_\text{ext}$.** The Coulomb attraction from all nuclei at their current positions. Fixed for a given ionic configuration. In pseudopotential DFT, this is replaced by a smooth pseudopotential that mimics the core region. Does not depend on the density; it is the same at every SCF step (for fixed ions).

**Hartree potential $V_H$.** The classical electrostatic repulsion from the electron density itself:

$$
V_H(\mathbf{r}) = \int \frac{\rho(\mathbf{r}')}{|\mathbf{r} - \mathbf{r}'|}\, d\mathbf{r}'
$$

Each electron sees the mean-field repulsion from all other electrons, approximated as a classical charge distribution. This is a self-consistent term — it depends on $\rho(\mathbf{r})$, which changes every SCF iteration. In Fourier space, this convolution becomes a multiplication, which is why plane-wave codes evaluate $V_H$ in reciprocal space using FFTs. This term also includes a self-interaction: each electron partially repels itself, an unphysical artifact that the XC term should cancel (and approximately does in good functionals).

**Exchange-correlation potential $V_{xc}$.** The functional derivative of $E_{xc}[\rho]$:

$$
V_{xc}(\mathbf{r}) = \frac{\delta E_{xc}[\rho]}{\delta \rho(\mathbf{r})}
$$

This captures the quantum effects: the Pauli exclusion (exchange) that keeps same-spin electrons apart, and the correlated motion of electrons beyond the mean field (correlation). For LDA, $V_{xc}(\mathbf{r})$ depends only on $\rho(\mathbf{r})$ at that point. For GGA, it also depends on $\nabla\rho(\mathbf{r})$. For hybrids, a fraction of exact (Hartree-Fock) exchange is mixed in — nonlocal, more expensive, more accurate.

**Why self-consistency is required.** Both $V_H$ and $V_{xc}$ depend on $\rho(\mathbf{r})$. The density in turn comes from the Kohn-Sham orbitals, which come from solving the equations with $V_{KS}$. The loop is: guess $\rho$ → build $V_{KS}$ → solve for orbitals → compute new $\rho$ → repeat. Convergence means the output $\rho$ equals the input $\rho$ to within the SCF threshold.

---

## Reality check

In QE, the SCF threshold is set by `conv_thr` in `&ELECTRONS`. Default is `1.0d-6` Ry. For geometry relaxation or phonon calculations, tighten to `1.0d-8` — looser thresholds mean noisy forces and incorrect relaxed structures.

When SCF diverges (charge sloshing), the fix is density mixing:

```
&ELECTRONS
  mixing_mode = 'plain'     ! or 'TF' (Thomas-Fermi) for metals
  mixing_beta = 0.3         ! smaller = more conservative mixing, slower but stable
/
```

Charge sloshing is most common in metallic systems where the Hartree term is large and the density changes rapidly near the Fermi level. Reducing `mixing_beta` from the default 0.7 to 0.2–0.4 usually fixes it.

In VASP: `AMIX`, `BMIX`, `AMIN` control the same thing. `ALGO = All` or `ALGO = Damped` with `TIME = 0.4` is often more stable for metals than the default Blocked Davidson.

!!! note "Key Insight"
    The Hartree potential is evaluated in reciprocal space for efficiency — the convolution integral $\int \rho(\mathbf{r}')/|\mathbf{r}-\mathbf{r}'| d\mathbf{r}'$ becomes a simple multiplication $V_H(\mathbf{G}) = 4\pi\rho(\mathbf{G})/G^2$ after Fourier transform. This is one reason why plane-wave codes are efficient for periodic systems.

---

## Takeaway

$V_{KS}$ has three pieces: nuclear potential (fixed), Hartree repulsion (density-dependent, handles classical electron-electron interaction), and XC potential (density-dependent, handles everything quantum). Self-consistency is required because two of the three pieces depend on what you're solving for.
