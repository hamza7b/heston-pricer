import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq


def bs_call(S, K, T, r, sigma, q=0.0):
    """Black-Scholes call price."""
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * np.exp(-q * T) * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)


def implied_vol(price, S, K, T, r, q=0.0):
    """Invert BS to find implied vol. Returns NaN if it can't converge."""
    intrinsic = max(S * np.exp(-q * T) - K * np.exp(-r * T), 0)
    if price <= intrinsic + 1e-6:
        return np.nan
    try:
        return brentq(
            lambda sigma: bs_call(S, K, T, r, sigma, q) - price,
            1e-6, 10.0, xtol=1e-6, maxiter=200
        )
    except (ValueError, RuntimeError):
        return np.nan