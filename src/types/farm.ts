
export type CropType = 'wheat' | 'corn' | 'soybean' | 'cotton';

export interface CropAllocation {
  crop: CropType;
  percentage: number;
  acres: number;
  yieldPerAcre: number; // Expected yield per acre
  pricePerUnit: number; // Current market price per unit
  costPerAcre: number;  // Cultivation cost per acre
  profit: number;       // Calculated profit
  suitabilityScore: number; // How suitable this crop is for given conditions (0-100)
}

export interface FarmData {
  acres: number;
  location: string;
  soilType: string;
  temperature: number;
  rainfall: number;
}

export interface CropMarketData {
  crop: CropType;
  yieldRange: {
    min: number;
    max: number;
  };
  pricePerUnit: number;
  unit: string;
  costPerAcre: number;
  idealConditions: {
    soilTypes: string[];
    tempMin: number;
    tempMax: number;
    rainfallMin: number;
    rainfallMax: number;
  };
}

export interface CropRecommendationData {
  crop: CropType;
  name: string;
  scientificName: string;
  description: string;
  growingTips: string[];
  harvestingInfo: string;
  marketOutlook: string;
  environmentalImpact: string;
}
