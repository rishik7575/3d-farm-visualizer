
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CropAllocation } from '@/types/farm';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Loader2, Maximize2 } from 'lucide-react';

interface FarmSceneProps {
  acres: number;
  cropAllocations: CropAllocation[];
}

const FarmScene = ({ acres, cropAllocations }: FarmSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cropObjectsRef = useRef<THREE.Object3D[]>([]);
  const isAnimatingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#87CEEB'); // Sky blue
    sceneRef.current = scene;

    // Create camera
    const aspectRatio = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.classList.add('three-canvas');
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();
    setIsLoading(false);

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Create or update the land based on the acres value
  useEffect(() => {
    if (!sceneRef.current || !acres) return;

    const scene = sceneRef.current;
    
    // Clear any existing land
    const existingLand = scene.getObjectByName('land');
    if (existingLand) {
      scene.remove(existingLand);
    }

    // Land dimensions (1 acre is approximately 208.7 x 208.7 feet)
    // For visualization, scale it down
    const scale = 0.05; // Scale down factor
    const landSize = Math.sqrt(acres) * 208.7 * scale;
    
    // Create land
    const landGeometry = new THREE.BoxGeometry(landSize, 0.5, landSize);
    const landMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, // soil color
      roughness: 1,
    });
    
    const land = new THREE.Mesh(landGeometry, landMaterial);
    land.receiveShadow = true;
    land.name = 'land';
    land.position.y = -0.25; // Half the height
    
    scene.add(land);

    // Adjust camera position based on land size
    if (cameraRef.current) {
      cameraRef.current.position.set(0, landSize * 0.5, landSize * 1.2);
      cameraRef.current.lookAt(0, 0, 0);
    }

  }, [acres]);

  // Update crops based on allocations
  useEffect(() => {
    if (!sceneRef.current || !acres || cropAllocations.length === 0) return;

    const scene = sceneRef.current;
    
    // Clear any existing crops
    cropObjectsRef.current.forEach(obj => {
      scene.remove(obj);
    });
    cropObjectsRef.current = [];

    // Get land object
    const land = scene.getObjectByName('land') as THREE.Mesh;
    if (!land) return;

    const landSize = (land.geometry as THREE.BoxGeometry).parameters.width;

    let currentX = -landSize / 2;

    cropAllocations.forEach(allocation => {
      if (allocation.percentage <= 0) return;
      
      // Calculate the width of this crop section
      const sectionWidth = landSize * (allocation.percentage / 100);
      
      // Create plot of land for this crop
      const plotGeometry = new THREE.BoxGeometry(sectionWidth, 0.1, landSize);
      const plotMaterial = new THREE.MeshStandardMaterial({ 
        color: getCropColor(allocation.crop),
        transparent: true,
        opacity: 0.7,
      });
      
      const plot = new THREE.Mesh(plotGeometry, plotMaterial);
      plot.position.set(currentX + sectionWidth / 2, 0.3, 0);
      plot.receiveShadow = true;
      plot.name = `plot-${allocation.crop}`;
      
      scene.add(plot);
      cropObjectsRef.current.push(plot);
      
      // Add crop plants
      const cropGroup = createCropGroup(allocation.crop, sectionWidth, landSize);
      cropGroup.position.set(currentX + sectionWidth / 2, 0.2, 0);
      cropGroup.name = `crops-${allocation.crop}`;
      
      scene.add(cropGroup);
      cropObjectsRef.current.push(cropGroup);
      
      // Move to the next section
      currentX += sectionWidth;
    });

    // Animate crop growth
    growCrops();

  }, [acres, cropAllocations]);

  // Function to get crop color
  const getCropColor = (cropType: string): number => {
    switch (cropType) {
      case 'wheat': return 0xF5DEB3;
      case 'corn': return 0xFFD700;
      case 'soybean': return 0x6B8E23;
      case 'cotton': return 0xF5F5F5;
      default: return 0x00FF00;
    }
  };

  // Function to create a group of crop objects
  const createCropGroup = (cropType: string, width: number, depth: number): THREE.Group => {
    const group = new THREE.Group();
    
    // Number of rows and columns
    const spacing = 2;
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(depth / spacing);
    
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        // Skip some plants for a more natural look
        if (Math.random() > 0.7) continue;
        
        let plantMesh: THREE.Mesh;
        
        switch (cropType) {
          case 'wheat':
            plantMesh = createWheatPlant();
            break;
          case 'corn':
            plantMesh = createCornPlant();
            break;
          case 'soybean':
            plantMesh = createSoybeanPlant();
            break;
          case 'cotton':
            plantMesh = createCottonPlant();
            break;
          default:
            plantMesh = createGenericPlant();
        }
        
        // Position within the grid, with slight random offset
        const x = (col * spacing) - (width / 2) + (Math.random() * 0.5);
        const z = (row * spacing) - (depth / 2) + (Math.random() * 0.5);
        
        plantMesh.position.set(x, 0, z);
        
        // Random scale for variety
        const scale = 0.8 + Math.random() * 0.4;
        plantMesh.scale.set(scale, 0, scale); // Start with no height for growth animation
        
        plantMesh.castShadow = true;
        group.add(plantMesh);
      }
    }
    
    return group;
  };
  
  // Crop plant creation functions
  const createGenericPlant = (): THREE.Mesh => {
    const stemGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    return new THREE.Mesh(stemGeometry, stemMaterial);
  };
  
  const createWheatPlant = (): THREE.Mesh => {
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xBDB76B });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    
    const headGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.3, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.5;
    
    stem.add(head);
    return stem;
  };
  
  const createCornPlant = (): THREE.Mesh => {
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.07, 2, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    
    const cornGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.4, 8);
    const cornMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const corn = new THREE.Mesh(cornGeometry, cornMaterial);
    corn.position.y = 0.3;
    corn.rotation.x = Math.PI / 2;
    corn.position.z = 0.15;
    
    stem.add(corn);
    return stem;
  };
  
  const createSoybeanPlant = (): THREE.Mesh => {
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.6, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8FBC8F });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    
    const leafGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x6B8E23 });
    
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.y = 0.1 + (i * 0.15);
      leaf.position.x = Math.cos(i * Math.PI / 2) * 0.1;
      leaf.position.z = Math.sin(i * Math.PI / 2) * 0.1;
      leaf.scale.set(0.7, 0.3, 0.7);
      stem.add(leaf);
    }
    
    return stem;
  };
  
  const createCottonPlant = (): THREE.Mesh => {
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.04, 1, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    
    const cottonGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const cottonMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5 });
    
    for (let i = 0; i < 3; i++) {
      const cotton = new THREE.Mesh(cottonGeometry, cottonMaterial);
      cotton.position.y = 0.3 + (i * 0.25);
      cotton.position.x = Math.cos(i * Math.PI * 2/3) * 0.15;
      cotton.position.z = Math.sin(i * Math.PI * 2/3) * 0.15;
      stem.add(cotton);
    }
    
    return stem;
  };
  
  // Function to animate crop growth
  const growCrops = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    
    const growthDuration = 2000; // ms
    const startTime = Date.now();
    
    const animatePlantGrowth = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / growthDuration, 1);
      
      cropObjectsRef.current.forEach(cropObj => {
        if (cropObj.name.startsWith('crops-')) {
          cropObj.traverse(child => {
            if (child instanceof THREE.Mesh) {
              // Animate only the Y scale for growth
              child.scale.y = progress;
            }
          });
        }
      });
      
      if (progress < 1) {
        requestAnimationFrame(animatePlantGrowth);
      } else {
        isAnimatingRef.current = false;
        toast.success("Crops have grown!");
      }
    };
    
    animatePlantGrowth();
  };

  // Function to handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-[600px] lg:h-[800px] rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full bg-sky-light" />
      <Button 
        variant="outline" 
        size="icon"
        className="absolute top-4 right-4 bg-background/40 backdrop-blur-sm hover:bg-background/60"
        onClick={toggleFullscreen}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default FarmScene;
