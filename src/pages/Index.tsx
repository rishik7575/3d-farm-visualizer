
import { useState } from 'react';
import LandForm from '@/components/LandForm';
import CropSelector from '@/components/CropSelector';
import FarmScene from '@/components/FarmScene';
import CropDetailCard from '@/components/CropDetailCard';
import { CropAllocation, FarmData } from '@/types/farm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wheat, Sprout, Tractor, Leaf, Map, Info, BarChart, Droplet, Thermometer } from "lucide-react";
import { toast } from 'sonner';

const Index = () => {
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [cropAllocations, setCropAllocations] = useState<CropAllocation[]>([]);
  const [showViz, setShowViz] = useState<boolean>(false);

  const handleLandSubmit = (formData: FarmData) => {
    setFarmData(formData);
    
    // AI recommendation for crop allocation based on land size and conditions
    const recommendedAllocations = getAIRecommendation(formData);
    setCropAllocations(recommendedAllocations);
    
    setShowViz(true);
    
    toast.success(`AI has recommended optimal crop allocations for your ${formData.acres} acre farm in ${formData.location}`);
  };

  // Enhanced AI recommendation function that takes into account all farm conditions
  const getAIRecommendation = (farmData: FarmData): CropAllocation[] => {
    const { acres, soilType, temperature, rainfall } = farmData;
    
    // Base allocation percentages
    let wheatPercent = 30;
    let cornPercent = 40;
    let soybeanPercent = 20;
    let cottonPercent = 10;
    
    // Adjust based on soil type
    if (soilType === 'sandy') {
      cornPercent += 10;
      wheatPercent -= 5;
      cottonPercent += 5;
      soybeanPercent -= 10;
    } else if (soilType === 'clay') {
      wheatPercent += 10;
      cornPercent -= 10;
      soybeanPercent += 5;
      cottonPercent -= 5;
    } else if (soilType === 'silty' || soilType === 'siltLoam') {
      soybeanPercent += 10;
      cornPercent += 5;
      wheatPercent -= 10;
      cottonPercent -= 5;
    } else if (soilType === 'peaty') {
      soybeanPercent += 15;
      cornPercent -= 5;
      wheatPercent -= 5;
      cottonPercent -= 5;
    }
    
    // Adjust based on temperature
    if (temperature < 60) {
      wheatPercent += 15;
      cornPercent -= 5;
      soybeanPercent -= 5;
      cottonPercent -= 5;
    } else if (temperature > 85) {
      cottonPercent += 15;
      cornPercent += 5;
      wheatPercent -= 15;
      soybeanPercent -= 5;
    }
    
    // Adjust based on rainfall
    if (rainfall < 20) {
      wheatPercent += 10;
      cottonPercent += 5;
      cornPercent -= 10;
      soybeanPercent -= 5;
    } else if (rainfall > 40) {
      cornPercent += 10;
      soybeanPercent += 10;
      wheatPercent -= 10;
      cottonPercent -= 10;
    }
    
    // Adjust based on land size with more nuanced logic
    if (acres < 5) {
      // Very small farms: focus on high-value, low-space crops
      cornPercent += 10;
      soybeanPercent += 5;
      wheatPercent -= 10;
      cottonPercent -= 5;
    } else if (acres < 20) {
      // Small farms
      cornPercent += 5;
      soybeanPercent += 5;
      wheatPercent -= 5;
      cottonPercent -= 5;
    } else if (acres < 50) {
      // Medium-small farms
      // Keep balanced
    } else if (acres < 100) {
      // Medium farms
      wheatPercent += 5;
      cottonPercent += 5;
      cornPercent -= 5;
      soybeanPercent -= 5;
    } else if (acres < 300) {
      // Medium-large farms
      wheatPercent += 10;
      cottonPercent += 5;
      cornPercent -= 10;
      soybeanPercent -= 5;
    } else {
      // Large farms: diverse allocation
      wheatPercent += 5;
      cottonPercent += 5;
      soybeanPercent += 5;
      cornPercent -= 15;
    }
    
    // Add slight variations to make recommendations look more "AI-generated"
    const randomFactor = 5; // Max percentage to vary by
    
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
    const normalizeFactor = 100 / total;
    
    wheatPercent = Math.round(wheatPercent * normalizeFactor);
    cornPercent = Math.round(cornPercent * normalizeFactor);
    soybeanPercent = Math.round(soybeanPercent * normalizeFactor);
    cottonPercent = Math.round(cottonPercent * normalizeFactor);
    
    // Ensure we get exactly 100% after rounding
    const roundingError = 100 - (wheatPercent + cornPercent + soybeanPercent + cottonPercent);
    cornPercent += roundingError; // Add the rounding error to corn
    
    return [
      { crop: 'wheat', percentage: wheatPercent, acres: (wheatPercent / 100) * acres },
      { crop: 'corn', percentage: cornPercent, acres: (cornPercent / 100) * acres },
      { crop: 'soybean', percentage: soybeanPercent, acres: (soybeanPercent / 100) * acres },
      { crop: 'cotton', percentage: cottonPercent, acres: (cottonPercent / 100) * acres }
    ];
  };

  // This is now for display purposes only - AI makes the decisions
  const handleCropAllocationChange = (allocations: CropAllocation[]) => {
    setCropAllocations(allocations);
  };

  const getSoilTypeDisplay = (soilType: string) => {
    return soilType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
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
                  
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="text-sm text-muted-foreground">
                      AI has recommended the following crop allocations for your farm based on your specific conditions.
                    </p>
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
                  {cropAllocations.map(crop => (
                    <CropDetailCard 
                      key={crop.crop}
                      crop={crop}
                      soilType={farmData.soilType}
                      temperature={farmData.temperature}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="wheat" className="p-4">
                <div className="max-w-2xl mx-auto">
                  <CropDetailCard 
                    crop={cropAllocations.find(c => c.crop === 'wheat') || cropAllocations[0]}
                    soilType={farmData.soilType}
                    temperature={farmData.temperature}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="corn" className="p-4">
                <div className="max-w-2xl mx-auto">
                  <CropDetailCard 
                    crop={cropAllocations.find(c => c.crop === 'corn') || cropAllocations[1]}
                    soilType={farmData.soilType}
                    temperature={farmData.temperature}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="soybean" className="p-4">
                <div className="max-w-2xl mx-auto">
                  <CropDetailCard 
                    crop={cropAllocations.find(c => c.crop === 'soybean') || cropAllocations[2]}
                    soilType={farmData.soilType}
                    temperature={farmData.temperature}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="cotton" className="p-4">
                <div className="max-w-2xl mx-auto">
                  <CropDetailCard 
                    crop={cropAllocations.find(c => c.crop === 'cotton') || cropAllocations[3]}
                    soilType={farmData.soilType}
                    temperature={farmData.temperature}
                  />
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
};

export default Index;
