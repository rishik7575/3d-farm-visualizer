
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CropAllocation } from '@/types/farm';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Loader2, Maximize2, RefreshCw, RotateCcw, Info, Camera } from 'lucide-react';

interface FarmSceneProps {
  acres: number;
  cropAllocations: CropAllocation[];
}

const FarmScene = ({ acres, cropAllocations }: FarmSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cropObjectsRef = useRef<THREE.Object3D[]>([]);
  const isAnimatingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraAngle, setCameraAngle] = useState<'top' | 'side' | 'angled'>('angled');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    
    // Enhanced sky with improved shader
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
      uniform vec3 sunColor;
      uniform vec3 sunPosition;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float sunEffect = max(dot(normalize(vWorldPosition), normalize(sunPosition)), 0.0);
        sunEffect = pow(sunEffect, 8.0) * 0.5;
        
        vec3 finalColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
        finalColor = mix(finalColor, sunColor, sunEffect);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: new THREE.Color(0x3a86e0) },
      bottomColor: { value: new THREE.Color(0xf7f9fc) },
      sunColor: { value: new THREE.Color(0xffffaa) },
      sunPosition: { value: new THREE.Vector3(100, 50, 100) },
      offset: { value: 33 },
      exponent: { value: 0.8 }
    };
    
    const skyGeo = new THREE.SphereGeometry(900, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    
    sceneRef.current = scene;

    // Enhanced camera with better default settings
    const aspectRatio = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(65, aspectRatio, 0.1, 2000);
    camera.position.set(5, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Professional renderer with advanced settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      logarithmicDepthBuffer: true,
      precision: 'highp',
      powerPreference: 'high-performance',
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.classList.add('three-canvas');
    rendererRef.current = renderer;

    // Enhanced OrbitControls for 360-degree movement
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI / 1.5; // Allow more vertical rotation
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controlsRef.current = controls;

    // Enhanced lighting for more realistic shadows and colors
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfffaf0, 1.2);
    directionalLight.position.set(50, 75, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.normalBias = 0.02;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.7);
    fillLight.position.set(-40, 20, -30);
    scene.add(fillLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x5a3a22, 0.6);
    scene.add(hemisphereLight);

    // Add enhanced environment
    addEnhancedEnvironment(scene);

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        // Make clouds move slowly
        scene.children.forEach(child => {
          if (child.name === 'cloud' && !isAnimatingRef.current) {
            const speed = (child as any).userData.speed || 0.02;
            child.position.x += speed;
            if (child.position.x > 1000) {
              child.position.x = -1000;
            }
          }
        });
        
        // Make water ripple
        const waterMesh = scene.getObjectByName('water');
        if (waterMesh && (waterMesh as THREE.Mesh).material instanceof THREE.ShaderMaterial) {
          const material = (waterMesh as THREE.Mesh).material as THREE.ShaderMaterial;
          if (material.uniforms.time) {
            material.uniforms.time.value += 0.01;
          }
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();
    setIsLoading(false);

    toast.success(
      "Explore your farm in 360°! Drag to rotate, scroll to zoom, right-click to pan",
      { duration: 6000, position: "bottom-center" }
    );

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Enhanced environment with more realistic elements
  const addEnhancedEnvironment = (scene: THREE.Scene) => {
    // Distant mountains with parallax effect
    const createMountainRange = (distance: number, height: number, color: string, opacity: number) => {
      const mountainGeometry = new THREE.BufferGeometry();
      const peaks = 100;
      const positions = [];
      
      for (let i = 0; i < peaks; i++) {
        const x = (i / (peaks - 1)) * 2000 - 1000;
        // Generate more natural-looking mountains with perlin-like noise
        const peakHeight = Math.sin(i * 0.21) * 20 + Math.sin(i * 0.37) * 15 + Math.sin(i * 0.13) * 25 + height;
        positions.push(x, 0, -distance);
        positions.push(x, peakHeight, -distance);
      }
      
      mountainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mountainMaterial = new THREE.LineBasicMaterial({ 
        color: color, 
        opacity: opacity,
        transparent: true,
        linewidth: 1
      });
      
      const mountains = new THREE.LineSegments(mountainGeometry, mountainMaterial);
      scene.add(mountains);
    };
    
    // Create multiple mountain ranges for depth
    createMountainRange(300, 80, '#8393a7', 0.9);
    createMountainRange(500, 100, '#6a7a8a', 0.7);
    createMountainRange(700, 130, '#566573', 0.5);
    
    // Enhanced textured ground with normal maps for realism
    const groundSize = 2000;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 256, 256);
    
    const textureLoader = new THREE.TextureLoader();
    
    // Load higher quality textures
    const grassTexture = textureLoader.load('https://images.unsplash.com/photo-1570748788687-8c929488f8d4?auto=format&fit=crop&w=2000&q=100');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(100, 100);
    
    const grassNormalMap = textureLoader.load('https://assets.babylonjs.com/textures/grass_normal.jpg');
    grassNormalMap.wrapS = THREE.RepeatWrapping;
    grassNormalMap.wrapT = THREE.RepeatWrapping;
    grassNormalMap.repeat.set(100, 100);
    
    const grassRoughnessMap = textureLoader.load('https://assets.babylonjs.com/textures/grass_rough.jpg');
    grassRoughnessMap.wrapS = THREE.RepeatWrapping;
    grassRoughnessMap.wrapT = THREE.RepeatWrapping;
    grassRoughnessMap.repeat.set(100, 100);
    
    // Create undulations in the ground for more realistic terrain
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      const distance = Math.sqrt(x * x + z * z);
      
      // Create gentle rolling hills that get more pronounced farther from center
      if (distance > 50) {
        const amplitude = 0.2 + (distance / groundSize) * 20;
        const frequency = 0.004;
        vertices[i + 1] = Math.sin(x * frequency) * Math.cos(z * frequency) * amplitude;
      }
    }
    
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: grassTexture,
      color: 0x4d7942,
      roughness: 0.9,
      roughnessMap: grassRoughnessMap,
      metalness: 0.05,
      normalMap: grassNormalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      envMapIntensity: 0.5
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    
    addEnhancedLandscape(scene);
    
    // Atmospheric fog for depth perception
    scene.fog = new THREE.FogExp2(0xe6f0ff, 0.0012);
    
    addRealisticClouds(scene);
  };

  const addRealisticClouds = (scene: THREE.Scene) => {
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load('https://assets.babylonjs.com/textures/cloud.png');
    
    // Cloud shape geometries for variety
    const cloudShapes = [
      new THREE.PlaneGeometry(70, 50),
      new THREE.PlaneGeometry(90, 60),
      new THREE.PlaneGeometry(120, 80)
    ];
    
    for (let i = 0; i < 30; i++) {
      const cloudSize = 80 + Math.random() * 180;
      const randomShape = cloudShapes[Math.floor(Math.random() * cloudShapes.length)];
      const cloudGeometry = randomShape.clone();
      
      // Randomize cloud color slightly for variety
      const cloudColor = new THREE.Color(0xffffff);
      cloudColor.r = 0.95 + Math.random() * 0.05;
      cloudColor.g = 0.95 + Math.random() * 0.05;
      cloudColor.b = 0.95 + Math.random() * 0.05;
      
      const cloudMaterial = new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3,
        depthWrite: false,
        color: cloudColor
      });
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.name = 'cloud';
      
      const distance = 300 + Math.random() * 700;
      const angle = Math.random() * Math.PI * 2;
      
      cloud.position.set(
        Math.cos(angle) * distance,
        130 + Math.random() * 120,
        Math.sin(angle) * distance
      );
      
      cloud.rotation.z = Math.random() * Math.PI;
      cloud.lookAt(0, cloud.position.y, 0);
      
      // Store cloud movement speed in userData
      cloud.userData.speed = 0.05 + Math.random() * 0.15;
      
      scene.add(cloud);
    }
  };

  const addEnhancedLandscape = (scene: THREE.Scene) => {
    addNaturalTreeDistribution(scene);
    
    addRealisticWaterFeature(scene);
    
    addRollingHills(scene);
    
    addGroundDetails(scene);
  };

  // Enhanced ground details with rocks, bushes, and small terrain features
  const addGroundDetails = (scene: THREE.Scene) => {
    const textureLoader = new THREE.TextureLoader();
    const rockTexture = textureLoader.load('https://assets.babylonjs.com/textures/rock.png');
    const rockNormalMap = textureLoader.load('https://assets.babylonjs.com/textures/rockn.png');
    
    // Add more variety of rocks
    for (let i = 0; i < 120; i++) {
      const rockSize = 0.5 + Math.random() * 3;
      // Mix different rock shapes
      let rockGeometry;
      const shapeType = Math.random();
      
      if (shapeType < 0.3) {
        rockGeometry = new THREE.SphereGeometry(rockSize, 8, 8);
      } else if (shapeType < 0.6) {
        rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
      } else {
        rockGeometry = new THREE.OctahedronGeometry(rockSize, 0);
      }
      
      // Distort vertices for more natural rock look
      const vertices = rockGeometry.attributes.position.array;
      for (let j = 0; j < vertices.length; j += 3) {
        vertices[j] += (Math.random() - 0.5) * 0.4 * rockSize;
        vertices[j + 1] += (Math.random() - 0.5) * 0.4 * rockSize;
        vertices[j + 2] += (Math.random() - 0.5) * 0.4 * rockSize;
      }
      
      rockGeometry.computeVertexNormals();
      
      // Vary rock colors
      const grayLevel = 0.5 + Math.random() * 0.4;
      const rockColor = new THREE.Color(grayLevel, grayLevel * 0.95, grayLevel * 0.9);
      
      const rockMaterial = new THREE.MeshStandardMaterial({
        map: rockTexture,
        color: rockColor,
        roughness: 0.9,
        metalness: 0.1,
        normalMap: rockNormalMap
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      // Place rocks in a more natural distribution
      const distance = 60 + Math.random() * 160;
      const angle = Math.random() * Math.PI * 2;
      
      rock.position.set(
        Math.cos(angle) * distance,
        -0.5 + rockSize * 0.3,
        Math.sin(angle) * distance
      );
      
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Scale rock slightly randomly
      const scaleVar = 0.8 + Math.random() * 0.4;
      rock.scale.set(scaleVar, scaleVar * (0.8 + Math.random() * 0.4), scaleVar);
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }
    
    // Add small bushes for more detail
    addSmallBushes(scene);
  };

  const addSmallBushes = (scene: THREE.Scene) => {
    for (let i = 0; i < 100; i++) {
      const bushSize = 0.5 + Math.random() * 1.2;
      
      const bushGeometry = new THREE.SphereGeometry(bushSize, 8, 8);
      // Distort for more natural look
      const vertices = bushGeometry.attributes.position.array;
      for (let j = 0; j < vertices.length; j += 3) {
        if (vertices[j + 1] > 0) {
          vertices[j] += (Math.random() - 0.5) * 0.3 * bushSize;
          vertices[j + 1] += (Math.random() - 0.5) * 0.3 * bushSize;
          vertices[j + 2] += (Math.random() - 0.5) * 0.3 * bushSize;
        }
      }
      
      bushGeometry.computeVertexNormals();
      
      // Vary bush greens for realism
      const r = 0.1 + Math.random() * 0.1;
      const g = 0.4 + Math.random() * 0.2;
      const b = 0.1 + Math.random() * 0.1;
      
      const bushMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(r, g, b),
        roughness: 0.8,
        metalness: 0.05
      });
      
      const bush = new THREE.Mesh(bushGeometry, bushMaterial);
      
      // Place bushes with natural distribution
      const distance = 50 + Math.random() * 150;
      const angle = Math.random() * Math.PI * 2;
      
      bush.position.set(
        Math.cos(angle) * distance,
        -0.5 + bushSize * 0.8,
        Math.sin(angle) * distance
      );
      
      // Random rotation and slight scaling
      bush.rotation.y = Math.random() * Math.PI * 2;
      const scaleX = 0.8 + Math.random() * 0.4;
      const scaleZ = 0.8 + Math.random() * 0.4;
      bush.scale.set(scaleX, 1, scaleZ);
      
      bush.castShadow = true;
      bush.receiveShadow = true;
      scene.add(bush);
    }
  };

  // Improved tree clusters that look more natural
  const addNaturalTreeDistribution = (scene: THREE.Scene) => {
    const treePositions = [];
    
    // Create several distinct tree clusters
    const treeClusters = 7;
    const treesPerCluster = 10;
    
    for (let cluster = 0; cluster < treeClusters; cluster++) {
      const clusterRadius = 100 + Math.random() * 60;
      const clusterAngle = (cluster / treeClusters) * Math.PI * 2;
      const clusterX = Math.cos(clusterAngle) * clusterRadius;
      const clusterZ = Math.sin(clusterAngle) * clusterRadius;
      
      const actualTreesInCluster = Math.floor(treesPerCluster + (Math.random() * 6 - 2));
      
      // Create primary trees in the cluster center
      for (let i = 0; i < actualTreesInCluster; i++) {
        const spread = 20 + Math.random() * 15;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spread;
        const x = clusterX + Math.cos(angle) * distance;
        const z = clusterZ + Math.sin(angle) * distance;
        treePositions.push({ x, z, size: 1.0 + Math.random() * 0.3 });
      }
      
      // Add smaller trees around the periphery
      for (let i = 0; i < Math.floor(actualTreesInCluster * 1.5); i++) {
        const spread = spread = 25 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        const distance = spread * 0.7 + Math.random() * (spread * 0.3);
        const x = clusterX + Math.cos(angle) * distance;
        const z = clusterZ + Math.sin(angle) * distance;
        treePositions.push({ x, z, size: 0.7 + Math.random() * 0.3 });
      }
    }
    
    // Add some solitary trees for variety
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 140;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      treePositions.push({ x, z, size: 0.9 + Math.random() * 0.4 });
    }
    
    // Create the trees with more variety
    treePositions.forEach(pos => {
      // More tree type variety
      const treeTypeRoll = Math.random();
      let treeType;
      
      if (treeTypeRoll < 0.35) {
        treeType = 'pine';
      } else if (treeTypeRoll < 0.7) {
        treeType = 'deciduous';
      } else if (treeTypeRoll < 0.85) {
        treeType = 'cypress';
      } else {
        treeType = 'bare';
      }
      
      const treeHeight = (5 + Math.random() * 7) * pos.size;
      
      switch (treeType) {
        case 'pine':
          createPineTree(scene, pos.x, pos.z, treeHeight);
          break;
        case 'deciduous':
          createDeciduousTree(scene, pos.x, pos.z, treeHeight);
          break;
        case 'cypress':
          createCypressTree(scene, pos.x, pos.z, treeHeight);
          break;
        case 'bare':
          createBareTree(scene, pos.x, pos.z, treeHeight);
          break;
      }
    });
  };

  // New tree type for variety
  const createCypressTree = (scene: THREE.Scene, x: number, z: number, height: number) => {
    const textureLoader = new THREE.TextureLoader();
    const barkTexture = textureLoader.load('https://assets.babylonjs.com/textures/bark.jpg');
    barkTexture.wrapS = THREE.RepeatWrapping;
    barkTexture.wrapT = THREE.RepeatWrapping;
    barkTexture.repeat.set(1, 2);
    
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.45, height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      map: barkTexture,
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.1,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, height / 2 - 0.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // Tall, narrow foliage for cypress trees
    const foliageGeometry = new THREE.ConeGeometry(1.2, height * 1.2, 8);
    
    // Dark green for cypress
    const foliageMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(0.05, 0.25, 0.05),
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, height * 0.6, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
  };

  // Another tree variation - bare/dead tree
  const createBareTree = (scene: THREE.Scene, x: number, z: number, height: number) => {
    const tiltX = (Math.random() - 0.5) * 0.3;
    const tiltZ = (Math.random() - 0.5) * 0.3;
    
    const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.6, height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5a4a41,
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
    
    // Add simple branches
    const addBranch = (height: number, angle: number, length: number, thickness: number) => {
      const branchGeometry = new THREE.CylinderGeometry(thickness * 0.6, thickness, length, 5);
      const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
      
      branch.position.y = height;
      branch.position.x = 0;
      branch.position.z = 0;
      
      branch.rotation.z = Math.PI / 2.5;
      branch.rotation.y = angle;
      
      trunk.add(branch);
    };
    
    // Add 3-5 branches
    const branchCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < branchCount; i++) {
      const branchHeight = (i / branchCount) * height * 0.7 + height * 0.2;
      const branchAngle = i * (Math.PI * 2 / branchCount) + Math.random() * 0.5;
      const branchLength = height * (0.2 + Math.random() * 0.2);
      const branchThickness = 0.15 + Math.random() * 0.1;
      
      addBranch(branchHeight, branchAngle, branchLength, branchThickness);
    }
  };

  // Enhanced pine tree with more detail
  const createPineTree = (scene: THREE.Scene, x: number, z: number, height: number) => {
    const textureLoader = new THREE.TextureLoader();
    const barkTexture = textureLoader.load('https://assets.babylonjs.com/textures/bark.jpg');
    barkTexture.wrapS = THREE.RepeatWrapping;
    barkTexture.wrapT = THREE.RepeatWrapping;
    barkTexture.repeat.set(1, 2);
    
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      map: barkTexture,
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.1,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, height / 2 - 0.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // More layers for a fuller pine tree
    const foliageLayers = Math.floor(Math.random() * 2) + 4;
    const layerStep = height * 0.6 / foliageLayers;
    
    // Vary the green slightly for each tree
    const colorVariance = Math.random() * 0.2;
    // More vibrant green for pine trees
    const baseColor = new THREE.Color(0.1, 0.5 - colorVariance, 0.15);
    
    for (let i = 0; i < foliageLayers; i++) {
      // Calculate layer dimensions
      const layerSize = 4 - (i * (3.0 / foliageLayers));
      const layerHeight = 2.5 - (i * (1.0 / foliageLayers));
      
      // Create layer geometry
      const foliageGeometry = new THREE.ConeGeometry(layerSize, layerHeight, 8);
      
      // Slightly vary the green for each layer
      const layerColor = baseColor.clone();
      layerColor.g += (i / foliageLayers) * 0.1; // Higher layers are lighter
      
      const foliageMaterial = new THREE.MeshStandardMaterial({ 
        color: layerColor,
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

  // Enhanced deciduous tree with better foliage and trunk
  const createDeciduousTree = (scene: THREE.Scene, x: number, z: number, height: number) => {
    // Natural slight tilt
    const tiltX = (Math.random() - 0.5) * 0.2;
    const tiltZ = (Math.random() - 0.5) * 0.2;
    
    // Create more detailed trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.7, height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b5a2b,
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
    
    // Add branches
    const branchCount = Math.floor(2 + Math.random() * 3);
    for (let i = 0; i < branchCount; i++) {
      const branchHeight = height * (0.5 + Math.random() * 0.3);
      const branchAngle = i * (Math.PI * 2 / branchCount);
      const branchLength = height * 0.4 * (0.7 + Math.random() * 0.6);
      
      const branchGeometry = new THREE.CylinderGeometry(0.1, 0.2, branchLength, 5);
      const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
      
      // Position branch at an angle from trunk
      branch.position.set(
        x + Math.cos(branchAngle) * 0.3,
        branchHeight,
        z + Math.sin(branchAngle) * 0.3
      );
      
      // Rotate to point outward
      branch.rotation.z = Math.PI / 2 - (branchAngle + Math.PI/2);
      branch.rotation.y = Math.PI/2;
      
      branch.castShadow = true;
      branch.receiveShadow = true;
      scene.add(branch);
    }
    
    // Improved foliage with more natural shape
    const foliageWidth = 3.5 + Math.random() * 2;
    const foliageHeight = 3.5 + Math.random() * 2;
    
    // Use an icosahedron for more natural looking foliage
    const foliageGeometry = new THREE.IcosahedronGeometry(foliageWidth, 1);
    foliageGeometry.scale(1, foliageHeight / foliageWidth, 1);
    
    // Add some random displacement to vertices
    const vertices = foliageGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i] += (Math.random() - 0.5) * 0.2 * foliageWidth;
      vertices[i + 1] += (Math.random() - 0.5) * 0.2 * foliageHeight;
      vertices[i + 2] += (Math.random() - 0.5) * 0.2 * foliageWidth;
    }
    
    foliageGeometry.computeVertexNormals();
    
    // More natural variation in green color
    const colorVariance = Math.random() * 0.15;
    const foliageMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(0.1 + colorVariance, 0.5 - colorVariance, 0.1),
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(
      x + tiltZ * height,
      height - 1 + foliageHeight * 0.5, 
      z + tiltX * height
    );
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
  };

  // Enhanced water feature with realistic shader-based water
  const addRealisticWaterFeature = (scene: THREE.Scene) => {
    const pondRadius = 30;
    const pondGeometry = new THREE.CircleGeometry(pondRadius, 64);
    
    // Advanced water shader with realistic ripples, reflections and depth
    const waterVertexShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Create more complex wave patterns
        float wave1 = sin(pos.x * 8.0 + time * 0.8) * sin(pos.y * 6.0 + time * 0.6) * 0.05;
        float wave2 = sin(pos.x * 12.0 - time * 0.7) * sin(pos.y * 10.0 - time * 0.5) * 0.03;
        pos.z = wave1 + wave2;
        
        vPosition = pos;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
    
    const waterFragmentShader = `
      uniform float time;
      uniform vec3 waterColor;
      uniform vec3 waterHighlight;
      uniform vec3 foamColor;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        // Edge foam pattern
        float edge = 1.0 - smoothstep(0.0, 0.2, distance(vUv, vec2(0.5)));
        
        // Dynamic ripple patterns
        float ripple1 = sin(vUv.x * 40.0 + time * 0.7) * sin(vUv.y * 40.0 + time * 0.8) * 0.1;
        float ripple2 = sin(vUv.x * 30.0 - time * 0.6) * sin(vUv.y * 30.0 - time * 0.9) * 0.1;
        float ripples = ripple1 + ripple2;
        
        // Simulate reflections
        float fresnel = 0.5 + 0.5 * dot(vec3(0, 1, 0), vNormal);
        float reflection = pow(fresnel + ripples, 3.0);
        
        // Edge foam calculation
        float foam = smoothstep(0.8, 0.95, edge) * 0.5;
        foam += smoothstep(0.95, 1.0, edge + ripples) * 0.5;
        
        // Combine colors with depth
        vec3 color = mix(waterColor, waterHighlight, reflection);
        color = mix(color, foamColor, foam);
        
        gl_FragColor = vec4(color, 0.85);
      }
    `;
    
    const waterUniforms = {
      time: { value: 0 },
      waterColor: { value: new THREE.Color(0x1e4d6b) },
      waterHighlight: { value: new THREE.Color(0x4a90e2) },
      foamColor: { value: new THREE.Color(0xffffff) }
    };
    
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const pond = new THREE.Mesh(pondGeometry, waterMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-80, -0.2, 50);
    pond.name = 'water';
    scene.add(pond);
    
    // Add enhanced pond border with rocks and vegetation
    const addPondRocks = () => {
      const rockCount = 32;
      const textureLoader = new THREE.TextureLoader();
      const rockTexture = textureLoader.load('https://assets.babylonjs.com/textures/rock.png');
      const rockNormalMap = textureLoader.load('https://assets.babylonjs.com/textures/rockn.png');
      
      for (let i = 0; i < rockCount; i++) {
        const angle = (i / rockCount) * Math.PI * 2;
        const radiusVariation = pondRadius + (Math.random() * 3 - 1);
        
        const rockSize = 1.2 + Math.random() * 1.8;
        const rockGeometry = new THREE.IcosahedronGeometry(rockSize, 1);
        
        const vertices = rockGeometry.attributes.position.array;
        for (let j = 0; j < vertices.length; j += 3) {
          vertices[j] += (Math.random() - 0.5) * 0.4 * rockSize;
          vertices[j + 1] += (Math.random() - 0.5) * 0.4 * rockSize;
          vertices[j + 2] += (Math.random() - 0.5) * 0.4 * rockSize;
        }
        
        rockGeometry.computeVertexNormals();
        
        const grayLevel = 0.6 + Math.random() * 0.3;
        const rockMaterial = new THREE.MeshStandardMaterial({
          map: rockTexture,
          normalMap: rockNormalMap,
          color: new THREE.Color(grayLevel, grayLevel, grayLevel),
          roughness: 0.9,
          metalness: 0.1
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        rock.position.set(
          -80 + Math.cos(angle) * radiusVariation,
          -0.5 + rockSize * 0.3,
          50 + Math.sin(angle) * radiusVariation
        );
        
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
        
        // Occasionally add aquatic plants near the pond
        if (Math.random() > 0.6) {
          addWaterPlant(scene, 
            -80 + Math.cos(angle) * (radiusVariation - 2 + Math.random() * 4), 
            50 + Math.sin(angle) * (radiusVariation - 2 + Math.random() * 4)
          );
        }
      }
    };
    
    addPondRocks();
  };

  // Add water plants around the pond
  const addWaterPlant = (scene: THREE.Scene, x: number, z: number) => {
    const plantHeight = 0.5 + Math.random() * 1.0;
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.04, plantHeight, 5);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(0.1, 0.5, 0.1),
      roughness: 0.8,
      metalness: 0.0
    });
    
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(x, plantHeight/2 - 0.5, z);
    stem.castShadow = true;
    stem.receiveShadow = true;
    
    // Random slight tilt
    stem.rotation.x = (Math.random() - 0.5) * 0.2;
    stem.rotation.z = (Math.random() - 0.5) * 0.2;
    
    scene.add(stem);
    
    // Leaf or flower
    if (Math.random() > 0.5) {
      // Leaf
      const leafGeometry = new THREE.CircleGeometry(0.3 + Math.random() * 0.2, 5);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(0.1, 0.5, 0.15),
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      });
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.set(x, plantHeight - 0.3, z);
      leaf.rotation.x = Math.PI / 2;
      leaf.rotation.y = Math.random() * Math.PI * 2;
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      scene.add(leaf);
    } else {
      // Flower
      const flowerGeometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 8, 8);
      
      // Random flower colors
      const flowerColorRoll = Math.random();
      let flowerColor;
      
      if (flowerColorRoll < 0.33) {
        flowerColor = new THREE.Color(0.9, 0.9, 1.0); // White
      } else if (flowerColorRoll < 0.66) {
        flowerColor = new THREE.Color(1.0, 1.0, 0.3); // Yellow
      } else {
        flowerColor = new THREE.Color(0.8, 0.4, 0.8); // Purple
      }
      
      const flowerMaterial = new THREE.MeshStandardMaterial({ 
        color: flowerColor,
        roughness: 0.7,
        metalness: 0.1
      });
      
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.set(x, plantHeight - 0.15, z);
      flower.castShadow = true;
      flower.receiveShadow = true;
      scene.add(flower);
    }
  };

  // Enhanced rolling hills with more natural variation
  const addRollingHills = (scene: THREE.Scene) => {
    const hillCount = 4;
    const hillColors = [
      new THREE.Color(0x4a7834),
      new THREE.Color(0x3e6b29),
      new THREE.Color(0x5d8c46),
      new THREE.Color(0x2c5e1a)
    ];
    
    for (let i = 0; i < hillCount; i++) {
      const distance = 200 + i * 70;
      const width = 400 + i * 120;
      const height = 40 + i * 15;
      
      // More detailed hill geometry
      const hillGeometry = new THREE.PlaneGeometry(width, height, 64, 12);
      
      // Apply more complex terrain deformations
      const vertices = hillGeometry.attributes.position.array;
      for (let j = 0; j < vertices.length; j += 3) {
        const x = vertices[j];
        
        // Mix multiple sine waves for more natural hills
        const amplitude1 = 5 + Math.random() * 4;
        const amplitude2 = 3 + Math.random() * 2;
        const frequency1 = 0.01 + Math.random() * 0.005;
        const frequency2 = 0.02 + Math.random() * 0.01;
        
        vertices[j + 1] += 
          Math.sin(x * frequency1) * amplitude1 * (1 - Math.abs(x / width)) +
          Math.sin(x * frequency2 * 3) * amplitude2 * (1 - Math.abs(x / width) * 1.2);
      }
      
      hillGeometry.computeVertexNormals();
      
      // Slightly randomize hill color
      const baseColor = hillColors[i % hillColors.length].clone();
      baseColor.r += (Math.random() - 0.5) * 0.05;
      baseColor.g += (Math.random() - 0.5) * 0.05;
      baseColor.b += (Math.random() - 0.5) * 0.05;
      
      const hillMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
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

  useEffect(() => {
    if (!sceneRef.current || !acres) return;

    const scene = sceneRef.current;
    
    // Remove previous land
    const existingLand = scene.getObjectByName('land');
    if (existingLand) {
      scene.remove(existingLand);
    }

    // Calculate land size based on acres with improved scaling
    const scale = 0.055; // Slightly larger scale for better visibility
    const landSize = Math.sqrt(acres) * 208.7 * scale;
    
    // Create more detailed farmland
    const textureLoader = new THREE.TextureLoader();
    
    // Load higher resolution soil texture
    const soilTexture = textureLoader.load('https://images.unsplash.com/photo-1569792060281-2a22814180b9?auto=format&fit=crop&w=1000&q=100');
    soilTexture.wrapS = THREE.RepeatWrapping;
    soilTexture.wrapT = THREE.RepeatWrapping;
    soilTexture.repeat.set(landSize / 4, landSize / 4);
    
    // Add soil normal map for more realism
    const soilNormalMap = textureLoader.load('https://assets.babylonjs.com/textures/soil_normal.jpg');
    soilNormalMap.wrapS = THREE.RepeatWrapping;
    soilNormalMap.wrapT = THREE.RepeatWrapping;
    soilNormalMap.repeat.set(landSize / 4, landSize / 4);
    
    const landGeometry = new THREE.BoxGeometry(landSize, 0.5, landSize, 64, 1, 64);
    const landMaterial = new THREE.MeshStandardMaterial({ 
      map: soilTexture,
      normalMap: soilNormalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.9,
      metalness: 0.1,
    });
    
    // Create more natural soil undulations
    const vertices = landGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      if (vertices[i + 1] > 0) {
        const x = vertices[i];
        const z = vertices[i + 2];
        const distanceFromCenter = Math.sqrt(x*x + z*z) / landSize;
        
        // More complex terrain variations
        vertices[i + 1] += 
          (Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.05) + 
          (Math.random() * 0.05 - 0.025) * (1 - distanceFromCenter);
      }
    }
    
    landGeometry.computeVertexNormals();
    
    const land = new THREE.Mesh(landGeometry, landMaterial);
    land.receiveShadow = true;
    land.name = 'land';
    land.position.y = -0.25;
    
    scene.add(land);

    // Update camera position based on land size
    updateCameraPosition(landSize);
  }, [acres, cameraAngle]);

  // Enhanced camera positioning
  const updateCameraPosition = (landSize: number) => {
    if (!cameraRef.current) return;
    
    switch (cameraAngle) {
      case 'top':
        cameraRef.current.position.set(0, landSize * 2.2, 0.001);
        break;
      case 'side':
        cameraRef.current.position.set(0, landSize * 0.3, landSize * 2.2);
        break;
      case 'angled':
      default:
        cameraRef.current.position.set(landSize * 1.0, landSize * 0.9, landSize * 1.0);
        break;
    }
    
    cameraRef.current.lookAt(0, 0, 0);
  };

  useEffect(() => {
    if (!sceneRef.current || !acres || cropAllocations.length === 0) return;

    const scene = sceneRef.current;
    
    // Remove existing crops
    const existingCrops = cropObjectsRef.current.filter(obj => obj.name.startsWith('crops-'));
    existingCrops.forEach(obj => scene.remove(obj));
    cropObjectsRef.current = [];

    const land = scene.getObjectByName('land') as THREE.Mesh;
    if (!land) return;

    const landSize = (land.geometry as THREE.BoxGeometry).parameters.width;

    let currentX = -landSize / 2;

    // Create crop sections with enhanced visuals
    cropAllocations.forEach(allocation => {
      if (allocation.percentage <= 0) return;
      
      const sectionWidth = landSize * (allocation.percentage / 100);
      
      // Create plot with improved materials
      const plotGeometry = new THREE.BoxGeometry(sectionWidth, 0.05, landSize);
      
      // Get more vibrant crop colors
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
      
      // Create crop group with enhanced models
      const cropGroup = createEnhancedCropGroup(allocation.crop, sectionWidth, landSize);
      cropGroup.position.set(currentX + sectionWidth / 2, 0.2, 0);
      cropGroup.name = `crops-${allocation.crop}`;
      
      scene.add(cropGroup);
      cropObjectsRef.current.push(cropGroup);
      
      currentX += sectionWidth;
    });

    // Animate crop growth
    growCrops();
  }, [acres, cropAllocations]);

  // Enhanced crop colors with more natural variations
  const getCropColor = (cropType: string): number => {
    const randomFactor = 0.08;
    const randomize = (color: THREE.Color): number => {
      const variance = (Math.random() * 2 - 1) * randomFactor;
      color.r = Math.max(0, Math.min(1, color.r + variance));
      color.g = Math.max(0, Math.min(1, color.g + variance));
      color.b = Math.max(0, Math.min(1, color.b + variance));
      return color.getHex();
    };
    
    switch (cropType) {
      case 'wheat': return randomize(new THREE.Color(0xf5deb3));
      case 'corn': return randomize(new THREE.Color(0xffd700));
      case 'soybean': return randomize(new THREE.Color(0x6b8e23));
      case 'cotton': return randomize(new THREE.Color(0xf5f5f5));
      default: return randomize(new THREE.Color(0x00ff00));
    }
  };

  // Enhanced crop group with more detailed models and better distribution
  const createEnhancedCropGroup = (cropType: string, width: number, depth: number): THREE.Group => {
    const group = new THREE.Group();
    
    // Optimized spacing by crop type
    let spacing = 2;
    switch (cropType) {
      case 'wheat': spacing = 1.1; break;
      case 'corn': spacing = 2.8; break;
      case 'soybean': spacing = 1.8; break;
      case 'cotton': spacing = 2.2; break;
    }
    
    // Calculate grid dimensions based on spacing
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(depth / spacing);
    
    // Create planting pattern with more variety
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        // Different density for different crops
        let skipChance = 0.5;
        switch (cropType) {
          case 'wheat': skipChance = 0.3; break; // More dense wheat fields
          case 'corn': skipChance = 0.5; break;
          case 'soybean': skipChance = 0.4; break;
          case 'cotton': skipChance = 0.45; break;
        }
        
        if (Math.random() > (1 - skipChance)) continue;
        
        let plantMesh: THREE.Object3D;
        
        // Create appropriate plant model
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
        
        // Position with slight randomization for natural look
        const x = (col * spacing) - (width / 2) + (Math.random() * 0.9 - 0.45);
        const z = (row * spacing) - (depth / 2) + (Math.random() * 0.9 - 0.45);
        
        plantMesh.position.set(x, 0, z);
        plantMesh.rotation.y = Math.random() * Math.PI * 2;
        
        // Random scaling for variety
        const baseScale = 0.8 + Math.random() * 0.5;
        plantMesh.scale.set(baseScale, 0, baseScale);
        
        // Animation parameters
        const swaySpeed = 0.4 + Math.random() * 0.6;
        const swayAmount = 0.05 + Math.random() * 0.12;
        
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

  // Generic plant model
  const createGenericPlant = (): THREE.Mesh => {
    const stemGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    return new THREE.Mesh(stemGeometry, stemMaterial);
  };

  // Enhanced wheat plant with more detail
  const createAdvancedWheatPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    const stemGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.8, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xbdb76b,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.4;
    plant.add(stem);
    
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.8;
    
    const headCoreGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.35, 8);
    const headCoreMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5deb3,
      roughness: 0.7
    });
    const headCore = new THREE.Mesh(headCoreGeometry, headCoreMaterial);
    headCore.position.y = 0.15;
    headGroup.add(headCore);
    
    // Add more detailed spikes to wheat head
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const layer = Math.floor(i / 6);
      
      const spikeGeometry = new THREE.ConeGeometry(0.02, 0.12, 4);
      const spikeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xedca82,
        roughness: 0.7
      });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      
      spike.position.x = Math.cos(angle) * 0.07;
      spike.position.z = Math.sin(angle) * 0.07;
      spike.position.y = 0.12 + layer * 0.1;
      spike.rotation.x = Math.PI / 2.5;
      spike.rotation.z = angle;
      
      headGroup.add(spike);
    }
    
    plant.add(headGroup);
    
    // Add some smaller secondary stems
    for (let i = 0; i < 2; i++) {
      const secondaryStemGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4);
      const secondaryStem = new THREE.Mesh(secondaryStemGeometry, stemMaterial);
      
      const angle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
      const direction = i === 0 ? 1 : -1;
      
      secondaryStem.position.x = direction * 0.05;
      secondaryStem.position.y = 0.3;
      secondaryStem.rotation.z = direction * angle;
      
      plant.add(secondaryStem);
      
      // Add smaller wheat head to secondary stem
      const smallHeadGroup = headGroup.clone();
      smallHeadGroup.scale.set(0.6, 0.6, 0.6);
      smallHeadGroup.position.set(
        direction * (0.05 + Math.sin(angle) * 0.3),
        0.3 + Math.cos(angle) * 0.3,
        0
      );
      
      plant.add(smallHeadGroup);
    }
    
    return plant;
  };

  // Enhanced corn plant with detailed leaves and ears
  const createAdvancedCornPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Improved trunk with slight taper
    const stemGeometry = new THREE.CylinderGeometry(0.06, 0.1, 2.2, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x228b22,
      roughness: 0.7
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 1.1;
    plant.add(stem);
    
    // Create more realistic curved leaves
    const addLeaf = (height: number, angle: number, length: number, width: number) => {
      // Create leaf as curved surface
      const leafCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(length * 0.7, length * 0.1, 0),
        new THREE.Vector3(length, -length * 0.2, 0)
      );
      
      const leafPoints = leafCurve.getPoints(10);
      const leafGeometry = new THREE.BufferGeometry().setFromPoints(leafPoints);
      
      // Create leaf as tube along curve
      const leafPathGeometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(leafPoints),
        8,
        width * 0.3,
        8,
        false
      );
      
      // Slight color variation for each leaf
      const colorVariance = Math.random() * 0.1;
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(0.1, 0.5 - colorVariance, 0.1),
        side: THREE.DoubleSide,
        roughness: 0.8
      });
      
      const leaf = new THREE.Mesh(leafPathGeometry, leafMaterial);
      leaf.position.y = height;
      leaf.position.x = 0.1 * Math.cos(angle);
      leaf.position.z = 0.1 * Math.sin(angle);
      
      leaf.rotation.y = angle;
      
      plant.add(leaf);
    };
    
    // Add leaves at different heights and angles
    for (let i = 0; i < 5; i++) {
      const angle = i * (Math.PI / 2.5);
      const height = 0.5 + i * 0.37;
      addLeaf(height, angle, 1.5, 0.3);
    }
    
    // Randomly add corn ears to some plants
    if (Math.random() > 0.2) {
      const earCount = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < earCount; i++) {
        const earGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.9, 8);
        
        // More realistic corn color
        const cornColor = new THREE.Color(0xffd700);
        // Slight variation to the yellow
        cornColor.r = 1.0;
        cornColor.g = 0.84 + Math.random() * 0.08;
        cornColor.b = Math.random() * 0.1;
        
        const earMaterial = new THREE.MeshStandardMaterial({ 
          color: cornColor,
          roughness: 0.7,
          metalness: 0.1
        });
        const ear = new THREE.Mesh(earGeometry, earMaterial);
        
        const earAngle = Math.random() * Math.PI * 2;
        const earHeight = 0.8 + i * 0.6;
        ear.position.set(
          Math.cos(earAngle) * 0.2,
          earHeight,
          Math.sin(earAngle) * 0.2
        );
        ear.rotation.z = Math.PI / 2;
        ear.rotation.y = earAngle;
        
        plant.add(ear);
        
        // Add leaf wrapping around the ear
        const huskGeometry = new THREE.CylinderGeometry(0.19, 0.23, 0.95, 8);
        const huskMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x228b22,
          roughness: 0.8,
          metalness: 0.0,
          side: THREE.BackSide
        });
        
        const husk = new THREE.Mesh(huskGeometry, huskMaterial);
        husk.position.copy(ear.position);
        husk.rotation.copy(ear.rotation);
        plant.add(husk);
        
        // Add silk at the end of the ear
        const silkGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8);
        const silkMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffeba3,
          roughness: 0.6,
          metalness: 0.2
        });
        
        const silkDirection = new THREE.Vector3(
          Math.cos(earAngle),
          0,
          Math.sin(earAngle)
        );
        
        for (let j = 0; j < 8; j++) {
          const silkStrand = new THREE.Mesh(silkGeometry, silkMaterial);
          const silkAngle = earAngle + (Math.random() - 0.5) * 0.5;
          const silkDropAngle = (Math.random() - 0.5) * 0.5;
          
          silkStrand.position.set(
            ear.position.x + Math.cos(silkAngle) * 0.45,
            ear.position.y + Math.sin(silkDropAngle) * 0.1,
            ear.position.z + Math.sin(silkAngle) * 0.45
          );
          
          silkStrand.rotation.z = Math.PI / 2 + silkDropAngle;
          silkStrand.rotation.y = silkAngle + Math.PI / 2;
          
          plant.add(silkStrand);
        }
      }
    }
    
    // Add tassel at the top of the corn plant
    const tasselGroup = new THREE.Group();
    tasselGroup.position.set(0, 2.2, 0);
    
    const mainTasselGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.4, 8);
    const tasselMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xdacd80,
      roughness: 0.8
    });
    
    const mainTassel = new THREE.Mesh(mainTasselGeometry, tasselMaterial);
    mainTassel.position.y = 0.2;
    tasselGroup.add(mainTassel);
    
    // Add branching tassels
    for (let i = 0; i < 8; i++) {
      const branchGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.25, 4);
      const branch = new THREE.Mesh(branchGeometry, tasselMaterial);
      
      const angle = (i / 8) * Math.PI * 2;
      const height = 0.1 + Math.random() * 0.3;
      
      branch.position.set(
        Math.cos(angle) * 0.1,
        height,
        Math.sin(angle) * 0.1
      );
      
      branch.rotation.x = Math.PI / 4;
      branch.rotation.y = angle;
      
      tasselGroup.add(branch);
    }
    
    plant.add(tasselGroup);
    
    return plant;
  };

  // Enhanced soybean plant with more detailed pods and structure
  const createAdvancedSoybeanPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Main stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.7, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b7355,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.35;
    plant.add(stem);
    
    // Create branching structure
    const branchCount = Math.floor(3 + Math.random() * 3);
    
    for (let i = 0; i < branchCount; i++) {
      const branchHeight = 0.1 + (i / branchCount) * 0.5;
      const branchAngle = (i / branchCount) * Math.PI * 2;
      const branchLength = 0.2 + Math.random() * 0.15;
      
      const branchGeometry = new THREE.CylinderGeometry(0.01, 0.015, branchLength, 5);
      const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      branch.position.y = branchHeight;
      branch.position.x = 0.02 * Math.cos(branchAngle);
      branch.position.z = 0.02 * Math.sin(branchAngle);
      
      branch.rotation.z = Math.PI / 2 - 0.3 - branchAngle;
      branch.rotation.y = branchAngle;
      
      plant.add(branch);
      
      // Add soybean pods to each branch
      const podCount = Math.floor(1 + Math.random() * 3);
      for (let j = 0; j < podCount; j++) {
        // More detailed pod geometry
        const podGeometry = new THREE.SphereGeometry(0.025, 8, 8);
        podGeometry.scale(1, 2, 0.7);
        
        // Apply some deformation to make the pods look more natural
        const vertices = podGeometry.attributes.position.array;
        for (let k = 0; k < vertices.length; k += 3) {
          vertices[k] += (Math.random() - 0.5) * 0.005;
          vertices[k + 1] += (Math.random() - 0.5) * 0.01;
          vertices[k + 2] += (Math.random() - 0.5) * 0.005;
        }
        
        podGeometry.computeVertexNormals();
        
        // Vary the green color slightly
        const colorVariance = Math.random() * 0.1;
        const podMaterial = new THREE.MeshStandardMaterial({ 
          color: new THREE.Color(0.25 + colorVariance, 0.4 + colorVariance, 0.1),
          roughness: 0.7,
          metalness: 0.1
        });
        
        const pod = new THREE.Mesh(podGeometry, podMaterial);
        
        const podOffset = (j + 1) / (podCount + 1);
        pod.position.x = branch.position.x + Math.cos(branchAngle) * branchLength * podOffset;
        pod.position.y = branch.position.y;
        pod.position.z = branch.position.z + Math.sin(branchAngle) * branchLength * podOffset;
        
        pod.rotation.x = Math.random() * Math.PI;
        pod.rotation.y = Math.random() * Math.PI;
        pod.rotation.z = Math.random() * Math.PI;
        
        plant.add(pod);
      }
      
      // Add leaves to branches
      const leafGeometry = new THREE.CircleGeometry(0.08, 8);
      
      // More natural leaf color
      const leafColorVariance = Math.random() * 0.1;
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(0.1, 0.5 - leafColorVariance, 0.1),
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

  // Enhanced cotton plant with more realistic bolls and structure
  const createAdvancedCottonPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    // Main stem
    const stemGeometry = new THREE.CylinderGeometry(0.04, 0.06, 1.2, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xa0522d,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.6;
    plant.add(stem);
    
    // Create branching structure
    const branchCount = Math.floor(4 + Math.random() * 3);
    
    for (let i = 0; i < branchCount; i++) {
      const branchHeight = 0.3 + (i / branchCount) * 0.8;
      const branchAngle = (i / branchCount) * Math.PI * 2;
      const branchLength = 0.3 + Math.random() * 0.15;
      
      const branchGeometry = new THREE.CylinderGeometry(0.02, 0.015, branchLength, 5);
      const branch = new THREE.Mesh(branchGeometry, stemMaterial);
      
      branch.position.y = branchHeight;
      branch.position.x = 0.04 * Math.cos(branchAngle);
      branch.position.z = 0.04 * Math.sin(branchAngle);
      
      branch.rotation.z = Math.PI / 2 - 0.3 - branchAngle;
      branch.rotation.y = branchAngle;
      
      plant.add(branch);
      
      // Add cotton bolls with more detail
      if (Math.random() > 0.3) {
        // Create cotton boll geometry with more detail
        const bollGeometry = new THREE.IcosahedronGeometry(0.08, 2);
        
        // Distort boll slightly for more organic look
        const vertices = bollGeometry.attributes.position.array;
        for (let j = 0; j < vertices.length; j += 3) {
          vertices[j] += (Math.random() - 0.5) * 0.01;
          vertices[j + 1] += (Math.random() - 0.5) * 0.01;
          vertices[j + 2] += (Math.random() - 0.5) * 0.01;
        }
        
        bollGeometry.computeVertexNormals();
        
        // Brightness variation for the white cotton
        const whiteness = 0.93 + Math.random() * 0.07;
        const bollMaterial = new THREE.MeshStandardMaterial({ 
          color: new THREE.Color(whiteness, whiteness, whiteness),
          roughness: 0.4,
          metalness: 0.1
        });
        
        const boll = new THREE.Mesh(bollGeometry, bollMaterial);
        
        const tipX = branch.position.x + Math.cos(branchAngle) * branchLength * 0.9;
        const tipZ = branch.position.z + Math.sin(branchAngle) * branchLength * 0.9;
        const tipY = branch.position.y + branchLength * 0.3;
        
        boll.position.set(tipX, tipY, tipZ);
        
        // Add fluff to opened cotton bolls
        if (Math.random() > 0.3) {
          for (let j = 0; j < 6; j++) {
            const fluffAngle = j * Math.PI / 3;
            const fluffGeometry = new THREE.SphereGeometry(0.04, 8, 8);
            fluffGeometry.scale(0.7, 1, 0.7);
            
            const fluffMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.7,
              metalness: 0.05
            });
            
            const fluff = new THREE.Mesh(fluffGeometry, fluffMaterial);
            fluff.position.set(
              boll.position.x + Math.cos(fluffAngle) * 0.08,
              boll.position.y + Math.random() * 0.03,
              boll.position.z + Math.sin(fluffAngle) * 0.08
            );
            
            plant.add(fluff);
          }
        }
        
        plant.add(boll);
      }
      
      // Add leaves
      const leafGeometry = new THREE.PlaneGeometry(0.18, 0.18, 3, 3);
      
      // Distort leaf vertices for more natural shape
      const leafVertices = leafGeometry.attributes.position.array;
      for (let j = 0; j < leafVertices.length; j += 3) {
        if (Math.abs(leafVertices[j]) > 0.05 || Math.abs(leafVertices[j + 1]) > 0.05) {
          leafVertices[j] += (Math.random() - 0.5) * 0.02;
          leafVertices[j + 1] += (Math.random() - 0.5) * 0.02;
        }
      }
      
      leafGeometry.computeVertexNormals();
      
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x355e3b,
        side: THREE.DoubleSide,
        roughness: 0.7
      });
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      leaf.position.x = branch.position.x + Math.cos(branchAngle) * branchLength * 0.5;
      leaf.position.y = branch.position.y + branchLength * 0.15;
      leaf.position.z = branch.position.z + Math.sin(branchAngle) * branchLength * 0.5;
      
      leaf.rotation.y = branchAngle + Math.PI / 4;
      leaf.rotation.x = Math.PI / 3;
      
      plant.add(leaf);
    }
    
    return plant;
  };

  // Improved crop growth animation
  const growCrops = () => {
    isAnimatingRef.current = true;
    
    const targetScale = 1;
    const growDuration = 2500; // Slightly longer for more dramatic effect
    const startTime = Date.now();
    
    const cropGroups = cropObjectsRef.current.filter(obj => obj.name.startsWith('crops-'));
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / growDuration, 1);
      
      // Enhanced easing function for more natural growth
      const easeOutBack = (x: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
      };
      
      const easedProgress = easeOutBack(progress);
      
      cropGroups.forEach(group => {
        group.children.forEach(plant => {
          const baseScale = (plant as any).scale.x;
          plant.scale.set(baseScale, baseScale * easedProgress * targetScale, baseScale);
          
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
        isAnimatingRef.current = false;
        animateSway();
      }
    };
    
    // Continuous sway animation after growth
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

  // Fullscreen toggle with improved handling
  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    
    if (containerRef.current) {
      if (newState) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`);
          });
        }
      }
    }
  };

  // Camera angle cycling
  const toggleCameraAngle = () => {
    setCameraAngle(prev => {
      switch (prev) {
        case 'angled': return 'top';
        case 'top': return 'side';
        case 'side': return 'angled';
        default: return 'angled';
      }
    });
    
    toast.info(`Camera view: ${cameraAngle === 'angled' ? 'Top View' : cameraAngle === 'top' ? 'Side View' : 'Angled View'}`);
  };

  // Camera reset function
  const resetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      updateCameraPosition(acres ? Math.sqrt(acres) * 208.7 * 0.055 : 10);
      
      toast.info("Camera view reset");
    }
  };

  // Toggle help overlay
  const toggleHelp = () => {
    setShowHelp(prev => !prev);
  };

  return (
    <div className="relative w-full h-[550px] rounded-xl overflow-hidden border-2 border-primary/30 shadow-2xl bg-gradient-to-b from-sky-100/30 to-transparent dark:from-sky-900/10">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-4 px-8 py-6 rounded-xl shadow-lg bg-card/90">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xl font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Loading 3D Farm Visualization...
            </p>
          </div>
        </div>
      )}
      
      {showHelp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10" onClick={toggleHelp}>
          <div className="max-w-lg p-6 rounded-xl bg-card/95 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">3D Farm Controls</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Loader2 className="h-5 w-5" />
                </div>
                <span><strong>Left-click + drag</strong>: Rotate the view around your farm</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <span><strong>Scroll wheel</strong>: Zoom in and out</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Maximize2 className="h-5 w-5" />
                </div>
                <span><strong>Right-click + drag</strong>: Pan the view</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <span><strong>View angle button</strong>: Switch between top, side and angled views</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <span><strong>Reset button</strong>: Return to the default view</span>
              </li>
            </ul>
            <Button className="w-full mt-6" onClick={toggleHelp}>Close Help</Button>
          </div>
        </div>
      )}
      
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full w-10 h-10 shadow-md"
          onClick={resetCamera}
          title="Reset camera view"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full w-10 h-10 shadow-md"
          onClick={toggleCameraAngle}
          title="Change camera angle"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="outline" 
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full w-10 h-10 shadow-md"
          onClick={toggleFullscreen}
          title="Toggle fullscreen"
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="outline" 
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full w-10 h-10 shadow-md"
          onClick={toggleHelp}
          title="Help"
        >
          <Info className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute bottom-3 left-3 z-10 helper-label animate-fade-in">
        <p>Left-click drag to rotate • Scroll to zoom • Right-click drag to pan</p>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-full threejs-container"
      />
    </div>
  );
};

export default FarmScene;
