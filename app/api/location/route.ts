// app/api/location/route.ts
// Flynatoure Location Engine — IP-to-Airport Geocoding Service

import { NextRequest, NextResponse } from "next/server";
import { getNearestAirport, getAirportByCountryCode } from "@/lib/location";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Try to extract Vercel-injected Geolocation Headers
    const country = req.headers.get("x-vercel-ip-country");
    const city = req.headers.get("x-vercel-ip-city");
    const latStr = req.headers.get("x-vercel-ip-latitude");
    const lonStr = req.headers.get("x-vercel-ip-longitude");

    let resolvedLat = latStr ? parseFloat(latStr) : NaN;
    let resolvedLon = lonStr ? parseFloat(lonStr) : NaN;
    let resolvedCity = city ? decodeURIComponent(city) : "";
    let resolvedCountry = country || "";

    // 2. Fallback for Local Development & Testing (If headers are absent or localhost)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
    const isLocalhost = !clientIp || clientIp === "127.0.0.1" || clientIp === "::1" || clientIp.startsWith("localhost");

    if ((isNaN(resolvedLat) || isNaN(resolvedLon) || !resolvedCountry) && !isLocalhost) {
      try {
        // Query ip-api.com to locate the client's public IP
        const res = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,countryCode,city,lat,lon`, {
          signal: AbortSignal.timeout(3000),
        });
        const geo = await res.json();
        if (geo.status === "success") {
          resolvedLat = geo.lat;
          resolvedLon = geo.lon;
          resolvedCity = geo.city;
          resolvedCountry = geo.countryCode;
        }
      } catch (err) {
        console.warn("[Location API] Geocoding fallback fetch failed:", err);
      }
    }

    // 3. Absolute Fallback: If still unresolved (e.g. localhost dev with no external IP), geolocate the local host's external IP
    if (isNaN(resolvedLat) || isNaN(resolvedLon) || !resolvedCountry) {
      try {
        const res = await fetch("http://ip-api.com/json/?fields=status,country,countryCode,city,lat,lon", {
          signal: AbortSignal.timeout(3000),
        });
        const geo = await res.json();
        if (geo.status === "success") {
          resolvedLat = geo.lat;
          resolvedLon = geo.lon;
          resolvedCity = geo.city;
          resolvedCountry = geo.countryCode;
        }
      } catch (err) {
        console.warn("[Location API] Server self-geolocating fallback failed:", err);
      }
    }

    // 4. Resolve the Nearest Airport
    let nearestAirport;
    if (!isNaN(resolvedLat) && !isNaN(resolvedLon)) {
      nearestAirport = getNearestAirport(resolvedLat, resolvedLon);
    } else {
      // Fallback based on parsed country or default to JFK
      nearestAirport = getAirportByCountryCode(resolvedCountry);
    }

    return NextResponse.json({
      ok: true,
      country: resolvedCountry || "US",
      city: resolvedCity || "New York",
      latitude: !isNaN(resolvedLat) ? resolvedLat : 40.7128,
      longitude: !isNaN(resolvedLon) ? resolvedLon : -74.0060,
      airport: {
        iata: nearestAirport.iata,
        name: nearestAirport.name,
        city: nearestAirport.city,
        country: nearestAirport.country,
      },
      source: latStr ? "vercel_edge" : "ip_geocoding",
    });
  } catch (err) {
    console.error("[Location Route Error]:", err);
    // Bulletproof response: return default JFK (New York) on error
    return NextResponse.json({
      ok: true,
      country: "US",
      city: "New York",
      latitude: 40.7128,
      longitude: -74.0060,
      airport: {
        iata: "JFK",
        name: "John F. Kennedy Int'l Airport",
        city: "New York",
        country: "United States",
      },
      source: "error_fallback",
    });
  }
}
