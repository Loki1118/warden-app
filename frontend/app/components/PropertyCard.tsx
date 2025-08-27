'use client';

interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
}

interface Property {
  id: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  isActive: boolean;
  tags?: any;
  createdAt: string;
  updatedAt: string;
  weather?: WeatherData;
}

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const getWeatherBadgeColor = (weatherCode: number) => {
    if (weatherCode === 0 || weatherCode === 1) return 'bg-yellow-100 text-yellow-800'; // Clear/Sunny
    if (weatherCode === 2 || weatherCode === 3) return 'bg-gray-100 text-gray-800'; // Cloudy
    if (weatherCode >= 51 && weatherCode <= 67) return 'bg-blue-100 text-blue-800'; // Rain/Drizzle
    if (weatherCode >= 71 && weatherCode <= 86) return 'bg-blue-200 text-blue-900'; // Snow
    if (weatherCode >= 95) return 'bg-purple-100 text-purple-800'; // Thunderstorm
    return 'bg-gray-100 text-gray-800'; // Default
  };

  const formatLocation = () => {
    const parts = [property.city, property.state, property.country].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="property-card">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
          {property.name}
        </h3>
        <div className="text-right ml-4">
          <span className="text-xs text-gray-500">ID: {property.id}</span>
        </div>
      </div>

      {formatLocation() && (
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1">{formatLocation()}</span>
        </div>
      )}

      {/* Coordinates */}
      {property.lat && property.lng && (
        <div className="flex items-center text-xs text-gray-400 mb-3">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>{property.lat.toFixed(4)}, {property.lng.toFixed(4)}</span>
        </div>
      )}

      {/* Tags */}
      {property.tags && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {Object.entries(property.tags).map(([key, value]) => (
              <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {key}: {String(value)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weather Information */}
      {property.weather ? (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">{property.weather.temperature}°C</span>
              </div>
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <span className="font-medium">{property.weather.humidity}%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`weather-badge ${getWeatherBadgeColor(property.weather.weatherCode)}`}>
                {property.weather.weatherDescription}
              </span>
              <span className="text-xs text-gray-400 mt-1">Code: {property.weather.weatherCode}</span>
            </div>
          </div>
        </div>
      ) : property.lat && property.lng ? (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-400 italic">Weather data loading...</p>
        </div>
      ) : (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-400 italic">No coordinates available for weather data</p>
        </div>
      )}

      {/* Property Status */}
      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
        <span className={`px-2 py-1 rounded-full ${property.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {property.isActive ? 'Active' : 'Inactive'}
        </span>
        <span>Added: {new Date(property.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
