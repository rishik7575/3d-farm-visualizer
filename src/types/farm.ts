
export type CropType = 'wheat' | 'corn' | 'soybean' | 'cotton';

export interface CropAllocation {
  crop: CropType;
  percentage: number;
  acres: number;
}
