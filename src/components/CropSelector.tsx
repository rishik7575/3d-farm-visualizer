
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CropType, CropAllocation } from "@/types/farm";
import { Wheat, Sprout, Leaf, CircleDashed, Info } from 'lucide-react';

interface CropSelectorProps {
  totalAcres: number;
  cropAllocations: CropAllocation[];
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
    icon: <Sprout className="h-4 w-4" />,
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

const CropSelector = ({ totalAcres, cropAllocations, onCropAllocationChange }: CropSelectorProps) => {
  const [allocations, setAllocations] = useState<CropAllocation[]>(cropAllocations);
  
  // Update local state when props change
  useEffect(() => {
    setAllocations(cropAllocations);
  }, [cropAllocations]);

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
          <span className="text-xl font-bold">AI Crop Recommendation</span>
          <Badge 
            variant="outline"
            className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary"
          >
            <Info className="h-3.5 w-3.5 mr-1" />
            AI Optimized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-5">
        <div className="text-sm text-muted-foreground mb-2">
          Based on your land size, our AI recommends the following crop allocation:
        </div>
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
              disabled={true} // Disable manual adjustment
            />
          </div>
        ))}
        <div className="bg-muted/30 rounded-lg p-3 text-sm">
          <p className="flex items-center text-muted-foreground">
            <Info className="h-4 w-4 mr-2 text-primary" />
            This AI recommendation is optimized for your {totalAcres} acres of land
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CropSelector;
