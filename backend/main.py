from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from heston.pricer import HestonParams, heston_call_price, heston_put_price, heston_fft_calls
from heston.black_scholes import implied_vol
import numpy as np

app = FastAPI(title="Heston Pricer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your Vercel URL before going live
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- request / response schemas ----------

class PriceRequest(BaseModel):
    S0: float = Field(..., gt=0, description="Spot price")
    K: float  = Field(..., gt=0, description="Strike price")
    T: float  = Field(..., gt=0, description="Time to maturity in years")
    r: float  = Field(...,       description="Risk-free rate (e.g. 0.05)")
    q: float  = Field(0.0,       description="Continuous dividend yield")
    # Heston parameters
    kappa: float = Field(..., gt=0, description="Mean reversion speed")
    theta: float = Field(..., gt=0, description="Long-run variance")
    sigma: float = Field(..., gt=0, description="Vol of vol")
    rho:   float = Field(..., ge=-1, le=1, description="Correlation ρ ∈ [-1, 1]")
    v0:    float = Field(..., gt=0, description="Initial variance")
    # option type
    option_type: Literal["call", "put"] = Field("call", description="'call' or 'put'")


class SurfaceRequest(BaseModel):
    S0: float = Field(..., gt=0, description="Spot price")
    r: float  = Field(...,       description="Risk-free rate (e.g. 0.05)")
    q: float  = Field(0.0,       description="Continuous dividend yield")
    # Heston parameters
    kappa: float = Field(..., gt=0, description="Mean reversion speed")
    theta: float = Field(..., gt=0, description="Long-run variance")
    sigma: float = Field(..., gt=0, description="Vol of vol")
    rho:   float = Field(..., ge=-1, le=1, description="Correlation ρ ∈ [-1, 1]")
    v0:    float = Field(..., gt=0, description="Initial variance")


class PriceResponse(BaseModel):
    price: float
    option_type: str
    S0: float
    K: float
    T: float


# ---------- endpoints ----------

@app.get("/")
def root():
    return {"status": "ok", "message": "Heston Pricer API is running"}


@app.post("/price", response_model=PriceResponse)
def price_option(req: PriceRequest):
    p = HestonParams(
        kappa=req.kappa,
        theta=req.theta,
        sigma=req.sigma,
        rho=req.rho,
        v0=req.v0,
    )

    try:
        if req.option_type == "call":
            price = heston_call_price(req.S0, req.K, req.T, req.r, req.q, p)
        else:
            price = heston_put_price(req.S0, req.K, req.T, req.r, req.q, p)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return PriceResponse(
        price=price,
        option_type=req.option_type,
        S0=req.S0,
        K=req.K,
        T=req.T,
    )

@app.post("/surface")
def vol_surface(req: SurfaceRequest):
    p = HestonParams(
        kappa=req.kappa, theta=req.theta,
        sigma=req.sigma, rho=req.rho, v0=req.v0
    )

    strikes = np.linspace(req.S0 * 0.7, req.S0 * 1.3, 20)
    maturities = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0]

    surface = []
    for T in maturities:
        K_grid, C_grid = heston_fft_calls(req.S0, T, req.r, req.q, p)
        row = []
        for K in strikes:
            price = float(np.interp(K, K_grid, C_grid))
            iv = implied_vol(price, req.S0, K, T, req.r, req.q)
            row.append(round(iv * 100, 4) if not np.isnan(iv) else None)
        surface.append(row)

    return {
        "strikes": strikes.tolist(),
        "maturities": maturities,
        "surface": surface
    }