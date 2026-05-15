# Heston Model Pricer

An interactive, fully deployed options pricing web app built on the Heston stochastic volatility model.

## What is this?

Black-Scholes prices options assuming volatility is constant — but real markets disagree. Implied volatility varies across strikes and expiries, forming the well-known **volatility smile**. The Heston model fixes this by letting volatility be random and mean-reverting, producing a smile that actually fits market data.

This project implements the full Heston pricing pipeline: from the mathematical model to a live, interactive web app anyone can use.

## What it does

- Price European options under the Heston stochastic volatility model
- Calibrate Heston parameters to real market option prices
- Visualise the implied volatility surface in 3D
- Display option Greeks (delta, gamma, vega, rho) under stochastic vol

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Math | NumPy, SciPy |
| Database | Supabase |
| Frontend deploy | Vercel |
| Backend deploy | Render |

> Heavy computation (characteristic function inversion, calibration) runs server-side in Python. Simple calculations are handled client-side in JS.

## The math

The Heston model describes two coupled stochastic processes:

```
dS = μS dt + √v · S dW₁          (asset price)
dv = κ(θ − v) dt + σ√v dW₂       (variance)

where: corr(dW₁, dW₂) = ρ
```

**Parameters:**
- `κ` — speed of mean reversion
- `θ` — long-run variance
- `σ` — volatility of volatility
- `ρ` — correlation between asset and variance shocks
- `v₀` — initial variance

Pricing is done via the **characteristic function** and **Gil-Pelaez inversion**. Calibration fits these 5 parameters to market prices using least-squares optimisation (`scipy.optimize`).

## Project status

This project is being built in phases:

- [x] Phase 1 — Understand the math (Black-Scholes → Heston fundamentals → pricing & calibration)
- [ ] Phase 2 — Python backend (Heston pricer + FastAPI endpoints)
- [ ] Phase 3 — React frontend (input panels, 3D vol surface, Greeks dashboard)
- [ ] Phase 4 — Polish (Supabase sessions, clean UI, custom domain)

## Why this project?

Most quant portfolios live in Jupyter notebooks. This one is deployed, interactive, and accessible to anyone with a browser — no Python environment required. The goal is a production-grade tool that demonstrates the full stack: stochastic calculus, numerical methods, API design, and modern frontend development.

## Resources

- Heston, S.L. (1993) — *A Closed-Form Solution for Options with Stochastic Volatility*
- Gatheral, J. — *The Volatility Surface: A Practitioner's Guide*
- Rouah, F.D. — *The Heston Model and its Extensions in Matlab and C#*