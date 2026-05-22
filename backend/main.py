from typing import Literal
import yfinance as yf

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from heston.pricer import HestonParams, heston_call_price, heston_put_price, heston_fft_calls
from heston.black_scholes import implied_vol
from heston.calibration import calibrate as run_calibration
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

class CalibrationRequest(BaseModel):
    S0: float = Field(..., gt=0, description="Spot price")
    r:  float = Field(...,       description="Risk-free rate")
    q:  float = Field(0.0,       description="Dividend yield")
    strikes:    list[float] = Field(..., description="Market strikes")
    maturities: list[float] = Field(..., description="Maturities in years (same length as strikes)")
    prices:     list[float] = Field(..., description="Market call prices (same length as strikes)")
    initial_params: list[float] | None = Field(None, description="Optional starting guess [kappa, theta, sigma, rho, v0]")

class CalibrationResponse(BaseModel):
    kappa:      float
    theta:      float
    sigma:      float
    rho:        float
    v0:         float
    error:      float
    success:    bool
    method:     str
    iterations: int


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

@app.post("/calibrate", response_model=CalibrationResponse)
def calibrate_model(req: CalibrationRequest):
    if not (len(req.strikes) == len(req.maturities) == len(req.prices)):
        raise HTTPException(
            status_code=422,
            detail="strikes, maturities and prices must all have the same length."
        )
    if len(req.strikes) < 5:
        raise HTTPException(
            status_code=422,
            detail="At least 5 market options are required for calibration."
        )

    try:
        result = run_calibration(
            market_strikes=np.array(req.strikes),
            market_maturities=np.array(req.maturities),
            market_prices=np.array(req.prices),
            S0=req.S0,
            r=req.r,
            q=req.q,
            initial_params=req.initial_params,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    p = result["params"]
    return CalibrationResponse(
        kappa=round(p.kappa, 6),
        theta=round(p.theta, 6),
        sigma=round(p.sigma, 6),
        rho=round(p.rho,   6),
        v0=round(p.v0,     6),
        error=round(result["error"], 8),
        success=result["success"],
        method=result["method"],
        iterations=result["iterations"],
    )

@app.get("/options/{ticker}")
def get_option_chain(ticker: str):
    try:
        tk = yf.Ticker(ticker)
        spot = tk.fast_info["lastPrice"]
        if not spot:
            raise HTTPException(status_code=404, detail=f"Could not fetch spot price for {ticker}")

        expirations = tk.options
        if not expirations:
            raise HTTPException(status_code=404, detail=f"No options found for {ticker}")

        strikes    = []
        maturities = []
        prices     = []

        today = np.datetime64("today")

        for exp in expirations[:8]:
            exp_date = np.datetime64(exp)
            T = float((exp_date - today).astype(int)) / 365.0

            # skip expired or today's expiration
            if T <= 0.01:
                continue

            chain = tk.option_chain(exp)
            calls = chain.calls

            # strike range filter
            calls = calls[
                (calls["strike"] >= spot * 0.7) &
                (calls["strike"] <= spot * 1.3)
            ]

            if calls.empty:
                continue

            for _, row in calls.iterrows():
                bid, ask = row["bid"], row["ask"]

                # use mid if available, fall back to lastPrice
                if bid > 0 and ask > 0:
                    mid = (bid + ask) / 2
                elif row["lastPrice"] > 0:
                    mid = float(row["lastPrice"])
                else:
                    continue

                # skip deep ITM options — price ≈ intrinsic, no vol info
                intrinsic = max(spot - float(row["strike"]), 0)
                if mid <= intrinsic * 1.01:
                    continue

                strikes.append(float(row["strike"]))
                maturities.append(round(T, 6))
                prices.append(round(mid, 4))

        if len(strikes) < 5:
            raise HTTPException(
                status_code=422,
                detail=f"Not enough liquid options found for {ticker} (got {len(strikes)}, need at least 5)"
            )

        return {
            "ticker":     ticker.upper(),
            "spot":       round(spot, 2),
            "strikes":    strikes,
            "maturities": maturities,
            "prices":     prices,
            "count":      len(strikes),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/debug/{ticker}")
def debug_option_chain(ticker: str):
    tk = yf.Ticker(ticker)
    spot = tk.fast_info["lastPrice"]
    expirations = tk.options
    if not expirations:
        return {"error": "no expirations"}
    chain = tk.option_chain(expirations[0])
    calls = chain.calls
    return {
        "spot": spot,
        "expiration": expirations[0],
        "columns": list(calls.columns),
        "sample": calls.head(3).to_dict(orient="records")
    }