import numpy as np
from dataclasses import dataclass


@dataclass
class HestonParams:
    kappa: float  # mean reversion speed
    theta: float  # long-run variance
    sigma: float  # volatility of variance (vol of vol)
    rho: float    # correlation between asset and variance processes
    v0: float     # initial variance


def heston_cf(u, T: float, S0: float, r: float, q: float, p: HestonParams):
    """
    Heston characteristic function φ(u) = E[exp(i·u·ln(S_T))] under Q.
    Uses the 'Little Heston Trap' parametrization for numerical stability.
    u can be a scalar or numpy array.
    """
    i = 1j
    x0 = np.log(S0)
    a  = p.kappa * p.theta
    b  = p.kappa - p.rho * p.sigma * i * u
    d  = np.sqrt(b * b + (p.sigma ** 2) * (i * u + u * u))
    g  = (b - d) / (b + d)

    eDT = np.exp(-d * T)
    one_minus_g_eDT = 1 - g * eDT
    one_minus_g     = 1 - g

    # numerical guards against division by zero
    one_minus_g_eDT = np.where(np.abs(one_minus_g_eDT) < 1e-15, 1e-15, one_minus_g_eDT)
    one_minus_g     = np.where(np.abs(one_minus_g)     < 1e-15, 1e-15, one_minus_g)

    C = i * u * (r - q) * T + (a / p.sigma ** 2) * (
        (b - d) * T - 2.0 * np.log(one_minus_g_eDT / one_minus_g)
    )
    D = ((b - d) / p.sigma ** 2) * ((1 - eDT) / one_minus_g_eDT)

    return np.exp(C + D * p.v0 + i * u * x0)


def _simpson_weights(N: int) -> np.ndarray:
    """Simpson quadrature weights on an N-point uniform grid (N must be even)."""
    if N % 2 != 0:
        raise ValueError("N must be even for Simpson weights.")
    w = np.ones(N)
    w[1:N - 1:2] = 4
    w[2:N - 2:2] = 2
    return w


def heston_fft_calls(
    S0: float,
    T: float,
    r: float,
    q: float,
    p: HestonParams,
    N: int = 4096,
    eta: float = 0.25,
    alpha: float = 1.5,
):
    """
    Carr-Madan FFT: returns call prices across an entire strike grid.

    Parameters
    ----------
    S0    : spot price
    T     : time to maturity (in years)
    r     : risk-free rate
    q     : continuous dividend yield (use 0 if none)
    p     : HestonParams
    N     : FFT grid size (power of 2, must be even)
    eta   : frequency step Δv
    alpha : damping parameter (>0, typically 1.5)

    Returns
    -------
    K : (N,) array of strikes in ascending order
    C : (N,) array of call prices for each K
    """
    n   = np.arange(N)
    v   = eta * n  # frequency grid

    i = 1j
    phi_shift = heston_cf(v - (alpha + 1) * i, T, S0, r, q, p)
    denom = alpha ** 2 + alpha - v ** 2 + i * (2 * alpha + 1) * v
    psi   = np.exp(-r * T) * phi_shift / denom

    w = _simpson_weights(N) * (eta / 3.0)

    lam = 2.0 * np.pi / (N * eta)  # log-strike step Δk
    b   = 0.5 * N * lam            # half-width in log-strike space

    x = psi * np.exp(1j * b * v) * w
    F = np.real(np.fft.fft(x))

    j = np.arange(N)
    k = -b + j * lam   # k = ln(K)
    K = np.exp(k)

    calls = np.exp(-alpha * k) / np.pi * F
    order = np.argsort(K)
    return K[order], np.maximum(calls[order], 0.0)


def heston_call_price(
    S0: float, K: float, T: float, r: float, q: float, p: HestonParams,
    N: int = 4096, eta: float = 0.25, alpha: float = 1.5,
) -> float:
    """Price a single European call via FFT + linear interpolation."""
    K_grid, C_grid = heston_fft_calls(S0, T, r, q, p, N=N, eta=eta, alpha=alpha)
    if K <= K_grid[0]:
        return float(C_grid[0])
    if K >= K_grid[-1]:
        return float(C_grid[-1])
    idx = np.searchsorted(K_grid, K)
    x0, x1 = K_grid[idx - 1], K_grid[idx]
    y0, y1 = C_grid[idx - 1], C_grid[idx]
    return float(y0 + (y1 - y0) * (K - x0) / (x1 - x0))


def heston_put_price(
    S0: float, K: float, T: float, r: float, q: float, p: HestonParams,
    N: int = 4096, eta: float = 0.25, alpha: float = 1.5,
) -> float:
    """Price a single European put via put-call parity."""
    C = heston_call_price(S0, K, T, r, q, p, N=N, eta=eta, alpha=alpha)
    return float(C - S0 * np.exp(-q * T) + K * np.exp(-r * T))