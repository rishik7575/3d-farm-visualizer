
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tractor, Wind, Leaf, BarChart3 } from 'lucide-react';

interface LandFormProps {
  onSubmit: (acres: number) => void;
}

const LandForm = ({ onSubmit }: LandFormProps) => {
  const [acres, setAcres] = useState<string>('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Auto-sample initial values for visual appeal
  useEffect(() => {
    const sampleValues = [5, 12, 25, 50, 125];
    const randomSample = sampleValues[Math.floor(Math.random() * sampleValues.length)];
    
    // Animation delay before setting sample value
    const timer = setTimeout(() => {
      setAcres(randomSample.toString());
      
      // Auto-submit initial value after a delay
      setTimeout(() => {
        onSubmit(randomSample);
        toast.success(`AI is analyzing optimal crop allocations for ${randomSample} acres`);
      }, 800);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [onSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const acreValue = parseFloat(acres);
    
    if (isNaN(acreValue) || acreValue <= 0) {
      toast.error("Please enter a valid number of acres");
      return;
    }
    
    if (acreValue > 1000) {
      toast.warning("Large land sizes may affect visualization performance");
    }
    
    onSubmit(acreValue);
    toast.success(`AI is analyzing optimal crop allocations for ${acreValue} acres`);
  };

  // Auto-submit after delay when valid value is entered
  const handleAcreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAcres(value);
    
    const acreValue = parseFloat(value);
    if (!isNaN(acreValue) && acreValue > 0) {
      // Clear any existing timeout
      const timeoutId = setTimeout(() => {
        onSubmit(acreValue);
        toast.success(`AI is analyzing optimal crop allocations for ${acreValue} acres`);
      }, 800); // Slight delay to allow user to finish typing
      
      return () => clearTimeout(timeoutId);
    }
  };

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 border-primary/40 shadow-2xl bg-background/95 backdrop-blur-lg transform transition-all duration-500 hover:scale-[1.02] rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/15 pointer-events-none rounded-xl" aria-hidden="true" />
      <CardHeader className="relative space-y-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-sm">Farm Land Visualizer</CardTitle>
            <CardDescription className="text-base text-foreground/80">AI-powered crop recommendations</CardDescription>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shadow-inner">
            <Tractor className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative pb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="acres" className="text-base font-medium flex items-center">
              <span className="relative inline-flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-primary/80" />
                Land Size (in acres)
                <span className={`absolute -bottom-1 left-0 w-full h-1 bg-primary/30 rounded-full transition-transform duration-300 ${isInputFocused ? 'scale-x-100' : 'scale-x-30'}`}></span>
              </span>
            </Label>
            <div className="relative">
              <Input
                id="acres"
                type="number"
                placeholder="Enter number of acres"
                min="0.1"
                step="0.1"
                value={acres}
                onChange={handleAcreChange}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                className="h-14 text-lg border-2 transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary pl-5 pr-14 shadow-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground bg-background/80 px-1 rounded">
                acres
              </span>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all shadow-lg hover:shadow-xl border border-primary/20 group"
          >
            <span className="mr-2 group-hover:scale-110 transition-transform">Generate AI Recommendations</span>
            <Leaf className="h-5 w-5 group-hover:animate-spin transition-all" />
          </Button>
          <div className="flex items-center justify-center mt-4 pt-2 border-t border-border/30">
            <Wind className="h-4 w-4 mr-2 text-primary/60" />
            <p className="text-xs text-center text-muted-foreground italic">
              Our AI analyzes your farm size and suggests optimal crop allocations
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LandForm;
