# Ergodic Archive

**A personal glossary for atomic-scale simulation.**

---

All possible states of knowledge — that's what *ergodic* means. This handbook is an attempt to visit as many of them as I can. It's not a textbook. It's not trying to teach you from scratch.

It's for the practitioner — someone who has run MD simulations, stared at a DFT output file, debugged a LAMMPS input — but can't keep every concept sharp in their head all the time. That's not a failure; that's just how human memory works. The goal here is to have *your own* place to look things up, in a voice that actually sounds like someone explaining it at a whiteboard, not a committee writing a manual.

## How to use this

**Quick lookup → [Glossary](glossary.md)**
All terms on one page with precise technical definitions. Searchable. Use this when you just need to verify a definition fast.

**Want more → click any term**
Every glossary entry links to a deep-dive page. That's where the analogies, the intuition, the common mistakes, and the illustrations live.

## What's in here

Concepts spanning classical MD, DFT, and Monte Carlo:

- Statistical mechanics fundamentals (ergodicity, equipartition, ensembles)
- MD mechanics (PBC, MIC, cutoff, thermostats, integrators)
- Structural analysis (RDF, MSD, diffusion)
- DFT foundations (Born-Oppenheimer, Kohn-Sham, XC functionals, pseudopotentials, k-points)
- Advanced (Ewald summation, free energy methods, energy minimization)

## Tools used

Simulations: LAMMPS, Quantum ESPRESSO, VASP
Illustrations: Python (`Analysis` conda env, matplotlib)
This site: MkDocs + Material theme, hosted on GitHub Pages

---

*Built by Krishna · [GitHub](https://github.com/crisnapatel/Ergodic-Archive-handbook)*
