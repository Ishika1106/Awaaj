'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, MapPin, Phone, Navigation, Building2, Shield, Heart, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

interface Place {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  distance?: number;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ngo: { label: 'NGO / Shelter', icon: Heart, color: 'text-pink-600 bg-pink-50' },
  police: { label: 'Police Station', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  hospital: { label: 'Hospital', icon: Stethoscope, color: 'text-red-600 bg-red-50' },
  social_facility: { label: 'Social Facility', icon: Building2, color: 'text-orange-600 bg-orange-50' },
};

function getPlaceType(tags: Record<string, string>): string {
  if (tags.office === 'ngo') return 'ngo';
  if (tags.amenity === 'police') return 'police';
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital';
  if (tags.amenity === 'social_facility' || tags.social_facility) return 'social_facility';
  return 'ngo';
}

function getPlaceName(tags: Record<string, string>): string {
  return tags.name || tags['name:en'] || tags.operator || `${tags.amenity || tags.office || 'Help Center'}`;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyPlaces({
  coordinates,
}: {
  coordinates: { lat: number; lng: number } | null | undefined;
}) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const fetchNearbyPlaces = async () => {
    if (!coordinates) {
      toast.error('Location not available. Please enable location access.');
      return;
    }
    setLoading(true);
    try {
      const query = `
        [out:json][timeout:15];
        (
          node["office"="ngo"](around:5000,${coordinates.lat},${coordinates.lng});
          node["amenity"="police"](around:5000,${coordinates.lat},${coordinates.lng});
          node["amenity"="hospital"](around:5000,${coordinates.lat},${coordinates.lng});
          node["amenity"="clinic"](around:5000,${coordinates.lat},${coordinates.lng});
          node["amenity"="social_facility"](around:5000,${coordinates.lat},${coordinates.lng});
          node["social_facility"~"."](around:5000,${coordinates.lat},${coordinates.lng});
        );
        out body;
      `;

      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        throw new Error(`Overpass API returned ${res.status}`);
      }
      const data = await res.json();

      const results: Place[] = (data.elements || [])
        .filter((el: { tags?: Record<string, string> }) => el.tags)
        .map((el: { id: number; tags?: Record<string, string>; lat: number; lon: number }) => {
          const type = getPlaceType(el.tags!);
          return {
            id: el.id.toString(),
            name: getPlaceName(el.tags!),
            type,
            lat: el.lat,
            lng: el.lon,
            address: el.tags!['addr:full'] || el.tags!['addr:street'] || el.tags!.address || '',
            phone: el.tags!.phone || el.tags!['contact:phone'] || '',
            distance: Math.round(haversine(coordinates.lat, coordinates.lng, el.lat, el.lon) * 10) / 10,
          };
        })
        .sort((a: Place, b: Place) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);

      setPlaces(results);
      setShowResults(true);
      if (results.length === 0) {
        toast('No nearby places found in your area.');
      }
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      toast.error('Could not fetch nearby places. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const typeCounts = places.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  if (!coordinates) {
    return (
      <p className="text-sm text-gray-400 text-center">
        Enable location access to find nearby help centers.
      </p>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {!showResults ? (
        <Button
          onClick={fetchNearbyPlaces}
          disabled={loading}
          className="w-full"
          size="lg"
          variant="outline"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          <MapPin className="mr-2 h-5 w-5" />
          {loading ? 'Searching...' : 'Find Nearby NGOs & Safe Places'}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">
              Nearby Help Centers
            </h3>
            <div className="flex gap-2 text-xs text-gray-500">
              {Object.entries(typeCounts).map(([type, count]) => {
                const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.ngo;
                const Icon = cfg.icon;
                return (
                  <span key={type} className="flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {count}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {places.map((place) => {
              const cfg = TYPE_CONFIG[place.type] || TYPE_CONFIG.ngo;
              const Icon = cfg.icon;
              return (
                <div
                  key={place.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:shadow-sm transition-shadow"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {place.name}
                    </p>
                    <p className="text-xs text-gray-500">{cfg.label}</p>
                    {place.address && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{place.address}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{place.distance} km</span>
                      {place.phone && (
                        <a
                          href={`tel:${place.phone}`}
                          className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => openInMaps(place.lat, place.lng)}
                    title="Open in Google Maps"
                  >
                    <Navigation className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-500"
            onClick={() => setShowResults(false)}
          >
            Search Again
          </Button>
        </div>
      )}
    </div>
  );
}
