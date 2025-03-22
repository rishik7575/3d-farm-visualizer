import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CropAllocation } from '@/types/farm';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Loader2, Maximize2, RefreshCw } from 'lucide-react';

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
  const [cameraAngle, setCameraAngle] = useState<'top' | 'side' | 'angled'>('angled');

  // Initialize Three.js scene with enhanced visuals
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    
    // Create enhanced sky gradient background
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: new THREE.Color(0x6CA6CD) }, // Enhanced sky blue
      bottomColor: { value: new THREE.Color(0xF8F9FA) }, // Cleaner white
      offset: { value: 33 },
      exponent: { value: 0.7 } // More pronounced gradient
    };
    
    const skyGeo = new THREE.SphereGeometry(500, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    
    sceneRef.current = scene;

    // Create camera with better default position
    const aspectRatio = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(65, aspectRatio, 0.1, 1000); // Wider FOV
    camera.position.set(5, 15, 25); // Better starting position
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create enhanced renderer with better quality settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      logarithmicDepthBuffer: true,
      precision: 'highp',
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3; // Slightly brighter
    renderer.outputEncoding = THREE.sRGBEncoding;
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.classList.add('three-canvas');
    rendererRef.current = renderer;

    // Add enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Stronger ambient
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfffaf0, 0.9); // Warm sunlight
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.bias = -0.0005; // Reduce shadow acne
    scene.add(directionalLight);
    
    // Add subtle hemisphere light for better color and ambient occlusion effect
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3D5E3D, 0.5);
    scene.add(hemisphereLight);

    // Add more realistic environment
    addEnhancedEnvironment(scene);

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

    // Animation loop with subtle camera movement
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Add subtle camera motion
        if (!isAnimatingRef.current && cameraRef.current) {
          const time = Date.now() * 0.0001;
          cameraRef.current.position.y += Math.sin(time) * 0.01;
          cameraRef.current.lookAt(0, 0, 0);
        }
        
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

  // Add enhanced realistic environment elements
  const addEnhancedEnvironment = (scene: THREE.Scene) => {
    // Add distant mountains with better texture
    const mountainGeometry = new THREE.PlaneGeometry(800, 150);
    const mountainTexture = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80');
    mountainTexture.wrapS = THREE.RepeatWrapping;
    mountainTexture.wrapT = THREE.RepeatWrapping;
    mountainTexture.repeat.set(1, 1);
    
    const mountainMaterial = new THREE.MeshBasicMaterial({ 
      map: mountainTexture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    
    const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountains.position.set(0, 40, -300);
    scene.add(mountains);
    
    // Add ground plane with better texture
    const groundSize = 1500;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 64, 64);
    
    // Load ground texture
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('https://images.unsplash.com/photo-1579546929662-711aa81148cf?auto=format&fit=crop&w=800&q=80');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(50, 50);
    
    // Richer ground material
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: grassTexture,
      color: 0x3D5E3D,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add distant trees and other landscape features
    addEnhancedLandscape(scene);
    
    // Add atmospheric fog for depth
    scene.fog = new THREE.FogExp2(0xE6F0FF, 0.0025);
  };
  
  // Add enhanced landscape features
  const addEnhancedLandscape = (scene: THREE.Scene) => {
    // Add trees in a natural distribution
    addNaturalTreeDistribution(scene);
    
    // Add a small pond or water feature
    addWaterFeature(scene);
    
    // Add distant rolling hills
    addRollingHills(scene);
  };
  
  // Add trees distributed in a more natural pattern
  const addNaturalTreeDistribution = (scene: THREE.Scene) => {
    const treePositions = [];
    const treeClusters = 5; // Number of tree clusters
    const treesPerCluster = 8; // Average trees per cluster
    
    // Create natural clusters of trees
    for (let cluster = 0; cluster < treeClusters; cluster++) {
      // Cluster center
      const clusterRadius = 80 + Math.random() * 40;
      const clusterAngle = (cluster / treeClusters) * Math.PI * 2;
      const clusterX = Math.cos(clusterAngle) * clusterRadius;
      const clusterZ = Math.sin(clusterAngle) * clusterRadius;
      
      // Trees in this cluster
      const actualTreesInCluster = Math.floor(treesPerCluster + (Math.random() * 5 - 2));
      
      for (let i = 0; i < actualTreesInCluster; i++) {
        const spread = 15 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        const x = clusterX + Math.cos(angle) * spread * Math.random();
        const z = clusterZ + Math.sin(angle) * spread * Math.random();
        treePositions.push({ x, z });
      }
    }
    
    // Add some individual trees in random locations
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * 100;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      treePositions.push({ x, z });
    }
    
    // Create the trees
    treePositions.forEach(pos => {
      const treeType = Math.random() > 0.7 ? 'pine' : 'deciduous';
      const treeHeight = 5 + Math.random() * 7;
      
      if (treeType === 'pine') {
        createPineTree(scene, pos.x, pos.z, treeHeight);
      } else {
        createDeciduousTree(scene, pos.x, pos.z, treeHeight);
      }
    });
  };
  
  // Create a pine tree
  const createPineTree = (scene: THREE.Scene, x: number, z: number, height: number) => {
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.1,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, height / 2 - 0.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // Multiple layers of foliage for pine tree
    const foliageLayers = Math.floor(Math.random() * 2) + 3;
    const layerStep = height * 0.6 / foliageLayers;
    
    for (let i = 0; i < foliageLayers; i++) {
      const layerSize = 3 - (i * (2.0 / foliageLayers));
      const layerHeight = 2.5 - (i * (1.0 / foliageLayers));
      
      const foliageGeometry = new THREE.ConeGeometry(layerSize, layerHeight, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x004D00,
        roughness: 0.8,
        metalness: 0.1,
      });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(
        x, 
        trunk.position.y + height * 0.4 + (i * layerStep),
        z
      );
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      scene.add(foliage);
    }
  };
  
  // Create a deciduous tree
  const createDeciduousTree = (scene: THREE.Scene, x: number, z: number, height: number) => {
    // Tree trunk with slight random tilt
    const tiltX = (Math.random() - 0.5) * 0.2;
    const tiltZ = (Math.random() - 0.5) * 0.2;
    
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.7, height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B5A2B,
      roughness: 0.9,
      metalness: 0.1,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, height / 2 - 0.5, z);
    trunk.rotation.x = tiltX;
    trunk.rotation.z = tiltZ;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // Foliage as a sphere or ellipsoid
    const foliageWidth = 2.5 + Math.random() * 2;
    const foliageHeight = 3 + Math.random() * 2;
    
    const foliageGeometry = new THREE.SphereGeometry(foliageWidth, 8, 8);
    // Flatten slightly to make it more ellipsoid
    foliageGeometry.scale(1, foliageHeight / foliageWidth, 1);
    
    // Randomize color slightly
    const colorVariance = Math.random() * 0.1;
    const foliageMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(0.1 + colorVariance, 0.5 - colorVariance, 0.1),
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(
      x + tiltZ * height, // Adjust for trunk tilt
      height - 1 + foliageHeight * 0.5, 
      z + tiltX * height
    );
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
  };
  
  // Add a water feature to the landscape
  const addWaterFeature = (scene: THREE.Scene) => {
    // Create a small pond
    const pondRadius = 20;
    const pondGeometry = new THREE.CircleGeometry(pondRadius, 32);
    
    // Use MeshStandardMaterial with blue color and water-like properties
    const pondMaterial = new THREE.MeshStandardMaterial({
      color: 0x3D85C6,
      metalness: 0.9,
      roughness: 0.1,
    });
    
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-60, -0.3, 40); // Position off to one side
    scene.add(pond);
    
    // Add slight animation to water
    const animate = () => {
      if (pond && !isAnimatingRef.current) {
        const time = Date.now() * 0.001;
        pondMaterial.color.r = 0.24 + Math.sin(time) * 0.01;
        pondMaterial.color.g = 0.52 + Math.sin(time * 1.3) * 0.01;
      }
      requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Add rolling hills to the distant landscape
  const addRollingHills = (scene: THREE.Scene) => {
    const hillCount = 3;
    const hillColors = [0x4A7834, 0x3E6B29, 0x5D8C46];
    
    for (let i = 0; i < hillCount; i++) {
      const distance = 150 + i * 50;
      const width = 300 + i * 100;
      const height = 30 + i * 10;
      
      // Create a curved hill using a box with a curved top
      const hillGeometry = new THREE.PlaneGeometry(width, height, 32, 8);
      
      // Shape the hill with a sine wave
      const vertices = hillGeometry.attributes.position.array;
      for (let j = 0; j < vertices.length; j += 3) {
        const x = vertices[j];
        const amplitude = 5 + Math.random() * 3;
        const frequency = 0.02 + Math.random() * 0.01;
        vertices[j + 1] += Math.sin(x * frequency) * amplitude * (1 - Math.abs(x / width));
      }
      
      hillGeometry.computeVertexNormals();
      
      const hillMaterial = new THREE.MeshStandardMaterial({
        color: hillColors[i % hillColors.length],
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      
      const hill = new THREE.Mesh(hillGeometry, hillMaterial);
      hill.position.set(0, height / 2, -distance);
      hill.receiveShadow = true;
      scene.add(hill);
    }
  };

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
    
    // Create textured soil for land
    const textureLoader = new THREE.TextureLoader();
    const soilTexture = textureLoader.load('https://images.unsplash.com/photo-1569792060281-2a22814180b9?auto=format&fit=crop&w=500&q=80');
    soilTexture.wrapS = THREE.RepeatWrapping;
    soilTexture.wrapT = THREE.RepeatWrapping;
    soilTexture.repeat.set(landSize / 5, landSize / 5);
    
    const landGeometry = new THREE.BoxGeometry(landSize, 0.5, landSize, 32, 1, 32);
    const landMaterial = new THREE.MeshStandardMaterial({ 
      map: soilTexture,
      roughness: 1,
      bumpMap: soilTexture,
      bumpScale: 0.05,
    });
    
    // Create slightly uneven land surface
    const vertices = landGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Only modify the y coordinate (every 2nd value, starting at index 1)
      if (i % 3 === 1 && Math.abs(vertices[i]) < 0.25) {
        vertices[i] += (Math.random() * 0.1) - 0.05;
      }
    }
    
    landGeometry.computeVertexNormals();
    
    const land = new THREE.Mesh(landGeometry, landMaterial);
    land.receiveShadow = true;
    land.name = 'land';
    land.position.y = -0.25; // Half the height
    
    scene.add(land);

    // Update camera position based on camera angle setting
    updateCameraPosition(landSize);

  }, [acres, cameraAngle]);

  // Update camera position based on the camera angle setting
  const updateCameraPosition = (landSize: number) => {
    if (!cameraRef.current) return;
    
    switch (cameraAngle) {
      case 'top':
        cameraRef.current.position.set(0, landSize * 2, 0.001); // Small z value to avoid gimbal lock
        break;
      case 'side':
        cameraRef.current.position.set(0, landSize * 0.3, landSize * 2);
        break;
      case 'angled':
      default:
        cameraRef.current.position.set(landSize * 0.8, landSize * 0.7, landSize * 0.8);
        break;
    }
    
    cameraRef.current.lookAt(0, 0, 0);
  };

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
      
      // Create plot of land for this crop with enhanced materials
      const plotGeometry = new THREE.BoxGeometry(sectionWidth, 0.05, landSize);
      
      // Use specialized textures for each crop type
      const plotMaterial = new THREE.MeshStandardMaterial({ 
        color: getCropColor(allocation.crop),
        transparent: true,
        opacity: 0.6,
        roughness: 0.8,
      });
      
      const plot = new THREE.Mesh(plotGeometry, plotMaterial);
      plot.position.set(currentX + sectionWidth / 2, 0.26, 0);
      plot.receiveShadow = true;
      plot.name = `plot-${allocation.crop}`;
      
      scene.add(plot);
      cropObjectsRef.current.push(plot);
      
      // Add crop plants with more detail and variation
      const cropGroup = createEnhancedCropGroup(allocation.crop, sectionWidth, landSize);
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

  // Function to get enhanced crop color with variations
  const getCropColor = (cropType: string): number => {
    // Base colors with slight randomization for natural variation
    const randomFactor = 0.08; // Color variance factor
    const randomize = (color: THREE.Color): number => {
      const variance = (Math.random() * 2 - 1) * randomFactor;
      color.r = Math.max(0, Math.min(1, color.r + variance));
      color.g = Math.max(0, Math.min(1, color.g + variance));
      color.b = Math.max(0, Math.min(1, color.b + variance));
      return color.getHex();
    };
    
    switch (cropType) {
      case 'wheat': 
        return randomize(new THREE.Color(0xF5DEB3));
      case 'corn': 
        return randomize(new THREE.Color(0xFFD700));
      case 'soybean': 
        return randomize(new THREE.Color(0x6B8E23));
      case 'cotton': 
        return randomize(new THREE.Color(0xF5F5F5));
      default: 
        return randomize(new THREE.Color(0x00FF00));
    }
  };

  // Function to create a more detailed group of crop objects
  const createEnhancedCropGroup = (cropType: string, width: number, depth: number): THREE.Group => {
    const group = new THREE.Group();
    
    // Number of rows and columns - vary based on crop type
    let spacing = 2;
    switch (cropType) {
      case 'wheat': spacing = 1.2; break;
      case 'corn': spacing = 2.5; break;
      case 'soybean': spacing = 1.5; break;
      case 'cotton': spacing = 2.0; break;
    }
    
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(depth / spacing);
    
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        // Skip some plants for a more natural look with varying density
        const skipChance = cropType === 'wheat' ? 0.4 : 0.5;
        if (Math.random() > (1 - skipChance)) continue;
        
        let plantMesh: THREE.Object3D;
        
        switch (cropType) {
          case 'wheat':
            plantMesh = createAdvancedWheatPlant();
            break;
          case 'corn':
            plantMesh = createAdvancedCornPlant();
            break;
          case 'soybean':
            plantMesh = createAdvancedSoybeanPlant();
            break;
          case 'cotton':
            plantMesh = createAdvancedCottonPlant();
            break;
          default:
            plantMesh = createGenericPlant();
        }
        
        // Position within the grid, with natural randomization
        const x = (col * spacing) - (width / 2) + (Math.random() * 0.8 - 0.4);
        const z = (row * spacing) - (depth / 2) + (Math.random() * 0.8 - 0.4);
        
        // Slight rotation for natural appearance
        plantMesh.position.set(x, 0, z);
        plantMesh.rotation.y = Math.random() * Math.PI * 2;
        
        // Random scale for variety
        const baseScale = 0.8 + Math.random() * 0.4;
        plantMesh.scale.set(baseScale, 0, baseScale); // Start with no height for growth animation
        
        // Add subtle sway animation
        const swaySpeed = 0.5 + Math.random() * 0.5;
        const swayAmount = 0.05 + Math.random() * 0.1;
        
        // Store animation parameters on the object for later use
        (plantMesh as any).animation = {
          swaySpeed,
          swayAmount,
          swayOffset: Math.random() * Math.PI * 2
        };
        
        plantMesh.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        group.add(plantMesh);
      }
    }
    
    return group;
  };
  
  // Enhanced crop plant creation functions
  const createGenericPlant = (): THREE.Mesh => {
    const stemGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    return new THREE.Mesh(stemGeometry, stemMaterial);
  };
  
  const createAdvancedWheatPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.8, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xBDB76B,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.4;
    plant.add(stem);
    
    // Head of wheat with more detail
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.8;
    
    const headCoreGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.3, 8);
    const headCoreMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 });
    const headCore = new THREE.Mesh(headCoreGeometry, headCoreMaterial);
    headCore.position.y = 0.15;
    headGroup.add(headCore);
    
    // Add small grain spikes around the head
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spikeGeometry = new THREE.ConeGeometry(0.02, 0.1, 4);
      const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xEDDBC0 });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      
      spike.position.x = Math.cos(angle) * 0.06;
      spike.position.z = Math.sin(angle) * 0.06;
      spike.position.y = 0.15 + (i % 3) * 0.05;
      spike.rotation.x = Math.PI / 2;
      spike.rotation.z = angle;
      
      headGroup.add(spike);
    }
    
    plant.add(headGroup);
    
    return plant;
  };
  
  const createAdvancedCornPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Main stem
    const stemGeometry = new THREE.CylinderGeometry(0.06, 0.08, 2, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x228B22,
      roughness: 0.7
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 1;
    plant.add(stem);
    
    // Add leaves
    const addLeaf = (height: number, angle: number, length: number, width: number) => {
      const leafGeometry = new THREE.PlaneGeometry(length, width);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x228B22,
        side: THREE.DoubleSide,
        roughness: 0.8
      });
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.y = height;
      leaf.position.x = 0.2 * Math.cos(angle);
      leaf.position.z = 0.2 * Math.sin(angle);
      
      leaf.rotation.y = angle;
      leaf.rotation.x = Math.PI / 4;
      
      plant.add(leaf);
    };
    
    // Add several leaves at different heights
    for (let i = 0; i < 4; i++) {
      const angle = i * (Math.PI / 2); // Rotate by 90 degrees for each leaf
      const height = 0.4 + i * 0.4; // Space leaves vertically
      addLeaf(height, angle, 1.2, 0.3);
    }
    
    // Add corn ears
    if (Math.random() > 0.3) { // Not all plants have visible ears
      const earGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
      const earMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        roughness: 0.6
      });
      const ear = new THREE.Mesh(earGeometry, earMaterial);
      
      // Position ear on the side of the stalk
      const earAngle = Math.random() * Math.PI * 2;
      ear.position.set(
        Math.cos(earAngle) * 0.2,
        1.2,
        Math.sin(earAngle) * 0.2
      );
      ear.rotation.z = Math.PI / 2; // Horizontal ear
      ear.rotation.y = earAngle;
      
      plant.add(ear);
    }
    
    return plant;
  };
  
  const createAdvancedSoybeanPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Main stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.6, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B7355,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.3;
    plant.add(stem);
    
    // Add soybean pods and leaves
    const branchCount = Math.floor(3 + Math.random() * 3);
    
    for (let i = 0; i < branchCount; i++) {
      // Add a branch
      const branchHeight = 0.1 + (i / branchCount) * 0.5;
      const branchAngle = (i / branchCount) * Math.PI * 2;
      const branchLength = 0.15 + Math.random() * 0.1;
      
      const branchGeometry = new THREE.CylinderGeometry(0.01, 0.01, branchLength, 4);
      const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      branch.position.y = branchHeight;
      branch.position.x = 0.02 * Math.cos(branchAngle);
      branch.position.z = 0.02 * Math.sin(branchAngle);
      
      branch.rotation.z = Math.PI / 2 - branchAngle;
      branch.rotation.y = branchAngle;
      
      plant.add(branch);
      
      // Add pods to branch
      const podCount = Math.floor(1 + Math.random() * 2);
      for (let j = 0; j < podCount; j++) {
        const podGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        podGeometry.scale(1, 2, 0.7); // Elongate the pod
        
        const podMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x6B8E23,
          roughness: 0.7
        });
        
        const pod = new THREE.Mesh(podGeometry, podMaterial);
        
        // Position pod along branch
        const podOffset = (j + 1) / (podCount + 1);
        pod.position.x = branch.position.x + Math.cos(branchAngle) * branchLength * podOffset;
        pod.position.y = branch.position.y;
        pod.position.z = branch.position.z + Math.sin(branchAngle) * branchLength * podOffset;
        
        // Random pod rotation
        pod.rotation.x = Math.random() * Math.PI;
        pod.rotation.y = Math.random() * Math.PI;
        pod.rotation.z = Math.random() * Math.PI;
        
        plant.add(pod);
      }
      
      // Add leaf at branch end
      const leafGeometry = new THREE.CircleGeometry(0.07, 8);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x6B8E23,
        side: THREE.DoubleSide,
        roughness: 0.8
      });
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      leaf.position.x = branch.position.x + Math.cos(branchAngle) * branchLength;
      leaf.position.y = branch.position.y;
      leaf.position.z = branch.position.z + Math.sin(branchAngle) * branchLength;
      
      leaf.rotation.y = branchAngle;
      leaf.rotation.x = Math.PI / 4;
      
      plant.add(leaf);
    }
    
    return plant;
  };
  
  const createAdvancedCottonPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Main stem
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.9, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xA0522D,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.45;
    plant.add(stem);
    
    // Add branches
    const branchCount = Math.floor(3 + Math.random() * 3);
    
    for (let i = 0; i < branchCount; i++) {
      // Add a branch
      const branchHeight = 0.3 + (i / branchCount) * 0.6;
      const branchAngle = (i / branchCount) * Math.PI * 2;
      const branchLength = 0.25 + Math.random() * 0.1;
      
      const branchGeometry = new THREE.CylinderGeometry(0.015, 0.01, branchLength, 4);
      const branch = new THREE.Mesh(branchGeometry, stemMaterial);
      
      branch.position.y = branchHeight;
      branch.position.x = 0.03 * Math.cos(branchAngle);
      branch.position.z = 0.03 * Math.sin(branchAngle);
      
      branch.rotation.z = Math.PI / 2 - 0.3 - branchAngle; // Angle branches upward
      branch.rotation.y = branchAngle;
      
      plant.add(branch);
      
      // Add cotton boll
      if (Math.random() > 0.4) {
        const bollGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const bollMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xFFFFFF,
          roughness: 0.4,
          metalness: 0.1
        });
        
        const boll = new THREE.Mesh(bollGeometry, bollMaterial);
        
        // Position at end of branch with slight offset
        const tipX = branch.position.x + Math.cos(branchAngle) * branchLength * 0.9;
        const tipZ = branch.position.z + Math.sin(branchAngle) * branchLength * 0.9;
        const tipY = branch.position.y + branchLength * 0.3; // Account for upward angle
        
        boll.position.set(tipX, tipY, tipZ);
        
        plant.add(boll);
      }
      
      // Add leaf
      const leafGeometry = new THREE.PlaneGeometry(0.15, 0.15, 2, 2);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x355E3B,
        side: THREE.DoubleSide,
        roughness: 0.7
      });
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      // Position leaf halfway along branch
      leaf.position.x = branch.position.x + Math.cos(branchAngle) * branchLength * 0.5;
      leaf.position.y = branch.position.y + branchLength * 0.15; // Account for upward angle
      leaf.position.z = branch.position.z + Math.sin(branchAngle) * branchLength * 0.5;
      
      // Set leaf orientation
      leaf.rotation.y = branchAngle + Math.PI / 4;
      leaf.rotation.x = Math.PI / 3;
      
      plant.add(leaf);
    }
    
    return plant;
  };
  
  // Animate crop growth
  const growCrops = () => {
    isAnimatingRef.current = true;
    
    const targetScale = 1;
    const growDuration = 2000; // Duration in ms
    const startTime = Date.now();
    
    // Find all crop groups to animate
    const cropGroups = cropObjectsRef.current.filter(obj => obj.name.startsWith('crops-'));
    
    // Animate plant growth
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / growDuration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      
      // Update all crop groups
      cropGroups.forEach(group => {
        group.children.forEach(plant => {
          // Grow plant from ground up
          const baseScale = (plant as any).scale.x; // Original x/z scale
          plant.scale.set(baseScale, baseScale * easedProgress * targetScale, baseScale);
          
          // Apply sway animation if growth is complete
          if (progress === 1 && (plant as any).animation) {
            const { swaySpeed, swayAmount, swayOffset } = (plant as any).animation;
            const time = Date.now() * 0.001;
            plant.rotation.z = Math.sin(time * swaySpeed + swayOffset) * swayAmount;
          }
        });
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Growth animation complete, continue subtle sway
        isAnimatingRef.current = false;
        animateSway();
      }
    };
    
    // Continue swaying animation after growth
    const animateSway = () => {
      if (isAnimatingRef.current) return;
      
      cropGroups.forEach(group => {
        group.children.forEach(plant => {
          if ((plant as any).animation) {
            const { swaySpeed, swayAmount, swayOffset } = (plant as any).animation;
            const time = Date.now() * 0.001;
            plant.rotation.z = Math.sin(time * swaySpeed + swayOffset) * swayAmount;
          }
        });
      });
      
      requestAnimationFrame(animateSway);
    };
    
    animate();
  };
  
  // Toggle fullscreen view
  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    
    if (containerRef.current) {
      if (newState) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };
  
  // Toggle camera angle
  const toggleCameraAngle = () => {
    setCameraAngle(prev => {
      switch (prev) {
        case 'angled': return 'top';
        case 'top': return 'side';
        case 'side': return 'angled';
        default: return 'angled';
      }
    });
  };

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-primary/20 shadow-xl">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-lg font-medium">Loading 3D Farm Visualization...</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full w-10 h-10"
          onClick={toggleCameraAngle}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="outline" 
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full w-10 h-10"
          onClick={toggleFullscreen}
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
    </div>
  );
};

export default FarmScene;
