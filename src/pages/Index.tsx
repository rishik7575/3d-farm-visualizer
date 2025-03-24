
import { useState } from 'react';
import LandForm from '@/components/LandForm';
import CropSelector from '@/components/CropSelector';
import FarmScene from '@/components/FarmScene';
import CropDetailCard from '@/components/CropDetailCard';
import { CropAllocation, FarmData, CropMarketData, CropRecommendationData } from '@/types/farm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wheat, Sprout, Tractor, Leaf, Map, Info, BarChart, Droplet, Thermometer, DollarSign, TrendingUp, PieChart } from "lucide-react";
import { toast } from 'sonner';

// Market data and recommendations database for crops
const cropMarketData: CropMarketData[] = [
  {
    crop: 'wheat',
    yieldRange: { min: 30, max: 100 }, // bushels per acre
    pricePerUnit: 7.5, // $ per bushel
    unit: 'bushel',
    costPerAcre: 350, // $ per acre
    idealConditions: {
      soilTypes: ['loam', 'clay', 'clayLoam', 'siltLoam'],
      tempMin: 55,
      tempMax: 75,
      rainfallMin: 12,
      rainfallMax: 35
    }
  },
  {
    crop: 'corn',
    yieldRange: { min: 100, max: 250 }, // bushels per acre
    pricePerUnit: 4.5, // $ per bushel
    unit: 'bushel',
    costPerAcre: 580, // $ per acre
    idealConditions: {
      soilTypes: ['loam', 'siltLoam', 'silty'],
      tempMin: 65,
      tempMax: 85,
      rainfallMin: 20,
      rainfallMax: 40
    }
  },
  {
    crop: 'soybean',
    yieldRange: { min: 30, max: 80 }, // bushels per acre
    pricePerUnit: 12.8, // $ per bushel
    unit: 'bushel',
    costPerAcre: 420, // $ per acre
    idealConditions: {
      soilTypes: ['loam', 'siltLoam', 'silty', 'clay'],
      tempMin: 68,
      tempMax: 86,
      rainfallMin: 20,
      rainfallMax: 45
    }
  },
  {
    crop: 'cotton',
    yieldRange: { min: 600, max: 1500 }, // pounds per acre
    pricePerUnit: 0.85, // $ per pound
    unit: 'pound',
    costPerAcre: 620, // $ per acre
    idealConditions: {
      soilTypes: ['sandy', 'loam', 'sandyLoam'],
      tempMin: 75,
      tempMax: 95,
      rainfallMin: 15,
      rainfallMax: 35
    }
  }
];

const cropRecommendationData: CropRecommendationData[] = [
  {
    crop: 'wheat',
    name: 'Wheat',
    scientificName: 'Triticum aestivum',
    description: 'Wheat is a grass widely cultivated for its seed, a cereal grain. It is a worldwide staple food and the second most-produced cereal after maize.',
    growingTips: [
      'Plant during fall for winter wheat varieties in cooler regions',
      'Ensure proper drainage to prevent waterlogging',
      'Apply nitrogen fertilizer during early growth stages',
      'Control weeds early to prevent competition',
      'Monitor for rust diseases and aphids regularly'
    ],
    harvestingInfo: 'Harvested when grain moisture content is between 13-14%. Use a combine harvester for efficiency.',
    marketOutlook: 'Global wheat demand remains strong with stable prices. Quality wheat commands premium prices in specialty markets.',
    environmentalImpact: 'Moderate water usage with good drought tolerance. Can be part of sustainable crop rotation systems.'
  },
  {
    crop: 'corn',
    name: 'Corn (Maize)',
    scientificName: 'Zea mays',
    description: 'Corn is one of the most versatile crops, used for food, feed, and fuel. It\'s a tall annual grass with a distinctive architecture.',
    growingTips: [
      'Plant when soil temperatures reach 60°F (16°C)',
      'Space plants adequately for proper pollination',
      'Apply phosphorus and potassium early in the season',
      'Ensure consistent moisture during tasseling and silking',
      'Scout for corn borers and rootworm regularly'
    ],
    harvestingInfo: 'Harvest when kernels are firm and kernels have developed a black layer at base. Grain moisture should be around 15-20%.',
    marketOutlook: 'Strong demand from ethanol, livestock feed, and food industries provides stable market opportunities.',
    environmentalImpact: 'Higher water and nitrogen requirements. Consider cover crops and no-till practices to reduce environmental impact.'
  },
  {
    crop: 'soybean',
    name: 'Soybean',
    scientificName: 'Glycine max',
    description: 'Soybeans are legumes notable for their high protein content. They have a wide range of applications from food products to industrial uses.',
    growingTips: [
      'Plant after soil temperatures reach 60°F (16°C)',
      'Inoculate seeds with Rhizobium bacteria for nitrogen fixation',
      'Maintain good weed control especially in early growth',
      'Rotate crops to prevent disease buildup',
      'Monitor for soybean cyst nematodes and aphids'
    ],
    harvestingInfo: 'Harvest when pods are brown and seeds rattle in the pods. Moisture content should be around 13-15%.',
    marketOutlook: 'Growing demand in plant-based protein markets offers premium opportunities. Export markets remain strong.',
    environmentalImpact: 'Nitrogen-fixing capabilities improve soil health. Lower fertilizer requirements compared to other crops.'
  },
  {
    crop: 'cotton',
    name: 'Cotton',
    scientificName: 'Gossypium hirsutum',
    description: 'Cotton is a soft, fluffy staple fiber that grows in a protective case around the seeds of the cotton plant. It is the most widely used natural fiber in clothing.',
    growingTips: [
      'Plant after soil temperatures reach 65°F (18°C)',
      'Apply sufficient phosphorus for root development',
      'Control growth with proper nitrogen management',
      'Monitor for boll weevils and bollworms',
      'Consider applying growth regulators to manage height'
    ],
    harvestingInfo: 'Harvest when bolls have opened and cotton is dry. Mechanical pickers and strippers are commonly used.',
    marketOutlook: 'Premium prices for high-quality, sustainably grown cotton. Organic markets offer additional price premiums.',
    environmentalImpact: 'Traditional cotton uses significant water and pesticides. Consider organic or sustainable practices to reduce impact.'
  }
];

const Index = () => {
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [cropAllocations, setCropAllocations] = useState<CropAllocation[]>([]);
  const [showViz, setShowViz] = useState<boolean>(false);
  const [totalProfitEstimate, setTotalProfitEstimate] = useState<number>(0);
  const [overallSuitabilityScore, setOverallSuitabilityScore] = useState<number>(0);

  const handleLandSubmit = (formData: FarmData) => {
    setFarmData(formData);
    
    // AI recommendation for crop allocation based on land size and conditions
    const recommendedAllocations = getAIRecommendation(formData);
    setCropAllocations(recommendedAllocations);
    
    // Calculate total profit estimate
    const totalProfit = recommendedAllocations.reduce((sum, crop) => sum + crop.profit, 0);
    setTotalProfitEstimate(totalProfit);
    
    // Calculate overall suitability score
    const avgSuitability = recommendedAllocations.reduce((sum, crop) => 
      sum + (crop.suitabilityScore * crop.percentage / 100), 0);
    setOverallSuitabilityScore(avgSuitability);
    
    setShowViz(true);
    
    toast.success(`AI has recommended optimal crop allocations for your ${formData.acres} acre farm in ${formData.location}`);
  };

  // Enhanced AI recommendation function that takes into account all farm conditions with economics
  const getAIRecommendation = (farmData: FarmData): CropAllocation[] => {
    const { acres, soilType, temperature, rainfall } = farmData;
    
    // Base allocation percentages
    let wheatPercent = 25;
    let cornPercent = 25;
    let soybeanPercent = 25;
    let cottonPercent = 25;
    
    // Track suitability scores for each crop (0-100)
    let wheatSuitability = 50;
    let cornSuitability = 50;
    let soybeanSuitability = 50;
    let cottonSuitability = 50;
    
    // Adjust based on soil type with more accurate mapping
    if (soilType === 'sandy' || soilType === 'sandyLoam') {
      // Sandy soils: better for cotton, less ideal for wheat
      cottonSuitability += 25;
      cornSuitability += 10;
      wheatSuitability -= 15;
      soybeanSuitability -= 5;
      
      cottonPercent += 15;
      cornPercent += 5;
      wheatPercent -= 15;
      soybeanPercent -= 5;
    } 
    else if (soilType === 'clay' || soilType === 'clayLoam') {
      // Clay soils: better for wheat and soybeans
      wheatSuitability += 20;
      soybeanSuitability += 15;
      cornSuitability -= 10;
      cottonSuitability -= 15;
      
      wheatPercent += 15;
      soybeanPercent += 10;
      cornPercent -= 10;
      cottonPercent -= 15;
    } 
    else if (soilType === 'silty' || soilType === 'siltLoam') {
      // Silty soils: excellent for corn and soybeans
      cornSuitability += 25;
      soybeanSuitability += 20;
      wheatSuitability -= 5;
      cottonSuitability -= 15;
      
      cornPercent += 15;
      soybeanPercent += 10;
      wheatPercent -= 5;
      cottonPercent -= 20;
    } 
    else if (soilType === 'peaty') {
      // Peaty soils: good for vegetables, but we focus on our main crops
      soybeanSuitability += 10;
      cornSuitability += 5;
      wheatSuitability -= 10;
      cottonSuitability -= 15;
      
      soybeanPercent += 15;
      cornPercent += 5;
      wheatPercent -= 10;
      cottonPercent -= 10;
    }
    else if (soilType === 'loam') {
      // Loam is balanced and good for all crops
      wheatSuitability += 10;
      cornSuitability += 15;
      soybeanSuitability += 15;
      cottonSuitability += 5;
      
      cornPercent += 5;
      soybeanPercent += 5;
      wheatPercent += 0;
      cottonPercent -= 10;
    }
    
    // Adjust based on temperature with more precise ranges
    // Wheat: 55-75°F optimal
    if (temperature < 55) {
      wheatSuitability -= (55 - temperature) * 2;
      wheatPercent -= Math.min(15, (55 - temperature) * 1.5);
    } else if (temperature > 75) {
      wheatSuitability -= (temperature - 75) * 2;
      wheatPercent -= Math.min(15, (temperature - 75) * 1.5);
    } else {
      // Optimal temperature range
      wheatSuitability += 15;
      wheatPercent += 10;
    }
    
    // Corn: 65-85°F optimal
    if (temperature < 65) {
      cornSuitability -= (65 - temperature) * 2;
      cornPercent -= Math.min(15, (65 - temperature) * 1.5);
    } else if (temperature > 85) {
      cornSuitability -= (temperature - 85) * 1.5;
      cornPercent -= Math.min(15, (temperature - 85));
    } else {
      // Optimal temperature range
      cornSuitability += 15;
      cornPercent += 10;
    }
    
    // Soybeans: 68-86°F optimal
    if (temperature < 68) {
      soybeanSuitability -= (68 - temperature) * 2;
      soybeanPercent -= Math.min(15, (68 - temperature) * 1.5);
    } else if (temperature > 86) {
      soybeanSuitability -= (temperature - 86) * 1.5;
      soybeanPercent -= Math.min(15, (temperature - 86));
    } else {
      // Optimal temperature range
      soybeanSuitability += 15;
      soybeanPercent += 10;
    }
    
    // Cotton: 75-95°F optimal (heat loving)
    if (temperature < 75) {
      cottonSuitability -= (75 - temperature) * 2.5;
      cottonPercent -= Math.min(25, (75 - temperature) * 2);
    } else if (temperature > 95) {
      cottonSuitability -= (temperature - 95);
      cottonPercent -= Math.min(10, (temperature - 95) * 0.5);
    } else {
      // Optimal temperature range
      cottonSuitability += 20;
      cottonPercent += 15;
    }
    
    // Adjust based on rainfall with more precise ranges
    // Adjust wheat based on rainfall (12-35 inches ideal)
    if (rainfall < 12) {
      wheatSuitability -= (12 - rainfall) * 3;
      wheatPercent -= Math.min(15, (12 - rainfall) * 2);
    } else if (rainfall > 35) {
      wheatSuitability -= (rainfall - 35) * 2;
      wheatPercent -= Math.min(15, (rainfall - 35) * 1.5);
    } else {
      // Optimal rainfall range
      wheatSuitability += 10;
      wheatPercent += 5;
    }
    
    // Corn needs more water (20-40 inches ideal)
    if (rainfall < 20) {
      cornSuitability -= (20 - rainfall) * 4;
      cornPercent -= Math.min(25, (20 - rainfall) * 2.5);
    } else if (rainfall > 40) {
      cornSuitability -= (rainfall - 40) * 1.5;
      cornPercent -= Math.min(15, (rainfall - 40));
    } else {
      // Optimal rainfall range
      cornSuitability += 15;
      cornPercent += 10;
    }
    
    // Soybeans (20-45 inches ideal)
    if (rainfall < 20) {
      soybeanSuitability -= (20 - rainfall) * 3;
      soybeanPercent -= Math.min(20, (20 - rainfall) * 2);
    } else if (rainfall > 45) {
      soybeanSuitability -= (rainfall - 45) * 1.5;
      soybeanPercent -= Math.min(15, (rainfall - 45));
    } else {
      // Optimal rainfall range
      soybeanSuitability += 15;
      soybeanPercent += 10;
    }
    
    // Cotton (15-35 inches ideal)
    if (rainfall < 15) {
      cottonSuitability -= (15 - rainfall) * 3;
      cottonPercent -= Math.min(20, (15 - rainfall) * 2);
    } else if (rainfall > 35) {
      cottonSuitability -= (rainfall - 35) * 2;
      cottonPercent -= Math.min(15, (rainfall - 35) * 1.5);
    } else {
      // Optimal rainfall range
      cottonSuitability += 15;
      cottonPercent += 10;
    }
    
    // Adjust based on land size with more nuanced logic
    if (acres < 5) {
      // Very small farms: focus on high-value, low-space crops
      cornSuitability += 5;
      soybeanSuitability += 10;
      wheatSuitability -= 5;
      
      cornPercent += 5;
      soybeanPercent += 10;
      wheatPercent -= 5;
      cottonPercent -= 10;
    } else if (acres < 20) {
      // Small farms
      cornSuitability += 5;
      soybeanSuitability += 5;
      
      cornPercent += 5;
      soybeanPercent += 5;
      wheatPercent -= 5;
      cottonPercent -= 5;
    } else if (acres < 50) {
      // Medium-small farms
      // Keep balanced
    } else if (acres < 100) {
      // Medium farms - more diversification
      wheatSuitability += 5;
      
      wheatPercent += 5;
      cornPercent += 0;
      soybeanPercent += 0;
      cottonPercent -= 5;
    } else if (acres < 300) {
      // Medium-large farms - wheat and corn focus
      wheatSuitability += 10;
      cornSuitability += 5;
      
      wheatPercent += 10;
      cornPercent += 5;
      soybeanPercent -= 5;
      cottonPercent -= 10;
    } else {
      // Large farms: maximize efficiency with scale
      wheatSuitability += 10;
      cornSuitability += 10;
      
      wheatPercent += 5;
      cornPercent += 10;
      soybeanPercent -= 5;
      cottonPercent -= 10;
    }
    
    // Ensure suitability scores stay within 0-100 range
    wheatSuitability = Math.max(0, Math.min(100, wheatSuitability));
    cornSuitability = Math.max(0, Math.min(100, cornSuitability));
    soybeanSuitability = Math.max(0, Math.min(100, soybeanSuitability));
    cottonSuitability = Math.max(0, Math.min(100, cottonSuitability));
    
    // If any crop has very low suitability, reduce its allocation dramatically
    if (wheatSuitability < 20) wheatPercent = Math.max(0, wheatPercent - 20);
    if (cornSuitability < 20) cornPercent = Math.max(0, cornPercent - 20);
    if (soybeanSuitability < 20) soybeanPercent = Math.max(0, soybeanPercent - 20);
    if (cottonSuitability < 20) cottonPercent = Math.max(0, cottonPercent - 20);
    
    // Add slight variations to make recommendations look more "AI-generated" but realistic
    const randomFactor = 3; // Smaller random factor for more consistent results
    
    const randomizePercent = (basePercent: number) => {
      const variation = Math.floor(Math.random() * randomFactor * 2) - randomFactor;
      return Math.max(0, Math.min(100, basePercent + variation));
    };
    
    // Apply randomization
    wheatPercent = randomizePercent(wheatPercent);
    cornPercent = randomizePercent(cornPercent);
    soybeanPercent = randomizePercent(soybeanPercent);
    cottonPercent = randomizePercent(cottonPercent);
    
    // Normalize to ensure total is 100%
    const total = wheatPercent + cornPercent + soybeanPercent + cottonPercent;
    
    if (total <= 0) {
      // If somehow all crops became unsuitable, reset to default balanced allocation
      wheatPercent = 25;
      cornPercent = 25;
      soybeanPercent = 25;
      cottonPercent = 25;
    } else {
      const normalizeFactor = 100 / total;
      
      wheatPercent = Math.round(wheatPercent * normalizeFactor);
      cornPercent = Math.round(cornPercent * normalizeFactor);
      soybeanPercent = Math.round(soybeanPercent * normalizeFactor);
      cottonPercent = Math.round(cottonPercent * normalizeFactor);
    }
    
    // Ensure we get exactly 100% after rounding
    const roundingError = 100 - (wheatPercent + cornPercent + soybeanPercent + cottonPercent);
    
    // Add rounding error to the most suitable crop
    const suitabilities = [
      { crop: 'wheat', value: wheatSuitability },
      { crop: 'corn', value: cornSuitability },
      { crop: 'soybean', value: soybeanSuitability },
      { crop: 'cotton', value: cottonSuitability }
    ];
    
    suitabilities.sort((a, b) => b.value - a.value);
    const mostSuitableCrop = suitabilities[0].crop;
    
    if (mostSuitableCrop === 'wheat') wheatPercent += roundingError;
    else if (mostSuitableCrop === 'corn') cornPercent += roundingError;
    else if (mostSuitableCrop === 'soybean') soybeanPercent += roundingError;
    else cottonPercent += roundingError;
    
    // Calculate yields, profits, and economic returns based on conditions
    const calculateYield = (crop: CropType, suitability: number): number => {
      const marketData = cropMarketData.find(c => c.crop === crop)!;
      const yieldRange = marketData.yieldRange;
      
      // Calculate yield based on suitability score
      const yieldPercent = suitability / 100;
      const yield_value = yieldRange.min + (yieldRange.max - yieldRange.min) * yieldPercent;
      
      // Add some realistic variation
      return Math.round(yield_value * (0.95 + Math.random() * 0.1));
    };
    
    const calculateProfit = (crop: CropType, yieldPerAcre: number, acres: number): number => {
      const marketData = cropMarketData.find(c => c.crop === crop)!;
      const revenue = yieldPerAcre * marketData.pricePerUnit * acres;
      const cost = marketData.costPerAcre * acres;
      return Math.round(revenue - cost);
    };
    
    // Create allocations with calculated economic data
    const wheatYield = calculateYield('wheat', wheatSuitability);
    const cornYield = calculateYield('corn', cornSuitability);
    const soybeanYield = calculateYield('soybean', soybeanSuitability);
    const cottonYield = calculateYield('cotton', cottonSuitability);
    
    const wheatData = cropMarketData.find(c => c.crop === 'wheat')!;
    const cornData = cropMarketData.find(c => c.crop === 'corn')!;
    const soybeanData = cropMarketData.find(c => c.crop === 'soybean')!;
    const cottonData = cropMarketData.find(c => c.crop === 'cotton')!;
    
    const wheatAcres = (wheatPercent / 100) * acres;
    const cornAcres = (cornPercent / 100) * acres;
    const soybeanAcres = (soybeanPercent / 100) * acres;
    const cottonAcres = (cottonPercent / 100) * acres;
    
    const wheatProfit = calculateProfit('wheat', wheatYield, wheatAcres);
    const cornProfit = calculateProfit('corn', cornYield, cornAcres);
    const soybeanProfit = calculateProfit('soybean', soybeanYield, soybeanAcres);
    const cottonProfit = calculateProfit('cotton', cottonYield, cottonAcres);
    
    return [
      { 
        crop: 'wheat', 
        percentage: wheatPercent, 
        acres: wheatAcres,
        yieldPerAcre: wheatYield,
        pricePerUnit: wheatData.pricePerUnit,
        costPerAcre: wheatData.costPerAcre,
        profit: wheatProfit,
        suitabilityScore: wheatSuitability
      },
      { 
        crop: 'corn', 
        percentage: cornPercent, 
        acres: cornAcres,
        yieldPerAcre: cornYield,
        pricePerUnit: cornData.pricePerUnit,
        costPerAcre: cornData.costPerAcre,
        profit: cornProfit,
        suitabilityScore: cornSuitability
      },
      { 
        crop: 'soybean', 
        percentage: soybeanPercent, 
        acres: soybeanAcres,
        yieldPerAcre: soybeanYield,
        pricePerUnit: soybeanData.pricePerUnit,
        costPerAcre: soybeanData.costPerAcre,
        profit: soybeanProfit,
        suitabilityScore: soybeanSuitability
      },
      { 
        crop: 'cotton', 
        percentage: cottonPercent, 
        acres: cottonAcres,
        yieldPerAcre: cottonYield,
        pricePerUnit: cottonData.pricePerUnit,
        costPerAcre: cottonData.costPerAcre,
        profit: cottonProfit,
        suitabilityScore: cottonSuitability
      }
    ];
  };

  // This is now for display purposes only - AI makes the decisions
  const handleCropAllocationChange = (allocations: CropAllocation[]) => {
    setCropAllocations(allocations);
  };

  const getSoilTypeDisplay = (soilType: string) => {
    return soilType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get crop recommendation data
  const getCropRecommendation = (cropType: CropType): CropRecommendationData => {
    return cropRecommendationData.find(data => data.crop === cropType)!;
  };
  
  // Get unit name for crop
  const getCropUnit = (cropType: CropType): string => {
    return cropMarketData.find(data => data.crop === cropType)?.unit || 'unit';
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-3 bg-primary/10 px-4 py-2 rounded-full">
            <Tractor className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-semibold text-primary">Professional Farm Planning System</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Farm Planner Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your farm details to visualize your farm in 3D with AI-recommended crop allocations.
            Our advanced system analyzes soil, climate, and location for optimal farming decisions.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {!showViz ? (
              <div className="transition-all duration-500 transform hover:scale-[1.01]">
                <LandForm onSubmit={handleLandSubmit} />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="farm-card rounded-lg p-5 shadow-md border border-border/50 bg-card">
                  <div className="farm-card-gradient" aria-hidden="true" />
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold">Your Farm Details</h2>
                    <div className="px-4 py-2 bg-primary/10 rounded-full flex items-center">
                      <Sprout className="h-4 w-4 text-primary mr-2" />
                      <span className="font-semibold text-primary">{farmData?.acres} acres</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Map className="h-3 w-3" /> Location
                      </span>
                      <span className="font-medium">{farmData?.location}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Droplet className="h-3 w-3" /> Soil Type
                      </span>
                      <span className="font-medium">{farmData?.soilType && getSoilTypeDisplay(farmData.soilType)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Thermometer className="h-3 w-3" /> Avg. Temperature
                      </span>
                      <span className="font-medium">{farmData?.temperature}°F</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Droplet className="h-3 w-3" /> Annual Rainfall
                      </span>
                      <span className="font-medium">{farmData?.rainfall} in/year</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border/30">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-muted-foreground flex items-center">
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Estimated Annual Profit:
                      </span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(totalProfitEstimate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground flex items-center">
                        <PieChart className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Overall Suitability Score:
                      </span>
                      <div className="flex items-center">
                        <span className="text-lg font-bold">{Math.round(overallSuitabilityScore)}</span>
                        <span className="text-sm text-muted-foreground ml-1">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="transition-all duration-500 transform hover:scale-[1.01]">
                  <CropSelector 
                    totalAcres={farmData?.acres || 0} 
                    cropAllocations={cropAllocations}
                    onCropAllocationChange={handleCropAllocationChange} 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="farm-card rounded-lg overflow-hidden h-[500px] lg:h-[600px] border border-border/50 bg-card shadow-md">
              {showViz ? (
                <FarmScene acres={farmData?.acres || 0} cropAllocations={cropAllocations} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-sky-light/30 to-sky-dark/10">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/2329/2329865.png" 
                    alt="Farm icon" 
                    className="w-32 h-32 mb-6 opacity-30"
                  />
                  <p className="text-xl text-muted-foreground">
                    Enter your farm details to visualize your farm
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showViz && farmData && (
          <div className="mt-16 border-t border-border/40 pt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Crop Analysis & Recommendations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Detailed information about each recommended crop for your farm conditions
              </p>
            </div>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-5 mb-8 w-full max-w-3xl mx-auto p-1 bg-muted/50 rounded-full">
                <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="wheat" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Wheat className="h-4 w-4 mr-2" />
                  Wheat
                </TabsTrigger>
                <TabsTrigger value="corn" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Sprout className="h-4 w-4 mr-2" />
                  Corn
                </TabsTrigger>
                <TabsTrigger value="soybean" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Leaf className="h-4 w-4 mr-2" />
                  Soybean
                </TabsTrigger>
                <TabsTrigger value="cotton" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Info className="h-4 w-4 mr-2" />
                  Cotton
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cropAllocations.map(crop => {
                    const cropInfo = getCropRecommendation(crop.crop);
                    const cropUnit = getCropUnit(crop.crop);
                    
                    return (
                      <div key={crop.crop} className="bg-card rounded-lg border border-border/50 overflow-hidden shadow-md transition-all hover:shadow-lg">
                        <div className={`h-3 bg-crop-${crop.crop}`}></div>
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg">{cropInfo.name}</h3>
                              <p className="text-xs text-muted-foreground italic">{cropInfo.scientificName}</p>
                            </div>
                            <div className="bg-primary/10 text-primary text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
                              {crop.percentage}%
                            </div>
                          </div>
                          
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Allocated:</span>
                              <span className="font-medium">{crop.acres.toFixed(1)} acres</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expected Yield:</span>
                              <span className="font-medium">{crop.yieldPerAcre} {cropUnit}/acre</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Yield:</span>
                              <span className="font-medium">{Math.round(crop.yieldPerAcre * crop.acres).toLocaleString()} {cropUnit}s</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Market Price:</span>
                              <span className="font-medium">${crop.pricePerUnit.toFixed(2)}/{cropUnit}</span>
                            </div>
                            
                            <div className="pt-2 border-t border-border/30">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center">
                                  <DollarSign className="h-3.5 w-3.5 mr-1 text-green-600" />
                                  Profit:
                                </span>
                                <span className="text-green-600 font-bold">{formatCurrency(crop.profit)}</span>
                              </div>
                            </div>
                            
                            <div className="pt-2">
                              <div className="w-full bg-muted/50 rounded-full h-2 mb-1">
                                <div 
                                  className={`h-2 rounded-full bg-crop-${crop.crop}`} 
                                  style={{ width: `${crop.suitabilityScore}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Suitability Score</span>
                                <span className="font-medium">{Math.round(crop.suitabilityScore)}/100</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="wheat" className="p-4">
                <div className="max-w-4xl mx-auto">
                  {renderDetailedCropInfo('wheat')}
                </div>
              </TabsContent>
              
              <TabsContent value="corn" className="p-4">
                <div className="max-w-4xl mx-auto">
                  {renderDetailedCropInfo('corn')}
                </div>
              </TabsContent>
              
              <TabsContent value="soybean" className="p-4">
                <div className="max-w-4xl mx-auto">
                  {renderDetailedCropInfo('soybean')}
                </div>
              </TabsContent>
              
              <TabsContent value="cotton" className="p-4">
                <div className="max-w-4xl mx-auto">
                  {renderDetailedCropInfo('cotton')}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <footer className="mt-20 text-center text-sm text-muted-foreground">
          <div className="py-6 border-t border-border/40">
            <p className="font-medium">Farm Planner Pro — Plan and manage your agricultural land with precision</p>
          </div>
        </footer>
      </div>
    </div>
  );
  
  // Helper function to render detailed crop information
  function renderDetailedCropInfo(cropType: CropType) {
    const crop = cropAllocations.find(c => c.crop === cropType);
    if (!crop) return null;
    
    const cropInfo = getCropRecommendation(cropType);
    const cropUnit = getCropUnit(cropType);
    const marketData = cropMarketData.find(c => c.crop === cropType)!;
    
    return (
      <div className="bg-card rounded-lg border border-border/50 overflow-hidden shadow-md">
        <div className={`h-2 bg-crop-${cropType}`}></div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{cropInfo.name}</h3>
                  <p className="text-sm text-muted-foreground italic mb-4">{cropInfo.scientificName}</p>
                </div>
                <div className={`bg-crop-${cropType}/20 text-crop-${cropType} font-medium rounded-full px-3 py-1 flex items-center`}>
                  {crop.percentage}% of farm
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">{cropInfo.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-primary" />
                    Suitability for Your Farm
                  </h4>
                  <div className="w-full bg-muted/50 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full bg-crop-${cropType}`} 
                      style={{ width: `${crop.suitabilityScore}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-bold">{Math.round(crop.suitabilityScore)}/100</span>
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                    Yield Projection
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per acre:</span>
                      <span className="font-medium">{crop.yieldPerAcre} {cropUnit}/acre</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total ({crop.acres.toFixed(1)} acres):</span>
                      <span className="font-medium">{Math.round(crop.yieldPerAcre * crop.acres).toLocaleString()} {cropUnit}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry average:</span>
                      <span className="font-medium">{Math.round((marketData.yieldRange.min + marketData.yieldRange.max) / 2)} {cropUnit}/acre</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-3">Growing Tips</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {cropInfo.growingTips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-2">Harvesting Information</h4>
                  <p className="text-muted-foreground">{cropInfo.harvestingInfo}</p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-80 flex-shrink-0">
              <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm mb-6">
                <div className="p-4 border-b border-border/50 bg-muted/30">
                  <h4 className="font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                    Economic Analysis
                  </h4>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Price:</span>
                    <span className="font-medium">${crop.pricePerUnit.toFixed(2)}/{cropUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue/acre:</span>
                    <span className="font-medium">${(crop.yieldPerAcre * crop.pricePerUnit).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost/acre:</span>
                    <span className="font-medium">${crop.costPerAcre.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit/acre:</span>
                    <span className="font-medium">${((crop.profit / crop.acres) || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-border/30">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Revenue:</span>
                      <span className="font-medium">{formatCurrency(crop.yieldPerAcre * crop.pricePerUnit * crop.acres)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span className="font-medium">{formatCurrency(crop.costPerAcre * crop.acres)}</span>
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Profit:</span>
                      <span className="text-green-600 font-bold">{formatCurrency(crop.profit)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border/50 bg-muted/30">
                  <h4 className="font-medium flex items-center">
                    <Info className="h-4 w-4 mr-2 text-primary" />
                    Ideal Growing Conditions
                  </h4>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Best Soil Types:</span>
                    <div className="flex flex-wrap gap-1">
                      {marketData.idealConditions.soilTypes.map(soil => (
                        <span key={soil} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                          {getSoilTypeDisplay(soil)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature Range:</span>
                    <span className="font-medium">{marketData.idealConditions.tempMin}°F - {marketData.idealConditions.tempMax}°F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rainfall Range:</span>
                    <span className="font-medium">{marketData.idealConditions.rainfallMin}" - {marketData.idealConditions.rainfallMax}"/year</span>
                  </div>
                  
                  <div className="pt-3 border-t border-border/30">
                    <h5 className="font-medium mb-2">Market Outlook</h5>
                    <p className="text-muted-foreground text-xs">{cropInfo.marketOutlook}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-border/30">
                    <h5 className="font-medium mb-2">Environmental Impact</h5>
                    <p className="text-muted-foreground text-xs">{cropInfo.environmentalImpact}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Index;
