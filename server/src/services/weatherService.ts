import axios from 'axios';
import NodeCache from 'node-cache';

// Cache weather data for 5 minutes (300 seconds)
const weatherCache = new NodeCache({ stdTTL: 300 });

// WMO Weather Code mappings for filtering
const WMO_WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
} as const;

export interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface WeatherFilters {
  minTemp?: number;
  maxTemp?: number;
  minHumidity?: number;
  maxHumidity?: number;
  weatherCodes?: number[];
}

export interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
}

export class WeatherService {
  static async getWeatherData(latitude: number, longitude: number): Promise<WeatherData | null> {
    const cacheKey = `weather_${latitude}_${longitude}`;
    
    // Check cache first
    const cachedData = weatherCache.get<WeatherData>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get<OpenMeteoResponse>('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,relative_humidity_2m,weather_code',
          timezone: 'auto'
        },
        timeout: 5000
      });

      const weatherData: WeatherData = {
        temperature: response.data.current.temperature_2m,
        humidity: response.data.current.relative_humidity_2m,
        weatherCode: response.data.current.weather_code,
        weatherDescription: WMO_WEATHER_CODES[response.data.current.weather_code as keyof typeof WMO_WEATHER_CODES] || 'Unknown'
      };

      // Cache the result
      weatherCache.set(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      console.error(`Weather API error for ${latitude},${longitude}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  static async getWeatherForProperties<T extends { lat: number | null; lng: number | null }>(
    properties: T[]
  ): Promise<(T & { weather?: WeatherData })[]> {
    // Batch weather requests with Promise.allSettled for better performance
    const weatherPromises = properties.map(async (property) => {
      if (property.lat === null || property.lng === null) {
        return { ...property, weather: undefined };
      }
      
      const weather = await this.getWeatherData(property.lat, property.lng);
      return {
        ...property,
        weather: weather || undefined
      };
    });

    const results = await Promise.allSettled(weatherPromises);
    return results.map((result, index) => 
      result.status === 'fulfilled' 
        ? result.value 
        : { ...properties[index], weather: undefined }
    );
  }

  static getWeatherCodes() {
    return Object.entries(WMO_WEATHER_CODES).map(([code, description]) => ({
      code: parseInt(code),
      description
    }));
  }

  static filterByWeather<T extends { weather?: WeatherData }>(
    properties: T[],
    filters: WeatherFilters
  ): T[] {
    return properties.filter(property => {
      if (!property.weather) return false;

      const { minTemp, maxTemp, minHumidity, maxHumidity, weatherCodes } = filters;

      // Temperature filter
      if (minTemp !== undefined && property.weather.temperature < minTemp) return false;
      if (maxTemp !== undefined && property.weather.temperature > maxTemp) return false;

      // Humidity filter
      if (minHumidity !== undefined && property.weather.humidity < minHumidity) return false;
      if (maxHumidity !== undefined && property.weather.humidity > maxHumidity) return false;

      // Weather code filter
      if (weatherCodes && weatherCodes.length > 0) {
        if (!weatherCodes.includes(property.weather.weatherCode)) return false;
      }

      return true;
    });
  }

  static getWeatherCodesByCategory() {
    return {
      clear: [0], // Clear sky
      cloudy: [1, 2, 3], // Partly cloudy to overcast
      drizzle: [51, 53, 55, 56, 57], // Light to dense drizzle
      rainy: [61, 63, 65, 66, 67, 80, 81, 82], // Rain and rain showers
      snow: [71, 73, 75, 77, 85, 86] // Snow and snow showers
    };
  }
}
