'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SearchFilters from './components/SearchFilters';
import PropertyCard from './components/PropertyCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

interface ApiResponse {
  properties: Property[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    search: string | null;
    weather: any;
  };
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [weatherCodes, setWeatherCodes] = useState<WeatherCode[]>([]);
  const [weatherCategories, setWeatherCategories] = useState({
    clear: [] as number[],
    cloudy: [] as number[],
    drizzle: [] as number[],
    rainy: [] as number[],
    snow: [] as number[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });
  const [currentFilters, setCurrentFilters] = useState<WeatherFilters>({
    searchText: '',
    minTemp: '',
    maxTemp: '',
    minHumidity: '',
    maxHumidity: '',
    weatherCodes: []
  });

  // Debounce function for search
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Fetch weather codes for dropdown
  useEffect(() => {
    const fetchWeatherCodes = async () => {
      try {
        const response = await axios.get(`${API_URL}/weather-codes`);
        setWeatherCodes(response.data.codes);
        setWeatherCategories(response.data.categories);
      } catch (err) {
        console.error('Error fetching weather codes:', err);
      }
    };

    fetchWeatherCodes();
  }, []);

  // Search properties function
  const searchProperties = async (filters: WeatherFilters, offset = 0, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        limit: pagination.limit,
        offset,
        includeWeather: 'true'
      };

      // Add filters to params
      if (filters.searchText) params.searchText = filters.searchText;
      if (filters.minTemp) params.minTemp = filters.minTemp;
      if (filters.maxTemp) params.maxTemp = filters.maxTemp;
      if (filters.minHumidity) params.minHumidity = filters.minHumidity;
      if (filters.maxHumidity) params.maxHumidity = filters.maxHumidity;
      if (filters.weatherCodes && filters.weatherCodes.length > 0) {
        params.weatherCodes = filters.weatherCodes.join(',');
      }

      const response = await axios.get<ApiResponse>(`${API_URL}/get-properties`, { params });
      console.log('API Response:', response.data); // Debug log

      if (append) {
        setProperties(prev => {
          const newProps = [...prev, ...response.data.properties];
          console.log('Appended Properties:', newProps); // Debug log
          return newProps;
        });
      } else {
        setProperties(response.data.properties);
        console.log('Set Properties:', response.data.properties); // Debug log
      }

      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching properties');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((filters: WeatherFilters) => {
      searchProperties(filters, 0, false);
    }, 500),
    []
  );

  // Handle filter changes
  const handleFiltersChange = (filters: WeatherFilters) => {
    setCurrentFilters(filters);
    debouncedSearch(filters);
  };

  // Load more properties
  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      searchProperties(currentFilters, pagination.offset + pagination.limit, true);
    }
  };

  // Initial load
  useEffect(() => {
    const initialFilters: WeatherFilters = {
      searchText: '',
      minTemp: '',
      maxTemp: '',
      minHumidity: '',
      maxHumidity: '',
      weatherCodes: []
    };
    searchProperties(initialFilters, 0, false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Warden Property Search
          </h1>
          <p className="text-gray-600">
            Find properties with real-time weather information
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Backend: <span className="font-mono">{API_URL}</span>
          </div>
        </div>

        {/* Search Filters */}
        <SearchFilters 
          onFiltersChange={handleFiltersChange}
          weatherCodes={weatherCodes}
          weatherCategories={weatherCategories}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {loading ? 'Searching...' : `Found ${pagination.total} properties`}
          </p>
          {properties.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing {properties.length} of {pagination.total}
            </p>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && properties.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading properties...</span>
          </div>
        )}

        {/* Property Grid */}
        {properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && properties.length === 0 && !error && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasMore && !loading && (
          <div className="text-center">
            <button
              onClick={loadMore}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200"
            >
              Load More Properties
            </button>
          </div>
        )}

        {/* Loading More Indicator */}
        {loading && properties.length > 0 && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}
