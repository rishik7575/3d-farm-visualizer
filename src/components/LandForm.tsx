
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tractor, MapPin, Thermometer, Droplet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LandFormProps {
  onSubmit: (formData: FarmData) => void;
}

export interface FarmData {
  acres: number;
  location: string;
  soilType: string;
  temperature: number;
  rainfall: number;
}

const soilTypes = [
  { value: "loam", label: "Loam" },
  { value: "clay", label: "Clay" },
  { value: "sandy", label: "Sandy" },
  { value: "silty", label: "Silty" },
  { value: "peaty", label: "Peaty" },
  { value: "chalky", label: "Chalky" },
  { value: "clayLoam", label: "Clay Loam" },
  { value: "sandyLoam", label: "Sandy Loam" },
  { value: "siltLoam", label: "Silt Loam" }
];

const LandForm = ({ onSubmit }: LandFormProps) => {
  const [formData, setFormData] = useState<FarmData>({
    acres: 50,
    location: "",
    soilType: "loam",
    temperature: 70,
    rainfall: 30
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (field: keyof FarmData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNaN(formData.acres) || formData.acres <= 0) {
      toast.error("Please enter a valid number of acres");
      return;
    }
    
    if (!formData.location.trim()) {
      toast.error("Please enter a location");
      return;
    }
    
    if (formData.acres > 1000) {
      toast.warning("Large land sizes may affect performance");
    }
    
    // Show loading state
    setIsLoading(true);
    
    // Simulate loading for better UX
    setTimeout(() => {
      onSubmit(formData);
      toast.success(`AI is analyzing optimal crop allocations for your farm`);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 border-primary/30 shadow-xl bg-background/95 backdrop-blur-sm transform transition-all duration-500 hover:scale-[1.01]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" aria-hidden="true" />
      <CardHeader className="relative space-y-1 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Farm Planner Pro</CardTitle>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Tractor className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardDescription className="text-base">Enter your farm details for AI-powered crop recommendations</CardDescription>
      </CardHeader>
      
      <CardContent className="relative pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="acres" className="text-base font-medium flex items-center">
              <span className="relative">
                Land Size (in acres)
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary/20 rounded-full"></span>
              </span>
            </Label>
            <div className="relative">
              <Input
                id="acres"
                type="number"
                placeholder="Enter number of acres"
                min="0.1"
                step="0.1"
                value={formData.acres || ''}
                onChange={(e) => handleChange('acres', parseFloat(e.target.value))}
                className="h-12 text-lg border-2 transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary pl-4 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                acres
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="location" className="text-base font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Location / Region</span>
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="Enter your location or region"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="h-10 border-2 transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="soilType" className="text-base font-medium flex items-center gap-2">
              <Droplet className="h-4 w-4 text-primary" />
              <span>Soil Type</span>
            </Label>
            <Select 
              value={formData.soilType} 
              onValueChange={(value) => handleChange('soilType', value)}
            >
              <SelectTrigger className="h-10 border-2 transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary">
                <SelectValue placeholder="Select soil type" />
              </SelectTrigger>
              <SelectContent>
                {soilTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="temperature" className="text-base font-medium flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-primary" />
                <span>Avg. Temp (°F)</span>
              </Label>
              <Input
                id="temperature"
                type="number"
                placeholder="Average temperature"
                min="32"
                max="120"
                value={formData.temperature || ''}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="h-10 border-2 transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="rainfall" className="text-base font-medium flex items-center gap-2">
                <Droplet className="h-4 w-4 text-primary" />
                <span>Rainfall (in/yr)</span>
              </Label>
              <Input
                id="rainfall"
                type="number"
                placeholder="Annual rainfall"
                min="0"
                max="200"
                value={formData.rainfall || ''}
                onChange={(e) => handleChange('rainfall', parseFloat(e.target.value))}
                className="h-10 border-2 transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all shadow-md hover:shadow-lg mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Farm Data...
              </>
            ) : (
              <>Generate AI Recommendations</>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            Our AI will analyze your farm conditions and suggest optimal crop allocations
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default LandForm;
