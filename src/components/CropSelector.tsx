
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CropType, CropAllocation } from "@/types/farm";

interface CropSelectorProps {
  totalAcres: number;
  onCropAllocationChange: (allocations: CropAllocation[]) => void;
}

const availableCrops: { type: CropType; name: string; color: string }[] = [
  { type: 'wheat', name: 'Wheat', color: 'bg-crop-wheat text-black' },
  { type: 'corn', name: 'Corn', color: 'bg-crop-corn text-black' },
  { type: 'soybean', name: 'Soybean', color: 'bg-crop-soybean text-white' },
  { type: 'cotton', name: 'Cotton', color: 'bg-crop-cotton text-black' },
];

const CropSelector = ({ totalAcres, onCropAllocationChange }: CropSelectorProps) => {
  const [allocations, setAllocations] = useState<CropAllocation[]>(
    availableCrops.map(crop => ({ 
      crop: crop.type, 
      percentage: 0,
      acres: 0 
    }))
  );

  const totalPercentage = allocations.reduce((sum, item) => sum + item.percentage, 0);
  const remainingPercentage = 100 - totalPercentage;

  const handleSliderChange = (index: number, value: number[]) => {
    const newPercentage = value[0];
    const newAllocations = [...allocations];
    
    // Calculate the difference in percentage
    const difference = newPercentage - newAllocations[index].percentage;
    
    // If adding this percentage would exceed 100%, adjust it
    if (totalPercentage + difference > 100) {
      return;
    }
    
    newAllocations[index] = {
      ...newAllocations[index],
      percentage: newPercentage,
      acres: (newPercentage / 100) * totalAcres
    };
    
    setAllocations(newAllocations);
  };

  const handleApply = () => {
    onCropAllocationChange(allocations);
    toast.success("Crop allocations updated");
  };

  const roundToOneDecimal = (value: number) => {
    return Math.round(value * 10) / 10;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Crop Allocation</span>
          <Badge variant={remainingPercentage > 0 ? "secondary" : "default"}>
            {remainingPercentage > 0 
              ? `${remainingPercentage}% Unallocated` 
              : "100% Allocated"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allocations.map((allocation, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <Badge className={availableCrops[index].color}>
                {availableCrops[index].name}
              </Badge>
              <span className="text-sm">
                {allocation.percentage}% ({roundToOneDecimal(allocation.acres)} acres)
              </span>
            </div>
            <Slider
              value={[allocation.percentage]}
              max={100}
              step={1}
              onValueChange={(value) => handleSliderChange(index, value)}
            />
          </div>
        ))}
        <Button 
          onClick={handleApply} 
          className="w-full mt-4"
          disabled={remainingPercentage === 100}
        >
          Apply to Land
        </Button>
      </CardContent>
    </Card>
  );
};

export default CropSelector;
