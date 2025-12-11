'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddressSearchProps {
  onLocationSelect: (data: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  className?: string;
  disabled?: boolean;
  map_only?: boolean;
}

interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
}

export function AddressSearch({
  onLocationSelect,
  initialLat = 0,
  initialLng = 0,
  initialAddress = '',
  className = "",
  disabled = false,
  map_only = false,
}: AddressSearchProps) {
  // State
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    lat: initialLat,
    lng: initialLng,
    address: initialAddress
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Effect to update state when initial props change
  useEffect(() => {
    if (initialLat !== 0 || initialLng !== 0 || initialAddress) {
      setSelectedLocation({
        lat: initialLat,
        lng: initialLng,
        address: initialAddress
      });
      setSearchQuery(initialAddress);

      // If we have coordinates but no address, perform reverse geocoding
      if ((initialLat !== 0 || initialLng !== 0) && !initialAddress) {
        const performReverseGeocoding = async () => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?` +
              `format=json&lat=${initialLat}&lon=${initialLng}&` +
              `accept-language=en&addressdetails=1`
            );

            if (response.ok) {
              const result = await response.json();
              const address = result.display_name || `${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}`;

              setSelectedLocation(prev => ({ ...prev, address }));
              setSearchQuery(address);
              onLocationSelect({ lat: initialLat, lng: initialLng, address });
            }
          } catch (error) {
            const address = `${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}`;
            setSelectedLocation(prev => ({ ...prev, address }));
            setSearchQuery(address);
            onLocationSelect({ lat: initialLat, lng: initialLng, address });
          }
        };

        performReverseGeocoding();
      }
    }
  }, [initialLat, initialLng, initialAddress, onLocationSelect]);

  // Debounced search function
  const searchAddresses = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Nominatim API (free OpenStreetMap geocoding)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&` +
        `countrycodes=sa,ae,eg&` + // Restrict to Saudi Arabia, UAE, Egypt
        `limit=5&` +
        `addressdetails=1&` +
        `accept-language=en`
      );

      if (response.ok) {
        const results: NominatimResult[] = await response.json();
        setSuggestions(results);
        setShowSuggestions(true);
      }
    } catch (error) {
      // Error searching addresses - handled silently
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (disabled) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchAddresses(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchAddresses, disabled]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setSearchQuery(e.target.value);
  }, [disabled]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: NominatimResult) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const address = suggestion.display_name;

    setSelectedLocation({ lat, lng, address });
    setSearchQuery(address);
    setShowSuggestions(false);

    onLocationSelect({ lat, lng, address });
  }, [onLocationSelect]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (disabled) return;
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocoding using Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&lat=${lat}&lon=${lng}&` +
            `accept-language=en&addressdetails=1`
          );

          if (response.ok) {
            const result = await response.json();
            const address = result.display_name || `${lat}, ${lng}`;

            setSelectedLocation({ lat, lng, address });
            setSearchQuery(address);
            onLocationSelect({ lat, lng, address });
          }
        } catch (error) {
          const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setSelectedLocation({ lat, lng, address });
          setSearchQuery(address);
          onLocationSelect({ lat, lng, address });
        }

        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        alert('Unable to get your location. Please search for an address manually.');
      }
    );
  }, [onLocationSelect, disabled]);

  // Generate map URL for static display
  const mapUrl = useMemo(() => {
    if (selectedLocation.lat === 0 && selectedLocation.lng === 0) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=46.5,24.5,46.9,24.9&layer=mapnik&zoom=10`;
    }

    const lat = selectedLocation.lat;
    const lng = selectedLocation.lng;
    const zoom = 15;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [selectedLocation]);

  // Open location in Google Maps (new tab)
  const openInMap = useCallback(() => {
    if (selectedLocation.lat !== 0 && selectedLocation.lng !== 0) {
      window.open(
        `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`,
        '_blank'
      );
    }
  }, [selectedLocation]);
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Address Search Input */}
      {!map_only && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="address-search">
              العنوان
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isLoadingLocation || disabled}
              className="text-xs"
            >
                  {isLoadingLocation ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  جاري التحديد...
                </div>
              ) : (
                "استخدام الموقع الحالي"
              )}
            </Button>
          </div>

          <div className="relative">
              <Input
              id="address-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="ابحث عن عنوان..."
              className="w-full"
              disabled={disabled}
            />

            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Suggestions */}
          {!disabled && showSuggestions && suggestions.length > 0 && (
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0"
                  >
                    <div className="truncate">{suggestion.display_name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            ابحث عن العنوان أو استخدم موقعك الحالي
          </p>
        </div>
      )}

      {/* Map Display - Always visible */}
      <div className="space-y-2">
          <div className="flex items-center justify-end">
            {selectedLocation.lat !== 0 && selectedLocation.lng !== 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openInMap}
                className="text-xs"
              >
                فتح في الخريطة
              </Button>
            )}
          </div>
       {!map_only && (
        <div className="w-full h-64 rounded-md border border-border overflow-hidden">
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            title="Store Location"
          />
        </div>
        )}
        {!map_only && (
            <p className="text-xs text-muted-foreground">
            {selectedLocation.lat !== 0 && selectedLocation.lng !== 0
              ? "انقر على الخريطة لتحديد الموقع"
              : "الموقع الافتراضي"
            }
          </p>
        )}
      </div>

      {/* Selected Address Display */}
      {!map_only && selectedLocation.address && (
        <div className="space-y-2">
          <Label>العنوان المحدد</Label>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-foreground">{selectedLocation.address}</p>
          </div>
        </div>
      )}

      {/* Coordinates Display */}
      {!map_only && selectedLocation.lat !== 0 && selectedLocation.lng !== 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              type="text"
              value={selectedLocation.lat.toFixed(6)}
              readOnly
              className="bg-muted hidden"
            />
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              value={selectedLocation.lng.toFixed(6)}
              readOnly
              className="bg-muted hidden"
            />
          </div>
        </div>
      )}

      {/* Click outside to close suggestions */}
      {!map_only && showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}