'use client';

import { useState } from 'react';

interface WeatherCode {
  code: number;
  description: string;
}

interface WeatherFilters {
  searchText: string;
  minTemp: string;
  maxTemp: string;
  minHumidity: string;
  maxHumidity: string;
  weatherCodes: number[];
}

interface SearchFiltersProps {
  onFiltersChange: (filters: WeatherFilters) => void;
  weatherCodes: WeatherCode[];
  weatherCategories: {
    clear: number[];
    cloudy: number[];
    drizzle: number[];
    rainy: number[];
    snow: number[];
  };
}

export default function SearchFilters({
  onFiltersChange,
  weatherCodes,
  weatherCategories,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<WeatherFilters>({
    searchText: '',
    minTemp: '',
    maxTemp: '',
    minHumidity: '',
    maxHumidity: '',
    weatherCodes: [],
  });

  // ✅ type-safe generic updater
  const handleInputChange = <K extends keyof WeatherFilters>(
    field: K,
    value: WeatherFilters[K]
  ) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleWeatherCodeChange = (code: number) => {
    const newCodes = filters.weatherCodes.includes(code)
      ? filters.weatherCodes.filter((c) => c !== code)
      : [...filters.weatherCodes, code];

    handleInputChange('weatherCodes', newCodes);
  };

  const handleCategorySelect = (category: keyof typeof weatherCategories) => {
    const categoryCodes = weatherCategories[category];
    const allSelected = categoryCodes.every((code) =>
      filters.weatherCodes.includes(code)
    );

    let newCodes: number[];
    if (allSelected) {
      // Deselect all codes in this category
      newCodes = filters.weatherCodes.filter(
        (code) => !categoryCodes.includes(code)
      );
    } else {
      // Select all codes in this category
      newCodes = [...new Set([...filters.weatherCodes, ...categoryCodes])];
    }

    handleInputChange('weatherCodes', newCodes);
  };

  const clearFilters = () => {
    const clearedFilters: WeatherFilters = {
      searchText: '',
      minTemp: '',
      maxTemp: '',
      minHumidity: '',
      maxHumidity: '',
      weatherCodes: [],
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // ✅ always boolean
  const hasActiveFilters = Boolean(
    filters.searchText ||
      filters.minTemp ||
      filters.maxTemp ||
      filters.minHumidity ||
      filters.maxHumidity ||
      filters.weatherCodes.length
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Search & Weather Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Bar */}
        <div className="lg:col-span-3">
          <label className="filter-label">Search Properties</label>
          <input
            type="text"
            placeholder="Search by name, city, or state..."
            className="filter-input"
            value={filters.searchText}
            onChange={(e) => handleInputChange('searchText', e.target.value)}
          />
        </div>

        {/* Temperature Range */}
        <div>
          <label className="filter-label">Min Temperature (°C)</label>
          <input
            type="number"
            placeholder="e.g., 15"
            min="-20"
            max="50"
            className="filter-input"
            value={filters.minTemp}
            onChange={(e) => handleInputChange('minTemp', e.target.value)}
          />
        </div>

        <div>
          <label className="filter-label">Max Temperature (°C)</label>
          <input
            type="number"
            placeholder="e.g., 25"
            min="-20"
            max="50"
            className="filter-input"
            value={filters.maxTemp}
            onChange={(e) => handleInputChange('maxTemp', e.target.value)}
          />
        </div>

        {/* Humidity Range */}
        <div>
          <label className="filter-label">Min Humidity (%)</label>
          <input
            type="number"
            placeholder="e.g., 30"
            min="0"
            max="100"
            className="filter-input"
            value={filters.minHumidity}
            onChange={(e) => handleInputChange('minHumidity', e.target.value)}
          />
        </div>

        <div>
          <label className="filter-label">Max Humidity (%)</label>
          <input
            type="number"
            placeholder="e.g., 70"
            min="0"
            max="100"
            className="filter-input"
            value={filters.maxHumidity}
            onChange={(e) => handleInputChange('maxHumidity', e.target.value)}
          />
        </div>

        {/* Weather Conditions - Categorized */}
        <div className="lg:col-span-2">
          <label className="filter-label">Weather Conditions</label>

          {/* Category Quick Selectors */}
          <div className="mb-3 flex flex-wrap gap-2">
            {Object.entries(weatherCategories).map(([category, codes]) => {
              const allSelected = codes.every((code) =>
                filters.weatherCodes.includes(code)
              );
              const someSelected = codes.some((code) =>
                filters.weatherCodes.includes(code)
              );

              return (
                <button
                  key={category}
                  onClick={() =>
                    handleCategorySelect(
                      category as keyof typeof weatherCategories
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    allSelected
                      ? 'bg-primary-500 text-white border-primary-500'
                      : someSelected
                      ? 'bg-primary-100 text-primary-700 border-primary-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Individual Weather Codes */}
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
            {weatherCodes.map((weather) => (
              <label
                key={weather.code}
                className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.weatherCodes.includes(weather.code)}
                  onChange={() => handleWeatherCodeChange(weather.code)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700 flex-1">
                  <span className="font-mono text-xs text-gray-500 mr-2">
                    {weather.code}
                  </span>
                  {weather.description}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.searchText && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Search: "{filters.searchText}"
              </span>
            )}
            {filters.minTemp && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Min Temp: {filters.minTemp}°C
              </span>
            )}
            {filters.maxTemp && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Max Temp: {filters.maxTemp}°C
              </span>
            )}
            {filters.minHumidity && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Min Humidity: {filters.minHumidity}%
              </span>
            )}
            {filters.maxHumidity && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Max Humidity: {filters.maxHumidity}%
              </span>
            )}
            {filters.weatherCodes.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {filters.weatherCodes.length} weather condition
                {filters.weatherCodes.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
