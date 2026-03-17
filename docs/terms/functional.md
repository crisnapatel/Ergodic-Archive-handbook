# Functional

> **Definition:** A mapping from a function to a scalar number. Where an ordinary function maps numbers to numbers ($f: \mathbb{R} \to \mathbb{R}$), a functional maps entire functions to numbers ($F[g]: \text{function} \to \mathbb{R}$). In DFT, the total energy is a functional of the electron density, written $E[\rho]$: given any density distribution $\rho(\mathbf{r})$, $E[\rho]$ returns a single energy value. The exchange-correlation energy $E_{xc}[\rho]$ is the specific functional that must be approximated in practice. The notation $[\cdot]$ denotes a functional argument by convention.

A functional is just a function that eats other functions. You feed it an entire curve or field as input, and it spits out one number. That's the whole idea. Everything else in DFT notation builds on this.

---

## Hook

You open a DFT paper and see $E[\rho]$, $V_{xc}[\rho]$, $\delta E / \delta \rho$. What is that bracket notation? Why does the energy take a function as an argument instead of a number? Nobody explains this. It's treated as something you should already know. You don't. Here's what it actually means.

---

## Why should you care?

DFT is built on the idea that the total energy is a functional of the electron density. If you don't know what a functional is, you can't read DFT literature, understand what the SCF loop is minimizing, or make sense of why $E_{xc}[\rho]$ is an unsolvable object that has to be approximated. The bracket notation shows up everywhere.

---

## The wrong intuition

"$E[\rho]$ is just the energy evaluated at the density."

Not quite. $\rho(\mathbf{r})$ is not a number — it is a function that varies continuously across all of space. $E[\rho]$ takes that entire spatial distribution as its argument. Change the density at any point and the energy changes. The functional $E[\rho]$ encodes how the energy responds to the full shape of the density, not just its value at one location.

---

## The explanation

Start with something familiar. The function $f(x) = x^2$ takes a number $x$ and returns a number. Simple.

Now consider the length of a curve. Give me any path $y(x)$ in 2D, and I can compute its arc length:

$$
L[y] = \int_a^b \sqrt{1 + \left(\frac{dy}{dx}\right)^2}\, dx
$$

$L$ takes the entire function $y(x)$ as input and returns one number (the length). That is a functional. The input is not a number; it is a shape.

In DFT the same structure applies. The electron density $\rho(\mathbf{r})$ is a function defined everywhere in space — how many electrons per unit volume at each point. The total energy functional:

$$
E[\rho] = T_s[\rho] + E_H[\rho] + E_{xc}[\rho] + E_\text{ext}[\rho]
$$

takes $\rho(\mathbf{r})$ as input and returns the total energy. Each term is itself a functional of $\rho$. The kinetic energy of the non-interacting electrons $T_s[\rho]$, the Hartree repulsion $E_H[\rho]$, the exchange-correlation $E_{xc}[\rho]$, and the nuclear potential $E_\text{ext}[\rho]$ — all of them are numbers that depend on the shape of $\rho(\mathbf{r})$.

**Functional derivative.** The ordinary derivative $df/dx$ tells you how $f$ changes when you nudge $x$ by a small amount. The functional derivative $\delta E / \delta \rho(\mathbf{r})$ tells you how $E[\rho]$ changes when you nudge the density at the point $\mathbf{r}$ by a small amount $\delta\rho(\mathbf{r})$. This is the exchange-correlation potential:

$$
V_{xc}(\mathbf{r}) = \frac{\delta E_{xc}[\rho]}{\delta \rho(\mathbf{r})}
$$

It's a function of position, telling you how the XC energy responds to adding a tiny bit of density at each point in space. This is what the code computes and adds to the Kohn-Sham potential at each SCF step.

---

## Reality check

You never explicitly call "the functional" in QE or VASP. You choose it via `input_dft = 'PBE'` or `GGA = PE`. The code has the functional $E_{xc}[\rho]$ hardcoded as a numerical recipe; it evaluates it on the charge density grid at each SCF iteration, computes $V_{xc}(\mathbf{r})$ via the functional derivative, and adds it to the Kohn-Sham potential.

The charge density grid (`ecutrho` in QE, or `NGXF/NGYF/NGZF` in VASP) is where $\rho(\mathbf{r})$ lives numerically. Denser grid means more accurate evaluation of the functional.

---

## Takeaway

A functional maps a function to a number. $E[\rho]$ is the total energy as a functional of the electron density — the full spatial distribution of electrons, not just one value. Every DFT approximation is an approximation for $E_{xc}[\rho]$, the one functional nobody knows the exact form of.
