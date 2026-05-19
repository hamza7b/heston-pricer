# Heston Pricer

A fully deployed, interactive options pricer built on the Heston stochastic volatility model. Price European calls and puts and visualize the implied volatility surface in 3D — live, in the browser.

**[Live Demo →](https://heston-pricer.vercel.app)** &nbsp;|&nbsp; **[API Docs →](https://heston-pricer.onrender.com/docs)**

---

## What it does

- Prices European call and put options using the **Heston (1993)** stochastic volatility model
- Computes option prices via the **Carr-Madan FFT** method (fast, quasi-closed-form)
- Renders a live **3D implied volatility surface** across strikes and maturities
- Exposes a clean **REST API** (FastAPI) for programmatic access

---

## The Math

Black-Scholes assumes constant volatility — but real markets show a **volatility smile**: implied vol varies with strike and maturity. The Heston model fixes this by letting volatility itself be stochastic.

### The two SDEs

$$dS_t = rS_t \, dt + \sqrt{v_t} \, S_t \, dW^1_t$$

$$dv_t = \kappa(\theta - v_t) \, dt + \sigma \sqrt{v_t} \, dW^2_t, \quad dW^1_t dW^2_t = \rho \, dt$$

The variance process $v_t$ is a **CIR mean-reverting process** — it pulls back toward a long-run level $\theta$ at speed $\kappa$, with vol-of-vol $\sigma$.

### The five parameters

| Parameter | Meaning |
|-----------|---------|
| $\kappa$ | Mean reversion speed of variance |
| $\theta$ | Long-run variance |
| $\sigma$ | Volatility of variance (vol of vol) |
| $\rho$ | Correlation between asset and variance (typically negative — the leverage effect) |
| $v_0$ | Initial variance |

### Pricing via Carr-Madan FFT

Since the Heston characteristic function $\phi_T(u) = \mathbb{E}[e^{iu \ln S_T}]$ is known in closed form, we can price options without Monte Carlo simulation. The Carr-Madan method applies a Fourier transform to the damped call price and inverts it via FFT — pricing a whole strike grid in one pass at $O(N \log N)$.

The implementation uses the **Little Heston Trap** parametrization (Albrecher et al.) for numerical stability.

---

## Stack

| Layer | Tech | Hosting |
|-------|------|---------|
| Frontend | React + Vite + Plotly | Vercel |
| Backend | FastAPI + NumPy + SciPy | Render |
| Auth & DB | Supabase | Supabase cloud |

---

## Project Structure

```
heston_pricer/
├── frontend/               # React + Vite
│   └── src/
│       └── App.jsx         # Pricing form + 3D vol surface
└── backend/                # FastAPI
    ├── main.py             # API endpoints
    └── heston/
        ├── pricer.py       # Heston characteristic function + Carr-Madan FFT
        ├── black_scholes.py # BS pricer + implied vol inversion (Brent)
        └── calibration.py  # (coming soon)
```

---

## Running locally

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn numpy scipy pydantic
uvicorn main:app --reload
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

---

## API

### `POST /price`
Price a single European option.

```bash
curl -X POST http://localhost:8000/price \
  -H "Content-Type: application/json" \
  -d '{
    "S0": 100, "K": 100, "T": 1.0,
    "r": 0.05, "q": 0.0,
    "kappa": 1.5, "theta": 0.04,
    "sigma": 0.3, "rho": -0.7, "v0": 0.04,
    "option_type": "call"
  }'
```

```json
{ "price": 10.3627, "option_type": "call", "S0": 100, "K": 100, "T": 1.0 }
```

### `POST /surface`
Compute the implied volatility surface across a 20×6 grid of strikes and maturities.

```json
{
  "strikes": [70.0, ..., 130.0],
  "maturities": [0.25, 0.5, 0.75, 1.0, 1.5, 2.0],
  "surface": [[26.88, ...], ...]
}
```

---

## Roadmap

- [x] Heston pricer (Carr-Madan FFT)
- [x] Implied volatility surface
- [ ] Calibration to market data (scipy least-squares)
- [ ] Greeks (delta, vega, gamma)
- [ ] Supabase: save and load calibration sessions
- [ ] Deploy to Vercel + Render

---

## References

- Heston, S. (1993). *A closed-form solution for options with stochastic volatility*
- Carr, P. & Madan, D. (1999). *Option valuation using the fast Fourier transform*
- Albrecher, H. et al. (2007). *The little Heston trap*
- Gatheral, J. *The Volatility Surface: A Practitioner's Guide*
- Rouah, F. *The Heston Model and its Extensions in Finance and Economics*