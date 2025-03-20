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
        const spread = 25 + Math.random() * 20;
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
        metalness: 0.1
