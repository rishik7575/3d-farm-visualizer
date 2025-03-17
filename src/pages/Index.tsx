
import { useState } from 'react';
import LandForm from '@/components/LandForm';
import CropSelector from '@/components/CropSelector';
import FarmScene from '@/components/FarmScene';
import { CropAllocation } from '@/types/farm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [acres, setAcres] = useState<number>(0);
  const [cropAllocations, setCropAllocations] = useState<CropAllocation[]>([]);
  const [showViz, setShowViz] = useState<boolean>(false);

  const handleLandSubmit = (acreValue: number) => {
    setAcres(acreValue);
    setShowViz(true);
  };

  const handleCropAllocationChange = (allocations: CropAllocation[]) => {
    setCropAllocations(allocations);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold text-center mb-6">3D Farm Visualizer</h1>
      <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
        Enter your land size and allocate different crops to visualize your farm in 3D.
        Optimize your farm layout with this interactive tool.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {!showViz ? (
            <LandForm onSubmit={handleLandSubmit} />
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Your Farm</h2>
                <div className="px-4 py-2 bg-secondary/20 rounded-md">
                  <span className="font-medium">{acres}</span> acres
                </div>
              </div>
              <CropSelector 
                totalAcres={acres} 
                onCropAllocationChange={handleCropAllocationChange} 
              />
            </>
          )}
        </div>

        <div className="lg:col-span-8">
          {showViz ? (
            <FarmScene acres={acres} cropAllocations={cropAllocations} />
          ) : (
            <div className="h-[600px] rounded-lg bg-muted/30 flex flex-col items-center justify-center">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/2329/2329865.png" 
                alt="Farm icon" 
                className="w-24 h-24 mb-4 opacity-20"
              />
              <p className="text-muted-foreground">
                Enter your land size to visualize your farm
              </p>
            </div>
          )}
        </div>
      </div>

      {showViz && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Farm Management Tips</h2>
          
          <Tabs defaultValue="general" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="wheat">Wheat</TabsTrigger>
              <TabsTrigger value="corn">Corn</TabsTrigger>
              <TabsTrigger value="other">Other Crops</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Optimize Your Farm Layout</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Consider crop rotation to maintain soil health</li>
                <li>Position water-intensive crops near water sources</li>
                <li>Group crops with similar care requirements together</li>
                <li>Create buffer zones between different crop types</li>
                <li>Plan for access roads and equipment paths</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="wheat" className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Wheat Farming Tips</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Plant winter wheat in fall for early summer harvest</li>
                <li>Ensure proper drainage to prevent waterlogging</li>
                <li>Apply nitrogen fertilizer at appropriate growth stages</li>
                <li>Monitor for rust and other fungal diseases</li>
                <li>Consider precision planting for optimal spacing</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="corn" className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Corn Farming Tips</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Plant when soil temperatures reach 50°F (10°C)</li>
                <li>Space rows to allow for proper air circulation</li>
                <li>Apply fertilizer based on soil test results</li>
                <li>Implement irrigation during critical growth phases</li>
                <li>Monitor for corn borer and other pests</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="other" className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Other Crops Management</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Soybeans: Consider double-cropping with winter wheat</li>
                <li>Cotton: Allow for adequate sunlight exposure</li>
                <li>Rotate legumes (like soybeans) with non-legumes to fix nitrogen</li>
                <li>Implement integrated pest management strategies</li>
                <li>Consider market demand when planning your crop distribution</li>
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <footer className="mt-20 text-center text-sm text-muted-foreground">
        <p>3D Farm Visualizer - Plan and manage your agricultural land efficiently</p>
      </footer>
    </div>
  );
};

export default Index;
