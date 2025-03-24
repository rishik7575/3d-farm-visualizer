
export type CropType = 'wheat' | 'corn' | 'soybean' | 'cotton';

export interface CropAllocation {
  crop: CropType;
  percentage: number;
  acres: number;
}

export interface FarmData {
  acres: number;
  location: string;
  soilType: string;
  temperature: number;
  rainfall: number;
}
