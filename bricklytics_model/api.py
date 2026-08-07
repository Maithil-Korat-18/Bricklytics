"""
api.py
--------------------------------------------------------------------
Thin REST wrapper around predict.py so the existing Node.js backend
(propertyApi.js etc.) can call this as a microservice instead of
re-implementing the model in JS.

Run:
    pip install fastapi uvicorn
    uvicorn api:app --host 0.0.0.0 --port 8000

Then from Node:
    const res = await axios.post('http://localhost:8000/predict', {
      locality: form.locality,
      property_type: form.propertyType,
      bhk: Number(form.bhk),
      area_sqft: Number(form.carpetArea),
      amenities: form.amenities,       // e.g. ["Security","Clubhouse",...]
      asking_price_cr: form.price ?? null,
    });
"""
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional

from predict import predict_listing

app = FastAPI(title="Bricklytics Price & Investment Model", version="1.0")


class ListingRequest(BaseModel):
    property_type: str = Field(..., examples=["flat"])
    bhk: int = Field(..., ge=1, le=10)
    area_sqft: float = Field(..., gt=0)
    amenities: list[str] = []
    locality: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    asking_price_cr: Optional[float] = None


@app.post("/predict")
def predict(req: ListingRequest):
    return predict_listing(
        property_type=req.property_type,
        bhk=req.bhk,
        area_sqft=req.area_sqft,
        amenities=req.amenities,
        locality=req.locality,
        lat=req.lat,
        lon=req.lon,
        asking_price_cr=req.asking_price_cr,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
