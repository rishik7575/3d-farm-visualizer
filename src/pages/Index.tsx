
import { useState } from 'react';
import LandForm from '@/components/LandForm';
import CropSelector from '@/components/CropSelector';
import FarmScene from '@/components/FarmScene';
import { CropAllocation } from '@/types/farm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wheat, Sprout, Tractor, Leaf } from "lucide-react";
import { toast } from 'sonner';

const Index = () => {
  const [acres, setAcres] = useState<number>(0);
  const [cropAllocations, setCropAllocations] = useState<CropAllocation[]>([]);
  const [showViz, setShowViz] = useState<boolean>(false);

  const handleLandSubmit = (acreValue: number) => {
    setAcres(acreValue);
    
    // AI recommendation for crop allocation based on land size
    const recommendedAllocations = getAIRecommendation(acreValue);
    setCropAllocations(recommendedAllocations);
    
    setShowViz(true);
    
    toast.success(`AI has recommended optimal crop allocations for your ${acreValue} acres`);
  };

  // AI recommendation function
  const getAIRecommendation = (landSize: number): CropAllocation[] => {
    // This is a simplified AI recommendation logic
    // In a real app, this could be connected to an AI service
    
    // Base allocation percentages
    let wheatPercent = 30;
    let cornPercent = 40;
    let soybeanPercent = 20;
    let cottonPercent = 10;
    
    // Adjust based on land size
    if (landSize < 10) {
      // Small farms: focus on high-value crops
      cornPercent = 50;
      soybeanPercent = 30;
      wheatPercent = 20;
      cottonPercent = 0;
    } else if (landSize > 100) {
      // Large farms: more diverse allocation
      wheatPercent = 35;
      cornPercent = 30;
      soybeanPercent = 20;
      cottonPercent = 15;
    }
    
    return [
      { crop: 'wheat', percentage: wheatPercent, acres: (wheatPercent / 100) * landSize },
      { crop: 'corn', percentage: cornPercent, acres: (cornPercent / 100) * landSize },
      { crop: 'soybean', percentage: soybeanPercent, acres: (soybeanPercent / 100) * landSize },
      { crop: 'cotton', percentage: cottonPercent, acres: (cottonPercent / 100) * landSize }
    ];
  };

  const handleCropAllocationChange = (allocations: CropAllocation[]) => {
    setCropAllocations(allocations);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-3 bg-primary/10 px-4 py-2 rounded-full">
            <Tractor className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-semibold text-primary">Interactive Farm Planning</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            3D Farm Visualizer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your land size to visualize your farm in 3D with AI-recommended crop allocations.
            Our system will determine the optimal crops for your farm size.
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
                <div className="farm-card rounded-lg p-5">
                  <div className="farm-card-gradient" aria-hidden="true" />
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Your Farm</h2>
                    <div className="px-4 py-2 bg-primary/10 rounded-full flex items-center">
                      <Sprout className="h-4 w-4 text-primary mr-2" />
                      <span className="font-semibold text-primary">{acres} acres</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    AI has recommended these crop allocations for your {acres} acres of land.
                  </p>
                </div>
                
                <div className="transition-all duration-500 transform hover:scale-[1.01]">
                  <CropSelector 
                    totalAcres={acres} 
                    onCropAllocationChange={handleCropAllocationChange} 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="farm-card rounded-lg overflow-hidden h-[600px] lg:h-[700px]">
              {showViz ? (
                <FarmScene acres={acres} cropAllocations={cropAllocations} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-sky-light/30 to-sky-dark/10">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/2329/2329865.png" 
                    alt="Farm icon" 
                    className="w-32 h-32 mb-6 opacity-30"
                  />
                  <p className="text-xl text-muted-foreground">
                    Enter your land size to visualize your farm
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showViz && (
          <div className="mt-16 border-t border-border/40 pt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Farm Management Tips</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Make the most of your farming operation with these expert recommendations
              </p>
            </div>
            
            <Tabs defaultValue="general" className="w-full max-w-4xl mx-auto">
              <TabsList className="grid grid-cols-4 mb-8 w-full max-w-2xl mx-auto p-1 bg-muted/50 rounded-full">
                <TabsTrigger value="general" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Tractor className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="wheat" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Wheat className="h-4 w-4 mr-2" />
                  Wheat
                </TabsTrigger>
                <TabsTrigger value="corn" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Sprout className="h-4 w-4 mr-2" />
                  Corn
                </TabsTrigger>
                <TabsTrigger value="other" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Leaf className="h-4 w-4 mr-2" />
                  Other Crops
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="p-8 bg-card rounded-lg border border-border/40 shadow-md">
                <h3 className="text-2xl font-bold mb-4 text-primary">Optimize Your Farm Layout</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Consider crop rotation to maintain soil health",
                    "Position water-intensive crops near water sources",
                    "Group crops with similar care requirements together",
                    "Create buffer zones between different crop types",
                    "Plan for access roads and equipment paths"
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start p-3 bg-muted/30 rounded-lg">
                      <span className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="wheat" className="p-8 bg-card rounded-lg border border-border/40 shadow-md">
                <h3 className="text-2xl font-bold mb-4 text-primary">Wheat Farming Tips</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Plant winter wheat in fall for early summer harvest",
                    "Ensure proper drainage to prevent waterlogging",
                    "Apply nitrogen fertilizer at appropriate growth stages",
                    "Monitor for rust and other fungal diseases",
                    "Consider precision planting for optimal spacing"
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start p-3 bg-muted/30 rounded-lg">
                      <span className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="corn" className="p-8 bg-card rounded-lg border border-border/40 shadow-md">
                <h3 className="text-2xl font-bold mb-4 text-primary">Corn Farming Tips</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Plant when soil temperatures reach 50°F (10°C)",
                    "Space rows to allow for proper air circulation",
                    "Apply fertilizer based on soil test results",
                    "Implement irrigation during critical growth phases",
                    "Monitor for corn borer and other pests"
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start p-3 bg-muted/30 rounded-lg">
                      <span className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="other" className="p-8 bg-card rounded-lg border border-border/40 shadow-md">
                <h3 className="text-2xl font-bold mb-4 text-primary">Other Crops Management</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Soybeans: Consider double-cropping with winter wheat",
                    "Cotton: Allow for adequate sunlight exposure",
                    "Rotate legumes (like soybeans) with non-legumes to fix nitrogen",
                    "Implement integrated pest management strategies",
                    "Consider market demand when planning your crop distribution"
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start p-3 bg-muted/30 rounded-lg">
                      <span className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <footer className="mt-20 text-center text-sm text-muted-foreground">
          <div className="py-6 border-t border-border/40">
            <p className="font-medium">3D Farm Visualizer — Plan and manage your agricultural land efficiently</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
