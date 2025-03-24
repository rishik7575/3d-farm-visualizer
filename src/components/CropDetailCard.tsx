
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CropAllocation } from '@/types/farm';
import { Leaf, Droplet, Sun, TrendingUp, ThermometerSun, Wind } from 'lucide-react';

interface CropDetailCardProps {
  crop: CropAllocation;
  soilType: string;
  temperature: number;
}

const cropDetails = {
  wheat: {
    scientificName: "Triticum aestivum",
    growthPeriod: "90-120 days",
    optimalSoil: ["loam", "clayLoam", "siltLoam"],
    optimalTemperature: "60-75°F",
    waterRequirements: "Medium (20-30 in/year)",
    description: "A staple grain crop grown worldwide, wheat is a versatile cereal used in various food products.",
    yieldPerAcre: {
      optimal: "60-80 bushels",
      suboptimal: "30-50 bushels"
    },
    soilPreferences: "Prefers well-drained loamy soils with neutral pH (6.0-7.0).",
    tips: [
      "Plant winter wheat in fall for early summer harvest",
      "Apply nitrogen fertilizer at appropriate growth stages",
      "Monitor for rust and other fungal diseases"
    ]
  },
  corn: {
    scientificName: "Zea mays",
    growthPeriod: "90-180 days",
    optimalSoil: ["loam", "sandyLoam", "siltLoam"],
    optimalTemperature: "65-85°F",
    waterRequirements: "High (25-40 in/year)",
    description: "A high-yielding grain crop grown for food, feed, and biofuel production. Requires more nutrients than most other crops.",
    yieldPerAcre: {
      optimal: "180-240 bushels",
      suboptimal: "100-160 bushels"
    },
    soilPreferences: "Well-drained soils with pH between 5.8 and 7.0. Sensitive to poor drainage.",
    tips: [
      "Plant when soil temperatures reach 50°F (10°C)",
      "Space rows to allow for proper air circulation",
      "Implement irrigation during critical growth phases"
    ]
  },
  soybean: {
    scientificName: "Glycine max",
    growthPeriod: "90-120 days",
    optimalSoil: ["loam", "clayLoam", "siltLoam"],
    optimalTemperature: "70-85°F",
    waterRequirements: "Medium (20-35 in/year)",
    description: "A legume crop that fixes nitrogen in the soil, soybeans are grown for oil, protein, and livestock feed.",
    yieldPerAcre: {
      optimal: "50-65 bushels",
      suboptimal: "30-45 bushels"
    },
    soilPreferences: "Adaptable to many soil types but prefers well-drained soils with pH 6.0-7.0.",
    tips: [
      "Consider double-cropping with winter wheat",
      "Maintain proper soil pH for maximum nitrogen fixation",
      "Rotate with non-legume crops to break disease cycles"
    ]
  },
  cotton: {
    scientificName: "Gossypium hirsutum",
    growthPeriod: "150-180 days",
    optimalSoil: ["loam", "sandy", "clayLoam"],
    optimalTemperature: "75-90°F",
    waterRequirements: "Medium to High (25-40 in/year)",
    description: "A significant fiber crop cultivated for its soft, fluffy staple fiber used in textiles.",
    yieldPerAcre: {
      optimal: "2.5-3 bales",
      suboptimal: "1-2 bales"
    },
    soilPreferences: "Prefers well-drained, deep soils with pH 5.5-8.0.",
    tips: [
      "Plant after soil temperature exceeds 65°F (18°C)",
      "Apply balanced fertilization throughout growing season",
      "Monitor for pests, especially boll weevil and bollworms"
    ]
  }
};

const CropDetailCard: React.FC<CropDetailCardProps> = ({ crop, soilType, temperature }) => {
  const details = cropDetails[crop.crop];
  
  const isOptimalSoil = details.optimalSoil.includes(soilType);
  const tempRange = details.optimalTemperature.split("-");
  const minTemp = parseInt(tempRange[0]);
  const maxTemp = parseInt(tempRange[1]);
  const isOptimalTemp = temperature >= minTemp && temperature <= maxTemp;
  
  const expectedYield = isOptimalSoil && isOptimalTemp 
    ? details.yieldPerAcre.optimal
    : details.yieldPerAcre.suboptimal;
  
  const suitabilityScore = [
    isOptimalSoil ? 50 : 25,
    isOptimalTemp ? 50 : 25
  ].reduce((a, b) => a + b, 0);

  return (
    <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-all">
      <CardHeader className={`bg-gradient-to-r ${crop.crop === 'wheat' ? 'from-amber-50 to-amber-100' : 
                                             crop.crop === 'corn' ? 'from-yellow-50 to-yellow-100' :
                                             crop.crop === 'soybean' ? 'from-green-50 to-green-100' :
                                             'from-slate-50 to-slate-100'} py-4`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold capitalize">{crop.crop}</CardTitle>
          <div className="px-2 py-1 bg-white rounded-full text-xs font-medium text-primary shadow-sm">
            {crop.percentage}% of land
          </div>
        </div>
        <CardDescription className="text-sm italic">{details.scientificName}</CardDescription>
      </CardHeader>
      
      <CardContent className="py-4 space-y-4">
        <div className="text-sm">
          {details.description}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <ThermometerSun className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">Temp:</span>
            <span className={isOptimalTemp ? "text-green-600 font-medium" : "text-amber-600"}>{details.optimalTemperature}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Water:</span>
            <span>{details.waterRequirements}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">Growth:</span>
            <span>{details.growthPeriod}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-cyan-500" />
            <span className="text-muted-foreground">Soil:</span>
            <span className={isOptimalSoil ? "text-green-600 font-medium" : "text-amber-600"}>
              {details.optimalSoil.map(s => s.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ')}
            </span>
          </div>
        </div>
        
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">Expected Yield:</span>
            </div>
            <span className="text-sm font-bold">
              {expectedYield} per acre
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total estimated yield:</span>
            <span className="text-sm font-medium">
              {expectedYield.split("-")[0]} × {crop.acres.toFixed(1)} acres
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Suitability for your conditions:</span>
            <div className="flex items-center gap-1">
              <div className="bg-gray-200 w-24 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    suitabilityScore > 75 ? 'bg-green-500' : 
                    suitabilityScore > 50 ? 'bg-yellow-500' : 
                    'bg-orange-500'
                  }`} 
                  style={{ width: `${suitabilityScore}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">{suitabilityScore}%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 -mx-6 -mb-6 px-6 py-3 border-t mt-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            Growing Tips
          </h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            {details.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CropDetailCard;
