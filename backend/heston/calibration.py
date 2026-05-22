import numpy as np
from scipy.optimize import minimize
from .pricer import HestonParams, heston_fft_calls


# ── Parameter bounds ────────────────────────────────────────────────
# kappa : (0.01, 20)   — mean reversion speed
# theta : (0.001, 2)   — long-run variance  (√2 ≈ 141% long-run vol)
# sigma : (0.01, 2)    — vol of vol
# rho   : (-0.999, 0)  — correlation (equity skew is always negative)
# v0    : (0.001, 2)   — initial variance

BOUNDS = [
    (0.01,  20.0),
    (0.001,  2.0),
    (0.01,   2.0),
    (-0.999, 0.0),
    (0.001,  2.0),
]

# Sensible starting point — roughly ATM SPX-like params
INITIAL_PARAMS = [1.5, 0.04, 0.3, -0.7, 0.04]


def _make_objective(
    market_strikes: np.ndarray,
    market_maturities: np.ndarray,
    market_prices: np.ndarray,
    S0: float,
    r: float,
    q: float,
):
    """
    Returns a scalar objective function for the optimizer.

    market_strikes     : (N,) array of strikes
    market_maturities  : (N,) array of maturities in years
    market_prices      : (N,) array of market call prices
    """
    unique_maturities = np.unique(market_maturities)

    def objective(params: list) -> float:
        kappa, theta, sigma, rho, v0 = params

        # Feller penalty — soft constraint to keep variance positive
        feller = 2 * kappa * theta - sigma ** 2
        penalty = 0.0
        if feller < 0:
            penalty = 1e4 * (feller ** 2)

        p = HestonParams(
            kappa=kappa,
            theta=theta,
            sigma=sigma,
            rho=rho,
            v0=v0,
        )

        total_error = 0.0

        # Price each maturity slice in one FFT pass
        for T in unique_maturities:
            mask = market_maturities == T
            K_market = market_strikes[mask]
            C_market = market_prices[mask]

            K_grid, C_grid = heston_fft_calls(S0, T, r, q, p)

            # Interpolate model prices at market strikes
            C_model = np.interp(K_market, K_grid, C_grid)

            total_error += np.sum((C_model - C_market) ** 2)

        return total_error + penalty

    return objective


def calibrate(
    market_strikes: np.ndarray,
    market_maturities: np.ndarray,
    market_prices: np.ndarray,
    S0: float,
    r: float,
    q: float,
    initial_params: list = None,
) -> dict:
    """
    Calibrate Heston parameters to market option prices.

    Parameters
    ----------
    market_strikes     : (N,) array of strikes
    market_maturities  : (N,) array of maturities (years)
    market_prices      : (N,) array of market call prices
    S0                 : spot price
    r                  : risk-free rate
    q                  : dividend yield
    initial_params     : optional starting guess [kappa, theta, sigma, rho, v0]

    Returns
    -------
    dict with keys:
        params     : HestonParams (best fit)
        error      : final objective value
        success    : bool
        method     : which optimizer succeeded
        iterations : number of iterations
    """
    market_strikes    = np.asarray(market_strikes,    dtype=float)
    market_maturities = np.asarray(market_maturities, dtype=float)
    market_prices     = np.asarray(market_prices,     dtype=float)

    x0 = initial_params if initial_params is not None else INITIAL_PARAMS
    objective = _make_objective(
        market_strikes, market_maturities, market_prices, S0, r, q
    )

    # ── Attempt 1: L-BFGS-B (fast, gradient-based, respects bounds) ──
    result = minimize(
        objective,
        x0,
        method="L-BFGS-B",
        bounds=BOUNDS,
        options={"maxiter": 1000, "ftol": 1e-12, "gtol": 1e-8},
    )

    # ── Attempt 2: Nelder-Mead fallback (derivative-free, more robust) ──
    if not result.success or result.fun > 1e-4:
        result_nm = minimize(
            objective,
            result.x,          # warm-start from L-BFGS-B result
            method="Nelder-Mead",
            options={"maxiter": 10000, "xatol": 1e-6, "fatol": 1e-8},
        )
        if result_nm.fun < result.fun:
            result = result_nm
            method = "Nelder-Mead"
        else:
            method = "L-BFGS-B (Nelder-Mead did not improve)"
    else:
        method = "L-BFGS-B"

    kappa, theta, sigma, rho, v0 = result.x

    return {
        "params": HestonParams(
            kappa=float(kappa),
            theta=float(theta),
            sigma=float(sigma),
            rho=float(rho),
            v0=float(v0),
        ),
        "error":      float(result.fun),
        "success":    bool(result.success),
        "method":     method,
        "iterations": int(result.nit),
    }