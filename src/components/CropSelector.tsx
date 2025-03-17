
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CropType, CropAllocation } from "@/types/farm";
import { Wheat, Seedling, Leaf, CircleDashed } from 'lucide-react';

interface CropSelectorProps {
  totalAcres: number;
  onCropAllocationChange: (allocations: CropAllocation[]) => void;
}

const availableCrops: { 
  type: CropType; 
  name: string; 
  color: string;
  icon: React.ReactNode;
  bgClass: string;
}[] = [
  { 
    type: 'wheat', 
    name: 'Wheat', 
    color: 'bg-crop-wheat text-black',
    icon: <Wheat className="h-4 w-4" />,
    bgClass: 'from-crop-wheat/30 to-crop-wheat/10'
  },
  { 
    type: 'corn', 
    name: 'Corn', 
    color: 'bg-crop-corn text-black',
    icon: <Seedling className="h-4 w-4" />,
    bgClass: 'from-crop-corn/30 to-crop-corn/10'
  },
  { 
    type: 'soybean', 
    name: 'Soybean', 
    color: 'bg-crop-soybean text-white',
    icon: <Leaf className="h-4 w-4" />,
    bgClass: 'from-crop-soybean/30 to-crop-soybean/10'
  },
  { 
    type: 'cotton', 
    name: 'Cotton', 
    color: 'bg-crop-cotton text-black',
    icon: <CircleDashed className="h-4 w-4" />,
    bgClass: 'from-crop-cotton/30 to-crop-cotton/10'
  },
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
    <Card className="w-full max-w-md border-2 border-primary/20 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" aria-hidden="true" />
      <CardHeader className="relative pb-3">
        <CardTitle className="flex justify-between items-center">
          <span className="text-xl font-bold">Crop Allocation</span>
          <Badge 
            variant={remainingPercentage > 0 ? "secondary" : "default"}
            className={`px-3 py-1 text-sm font-medium ${
              remainingPercentage > 0 
                ? 'bg-secondary/80 text-secondary-foreground' 
                : 'bg-primary/80 text-primary-foreground'
            }`}
          >
            {remainingPercentage > 0 
              ? `${remainingPercentage}% Unallocated` 
              : "100% Allocated"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-5">
        {allocations.map((allocation, index) => (
          <div key={index} className="relative space-y-2">
            <div className="absolute inset-0 bg-gradient-to-r pointer-events-none opacity-20 rounded-lg -m-1 p-1" 
                 style={{backgroundImage: `linear-gradient(to right, ${allocation.percentage > 0 ? `var(--${availableCrops[index].type}-color), var(--${availableCrops[index].type}-color-light)` : 'transparent, transparent'}`}} />
            <div className="flex justify-between items-center">
              <Badge className={`${availableCrops[index].color} flex items-center gap-1 px-3 py-1 text-sm font-medium`}>
                {availableCrops[index].icon}
                {availableCrops[index].name}
              </Badge>
              <span className="text-sm font-medium">
                {allocation.percentage}% ({roundToOneDecimal(allocation.acres)} acres)
              </span>
            </div>
            <Slider
              value={[allocation.percentage]}
              max={100}
              step={1}
              onValueChange={(value) => handleSliderChange(index, value)}
              className="py-1"
            />
          </div>
        ))}
        <Button 
          onClick={handleApply} 
          className="w-full mt-6 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shadow-md hover:shadow-lg"
          disabled={remainingPercentage === 100}
        >
          Apply to Land
        </Button>
      </CardContent>
    </Card>
  );
};

export default CropSelector;
