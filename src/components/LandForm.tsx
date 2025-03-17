
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
    toast.success(`Land size set to ${acreValue} acres`);
  };

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 border-primary/20 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" aria-hidden="true" />
      <CardHeader className="relative space-y-1 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Farm Land Visualizer</CardTitle>
          <Tractor className="h-6 w-6 text-primary" />
        </div>
        <CardDescription className="text-base">Enter your land size to begin planning</CardDescription>
      </CardHeader>
      
      <CardContent className="relative pb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="acres" className="text-base font-medium">
              Land Size (in acres)
            </Label>
            <Input
              id="acres"
              type="number"
              placeholder="Enter number of acres"
              min="0.1"
              step="0.1"
              value={acres}
              onChange={(e) => setAcres(e.target.value)}
              className="h-12 text-lg border-2 transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shadow-md hover:shadow-lg"
          >
            Visualize Your Farm
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LandForm;
