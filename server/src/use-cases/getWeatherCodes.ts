import { Request, Response } from "express";
import { WeatherService } from "../services/weatherService";

export const getWeatherCodes = async (req: Request, res: Response) => {
  try {
    const codes = WeatherService.getWeatherCodes();
    const categorizedCodes = WeatherService.getWeatherCodesByCategory();
    
    return res.json({
      codes,
      categories: categorizedCodes
    });
  } catch (error) {
    console.error("Error fetching weather codes:", error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
