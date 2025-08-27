import { Request, Response } from "express";
import { prisma } from "../database/prisma";
import { Prisma } from "@prisma/client";
import { WeatherService, WeatherFilters } from "../services/weatherService";

export function buildPropertyWhere(
  req: Request
): Prisma.PropertyWhereInput | undefined {
  const { searchText } = req.query;

  if (typeof searchText !== "string") {
    return undefined;
  }

  if (!searchText || searchText.trim().length === 0) {
    return undefined;
  }

  const query = searchText.trim();

  return {
    OR: [
      { name: { contains: query } },
      { city: { contains: query } },
      { state: { contains: query } },
    ],
  };
}

export function parseWeatherFilters(req: Request): WeatherFilters {
  const { minTemp, maxTemp, minHumidity, maxHumidity, weatherCodes } = req.query;

  const filters: WeatherFilters = {};

  if (typeof minTemp === 'string' && !isNaN(Number(minTemp))) {
    filters.minTemp = Number(minTemp);
  }

  if (typeof maxTemp === 'string' && !isNaN(Number(maxTemp))) {
    filters.maxTemp = Number(maxTemp);
  }

  if (typeof minHumidity === 'string' && !isNaN(Number(minHumidity))) {
    filters.minHumidity = Number(minHumidity);
  }

  if (typeof maxHumidity === 'string' && !isNaN(Number(maxHumidity))) {
    filters.maxHumidity = Number(maxHumidity);
  }

  if (weatherCodes) {
    // Ensure weatherCodes is an array of strings/numbers
    const rawCodes = Array.isArray(weatherCodes) 
      ? weatherCodes 
      : [weatherCodes];

    // Convert to numbers and filter out invalid ones
    const validCodes = rawCodes
      .map(code => Number(code))       // convert to number
      .filter(code => !isNaN(code));   // keep only valid numbers

    if (validCodes.length > 0) {
      filters.weatherCodes = validCodes;
    }
  }

  return filters;
}

export const getProperties = async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0', includeWeather } = req.query;
    const take = Math.min(parseInt(limit as string) || 20, 100); // Max 100 properties
    const skip = parseInt(offset as string) || 0;

    // Get weather filters
    const weatherFilters = parseWeatherFilters(req);
    const hasWeatherFilters = Object.keys(weatherFilters).length > 0;
    const shouldIncludeWeather = includeWeather === 'true' || hasWeatherFilters;

    // Build database query
    const where = buildPropertyWhere(req);
    
    let result: any[] = [];
    let totalCount = 0;

    if (hasWeatherFilters) {
      // For weather filters, we need a different approach since we can't filter at DB level
      // We'll fetch larger batches and filter them, then paginate the results
      
      let allFilteredProperties: any[] = [];
      let currentOffset = 0;
      const batchSize = 100;
      let foundEnoughResults = false;
      
      // Keep fetching batches until we have enough results for the requested page
      while (!foundEnoughResults && currentOffset < 1000) { // Safety limit
        const batchProperties = await prisma.property.findMany({
          take: batchSize,
          skip: currentOffset,
          where: {
            ...where,
            isActive: true,
            lat: { not: null },
            lng: { not: null }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (batchProperties.length === 0) break;

        // Get weather data for batch
        const batchWithWeather = await WeatherService.getWeatherForProperties(batchProperties);
        
        // Apply weather filters to batch
        const filteredBatch = WeatherService.filterByWeather(batchWithWeather, weatherFilters);
        
        allFilteredProperties.push(...filteredBatch);
        
        // Check if we have enough results for the requested page
        if (allFilteredProperties.length >= skip + take) {
          foundEnoughResults = true;
        }
        
        currentOffset += batchSize;
      }
      
      // Apply pagination to filtered results
      result = allFilteredProperties.slice(skip, skip + take);
      
      // For total count, we estimate based on what we've seen so far
      // This is approximate but much more performant than checking all properties
      if (currentOffset > 0) {
        const sampledProperties = currentOffset;
        const filteredFromSample = allFilteredProperties.length;
        const filterRatio = filteredFromSample / sampledProperties;
        
        const totalPropertiesWithCoords = await prisma.property.count({
          where: {
            ...where,
            isActive: true,
            lat: { not: null },
            lng: { not: null }
          }
        });
        
        totalCount = Math.round(totalPropertiesWithCoords * filterRatio);
      } else {
        totalCount = 0;
      }
      
    } else {
      // No weather filters - standard query
      const properties = await prisma.property.findMany({
        take,
        skip,
        where: {
          ...where,
          isActive: true,
          // Only require coordinates if weather data is explicitly requested
          ...(shouldIncludeWeather && {
            lat: { not: null },
            lng: { not: null }
          })
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get total count for pagination
      totalCount = await prisma.property.count({
        where: {
          ...where,
          isActive: true,
          ...(shouldIncludeWeather && {
            lat: { not: null },
            lng: { not: null }
          })
        }
      });

      // Add weather data if requested
      if (shouldIncludeWeather) {
        result = await WeatherService.getWeatherForProperties(properties);
      } else {
        result = properties;
      }
    }

    // Response with pagination info
    const response = {
      properties: result,
      pagination: {
        total: totalCount,
        limit: take,
        offset: skip,
        hasMore: (skip + take) < totalCount
      },
      filters: {
        search: req.query.searchText || null,
        weather: hasWeatherFilters ? weatherFilters : null
      }
    };

    return res.json(response);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
