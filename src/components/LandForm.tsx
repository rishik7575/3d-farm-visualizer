
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tractor } from 'lucide-react';

interface LandFormProps {
  onSubmit: (acres: number) => void;
}

const LandForm = ({ onSubmit }: LandFormProps) => {
  const [acres, setAcres] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const acreValue = parseFloat(acres);
    
    if (isNaN(acreValue) || acreValue <= 0) {
      toast.error("Please enter a valid number of acres");
      return;
    }
    
    if (acreValue > 1000) {
      toast.warning("Large land sizes may affect performance");
    }
    
    onSubmit(acreValue);
  };

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 border-primary/30 shadow-xl bg-background/95 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" aria-hidden="true" />
      <CardHeader className="relative space-y-1 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Farm Land Visualizer</CardTitle>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Tractor className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardDescription className="text-base">Enter your land size for AI-powered crop recommendations</CardDescription>
      </CardHeader>
      
      <CardContent className="relative pb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                value={acres}
                onChange={(e) => setAcres(e.target.value)}
                className="h-12 text-lg border-2 transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary pl-4 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                acres
              </span>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all shadow-md hover:shadow-lg"
          >
            Generate AI Recommendations
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Our AI will analyze your farm size and suggest optimal crop allocations
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default LandForm;
