
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

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    
    // Create sky gradient background
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
      topColor: { value: new THREE.Color(0x77bbff) },
      bottomColor: { value: new THREE.Color(0xffffff) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
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

    // Create camera
    const aspectRatio = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer with antialiasing and high precision
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      logarithmicDepthBuffer: true,
      precision: 'highp'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputEncoding = THREE.sRGBEncoding;
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
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Add subtle hemisphere light for better color
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3D5E3D, 0.4);
    scene.add(hemisphereLight);

    // Add more realistic environment
    addEnvironment(scene);

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

  // Add realistic environment elements
  const addEnvironment = (scene: THREE.Scene) => {
    // Add distant mountains
    const mountainGeometry = new THREE.PlaneGeometry(500, 100);
    const mountainTexture = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1000&q=80');
    const mountainMaterial = new THREE.MeshBasicMaterial({ 
      map: mountainTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    
    const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountains.position.set(0, 20, -200);
    scene.add(mountains);
    
    // Add ground plane extending beyond the farm
    const groundSize = 1000;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3D5E3D,
      roughness: 1,
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add distant trees
    addDistantTrees(scene);
  };
  
  // Add trees to the distant landscape
  const addDistantTrees = (scene: THREE.Scene) => {
    const treePositions = [];
    const radius = 60;
    const count = 30;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius + (Math.random() * 20 - 10);
      const z = Math.sin(angle) * radius + (Math.random() * 20 - 10);
      treePositions.push({ x, z });
    }
    
    treePositions.forEach(pos => {
      const treeHeight = 5 + Math.random() * 5;
      
      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, treeHeight, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, treeHeight / 2 - 0.5, pos.z);
      trunk.castShadow = true;
      scene.add(trunk);
      
      // Tree foliage
      const foliageGeometry = new THREE.ConeGeometry(3, 5, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x004D00 });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(pos.x, treeHeight + 1, pos.z);
      foliage.castShadow = true;
      scene.add(foliage);
    });
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
      const angle = i * (Math.PI / 2);
      addLeaf(0.6 + i * 0.4, angle, 1.2, 0.2);
    }
    
    // Corn cob
    const cornGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 10);
    const cornMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      roughness: 0.5
    });
    const corn = new THREE.Mesh(cornGeometry, cornMaterial);
    corn.rotation.x = Math.PI / 2;
    corn.position.y = 1.2;
    corn.position.z = 0.2;
    
    plant.add(corn);
    
    // Corn silk
    const silkGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6);
    const silkMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFAFA });
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radialDist = 0.05;
      
      const silk = new THREE.Mesh(silkGeometry, silkMaterial);
      silk.position.set(
        corn.position.x,
        corn.position.y,
        corn.position.z + 0.25 + 0.05
      );
      
      // Bend silks outward
      silk.rotation.x = Math.PI / 2;
      silk.rotation.z = (Math.random() - 0.5) * 0.5;
      
      plant.add(silk);
    }
    
    return plant;
  };
  
  const createAdvancedSoybeanPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Main stem
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.7, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8FBC8F,
      roughness: 0.6 
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.35;
    plant.add(stem);
    
    // Add branches
    const addBranch = (height: number, angle: number, length: number) => {
      const branchGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 6);
      const branch = new THREE.Mesh(branchGeometry, stemMaterial);
      
      // Position at the stem
      branch.position.y = height;
      
      // Rotate branch outward
      branch.rotation.z = Math.PI / 2 - Math.PI / 8;
      branch.rotation.y = angle;
      
      // Move branch endpoint away from center
      branch.position.x = Math.cos(angle) * 0.1;
      branch.position.z = Math.sin(angle) * 0.1;
      
      // Add small soybean pods to the branch
      const podsCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < podsCount; i++) {
        const podGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        podGeometry.scale(1, 0.5, 0.6);
        
        const podMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x6B8E23,
          roughness: 0.7
        });
        
        const pod = new THREE.Mesh(podGeometry, podMaterial);
        pod.position.set(
          Math.cos(angle) * (0.2 + i * 0.1),
          height + (i * 0.05) - 0.1,
          Math.sin(angle) * (0.2 + i * 0.1)
        );
        
        plant.add(pod);
      }
      
      plant.add(branch);
    };
    
    // Add 4-6 branches at different heights and angles
    const branchCount = Math.floor(Math.random() * 3) + 4;
    for (let i = 0; i < branchCount; i++) {
      const angle = (i / branchCount) * Math.PI * 2;
      const height = 0.2 + i * (0.5 / branchCount);
      addBranch(height, angle, 0.3);
    }
    
    // Add leaves
    for (let i = 0; i < 5; i++) {
      const leafGeometry = new THREE.CircleGeometry(0.1, 8);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x6B8E23,
        side: THREE.DoubleSide,
        roughness: 0.8
      });
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      const angle = (i / 5) * Math.PI * 2;
      const height = 0.1 + Math.random() * 0.6;
      
      leaf.position.set(
        Math.cos(angle) * 0.2,
        height,
        Math.sin(angle) * 0.2
      );
      
      leaf.rotation.y = angle;
      leaf.rotation.x = Math.PI / 4;
      
      plant.add(leaf);
    }
    
    return plant;
  };
  
  const createAdvancedCottonPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Main stem
    const stemGeometry = new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.6;
    plant.add(stem);
    
    // Add branches
    for (let i = 0; i < 3; i++) {
      const branchGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6);
      const branch = new THREE.Mesh(branchGeometry, stemMaterial);
      
      const angle = (i / 3) * Math.PI * 2;
      const height = 0.4 + i * 0.3;
      
      branch.position.y = height;
      branch.rotation.z = Math.PI / 2 - Math.PI / 6;
      branch.rotation.y = angle;
      
      branch.position.x = Math.cos(angle) * 0.1;
      branch.position.z = Math.sin(angle) * 0.1;
      
      plant.add(branch);
      
      // Add cotton bolls
      const bolls = Math.floor(Math.random() * 2) + 1;
      
      for (let j = 0; j < bolls; j++) {
        const cottonGeometry = new THREE.SphereGeometry(0.1, 12, 12);
        const cottonMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xF5F5F5,
          roughness: 0.2
        });
        
        const cotton = new THREE.Mesh(cottonGeometry, cottonMaterial);
        
        cotton.position.set(
          Math.cos(angle) * (0.3 + j * 0.1),
          height,
          Math.sin(angle) * (0.3 + j * 0.1)
        );
        
        plant.add(cotton);
      }
    }
    
    // Add leaves
    for (let i = 0; i < 5; i++) {
      const leafGeometry = new THREE.PlaneGeometry(0.3, 0.3);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x228B22,
        side: THREE.DoubleSide,
        roughness: 0.7
      });
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      const angle = (i / 5) * Math.PI * 2;
      const height = 0.2 + i * 0.2;
      
      leaf.position.set(
        Math.cos(angle) * 0.15,
        height,
        Math.sin(angle) * 0.15
      );
      
      leaf.rotation.y = angle;
      leaf.rotation.x = Math.PI / 6;
      
      plant.add(leaf);
    }
    
    return plant;
  };
  
  // Function to animate crop growth with more sophisticated animation
  const growCrops = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    
    const growthDuration = 3000; // ms
    const startTime = Date.now();
    
    const animatePlantGrowth = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / growthDuration, 1);
      
      // Use an ease-out curve for more natural growth
      const easedProgress = 1 - Math.pow(1 - progress, 3); 
      
      cropObjectsRef.current.forEach(cropObj => {
        if (cropObj.name.startsWith('crops-')) {
          cropObj.traverse(child => {
            if (child instanceof THREE.Object3D && !(child instanceof THREE.Mesh)) {
              // Animate only the Y scale for growth
              child.scale.y = easedProgress;
              
              // Add gentle swaying if we have stored animation parameters
              if ((child as any).animation && progress > 0.7) {
                const { swaySpeed, swayAmount, swayOffset } = (child as any).animation;
                const swayFactor = (progress - 0.7) / 0.3; // Only start swaying at 70% growth
                
                const time = Date.now() * 0.001;
                child.rotation.z = Math.sin(time * swaySpeed + swayOffset) * swayAmount * swayFactor;
              }
            }
          });
        }
      });
      
      if (progress < 1) {
        requestAnimationFrame(animatePlantGrowth);
      } else {
        isAnimatingRef.current = false;
        toast.success("Your crops have grown successfully!");
      }
    };
    
    animatePlantGrowth();
  };

  // Function to handle camera view changes
  const switchCameraView = (view: 'top' | 'side' | 'angled') => {
    setCameraAngle(view);
    
    // Get land size
    if (sceneRef.current) {
      const land = sceneRef.current.getObjectByName('land') as THREE.Mesh;
      if (land) {
        const landSize = (land.geometry as THREE.BoxGeometry).parameters.width;
        updateCameraPosition(landSize);
      }
    }
    
    toast.success(`Switched to ${view} view`);
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
    <div className="relative w-full h-[600px] lg:h-[700px] rounded-lg overflow-hidden border-2 border-primary/20 bg-black/50">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading 3D Farm Environment...</p>
          </div>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full bg-sky-light" />
      
      <div className="absolute top-4 right-4 space-x-2 flex items-center">
        <Button 
          variant="outline" 
          size="sm"
          className="bg-background/40 backdrop-blur-sm hover:bg-background/60 text-xs"
          onClick={() => switchCameraView('top')}
        >
          Top View
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-background/40 backdrop-blur-sm hover:bg-background/60 text-xs"
          onClick={() => switchCameraView('side')}
        >
          Side View
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-background/40 backdrop-blur-sm hover:bg-background/60 text-xs"
          onClick={() => switchCameraView('angled')}
        >
          Angled View
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-background/40 backdrop-blur-sm hover:bg-background/60"
          onClick={toggleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="absolute bottom-4 left-4">
        <Button 
          variant="outline" 
          size="sm"
          className="bg-primary/80 text-primary-foreground hover:bg-primary/90 flex items-center space-x-1"
          onClick={() => growCrops()}
          disabled={isAnimatingRef.current}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Regrow Crops
        </Button>
      </div>
      
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/40 backdrop-blur-sm rounded-md text-sm">
        {acres} acres • {cropAllocations.filter(c => c.percentage > 0).length} crop types
      </div>
    </div>
  );
};

export default FarmScene;
