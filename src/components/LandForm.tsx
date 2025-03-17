
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Farm Land Visualizer</CardTitle>
        <CardDescription>Enter your land size to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acres">Land Size (in acres)</Label>
            <Input
              id="acres"
              type="number"
              placeholder="Enter number of acres"
              min="0.1"
              step="0.1"
              value={acres}
              onChange={(e) => setAcres(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full">
            Visualize Land
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LandForm;
