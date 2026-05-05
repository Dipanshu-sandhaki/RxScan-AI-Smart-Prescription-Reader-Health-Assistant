"""
RxScan AI — Pharmacy Router
GET /api/pharmacies/nearby  → Find nearby pharmacies via Google Maps
"""

import os
import logging
import requests
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"


@router.get("/pharmacies/nearby")
async def get_nearby_pharmacies(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius: int = Query(default=2000, description="Search radius in meters (max 5000)"),
    limit: int = Query(default=10, description="Max results"),
):
    """
    Find nearby pharmacies using Google Maps Places API.
    Free tier: $200/month credit = ~28,000 requests/month.
    
    Requires GOOGLE_MAPS_API_KEY in environment.
    """
    if not GOOGLE_MAPS_API_KEY:
        logger.error("GOOGLE_MAPS_API_KEY not set.")
        raise HTTPException(status_code=503, detail="Pharmacy search unavailable. GOOGLE_MAPS_API_KEY not configured.")

    try:
        params = {
            "location": f"{lat},{lng}",
            "radius": min(radius, 5000),
            "type": "pharmacy",
            "key": GOOGLE_MAPS_API_KEY,
            "language": "en",
        }

        resp = requests.get(PLACES_NEARBY_URL, params=params, timeout=10)
        data = resp.json()

        if data.get("status") not in ("OK", "ZERO_RESULTS"):
            logger.error(f"Google Maps error: {data.get('status')} — {data.get('error_message', '')}")
            raise HTTPException(status_code=502, detail=f"Google Maps API error: {data.get('status')}")

        pharmacies = []
        for place in data.get("results", [])[:limit]:
            pharmacy = {
                "place_id": place.get("place_id", ""),
                "name": place.get("name", "Unknown Pharmacy"),
                "address": place.get("vicinity", ""),
                "lat": place.get("geometry", {}).get("location", {}).get("lat", 0),
                "lng": place.get("geometry", {}).get("location", {}).get("lng", 0),
                "rating": place.get("rating", 0),
                "total_ratings": place.get("user_ratings_total", 0),
                "open_now": place.get("opening_hours", {}).get("open_now", None),
                "distance_meters": _calc_distance(
                    lat, lng,
                    place.get("geometry", {}).get("location", {}).get("lat", lat),
                    place.get("geometry", {}).get("location", {}).get("lng", lng),
                ),
            }
            pharmacies.append(pharmacy)

        # Sort by distance
        pharmacies.sort(key=lambda x: x["distance_meters"])

        return {
            "success": True,
            "count": len(pharmacies),
            "user_location": {"lat": lat, "lng": lng},
            "pharmacies": pharmacies,
        }

    except Exception as e:
        logger.error(f"Pharmacy search failed: {e}")
        raise HTTPException(status_code=500, detail="Pharmacy search failed")


def _calc_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """Approximate distance in meters using Haversine formula."""
    import math
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return int(2 * R * math.asin(math.sqrt(a)))