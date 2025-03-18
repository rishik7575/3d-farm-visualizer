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

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    
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
      topColor: { value: new THREE.Color(0x4A90E2) },
      bottomColor: { value: new THREE.Color(0xF7F9FC) },
      offset: { value: 33 },
      exponent: { value: 0.8 }
    };
    
    const skyGeo = new THREE.SphereGeometry(800, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    
    sceneRef.current = scene;

    const aspectRatio = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(65, aspectRatio, 0.1, 2000);
    camera.position.set(5, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      logarithmicDepthBuffer: true,
      precision: 'highp',
      powerPreference: 'high-performance',
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputEncoding = THREE.sRGBEncoding;
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.classList.add('three-canvas');
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFAF0, 1.0);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.bias = -0.0003;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xE6F0FF, 0.5);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x5A3A22, 0.4);
    scene.add(hemisphereLight);

    addEnhancedEnvironment(scene);

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        if (!isAnimatingRef.current && cameraRef.current) {
          const time = Date.now() * 0.0001;
          cameraRef.current.position.y += Math.sin(time) * 0.008;
          cameraRef.current.position.x += Math.sin(time * 0.5) * 0.003;
          cameraRef.current.lookAt(0, 0, 0);
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();
    setIsLoading(false);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  const addEnhancedEnvironment = (scene: THREE.Scene) => {
    const mountainGeometry = new THREE.PlaneGeometry(1000, 200);
    const textureLoader = new THREE.TextureLoader();
    
    const mountainTexture = textureLoader.load('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80');
    mountainTexture.wrapS = THREE.RepeatWrapping;
    mountainTexture.wrapT = THREE.RepeatWrapping;
    mountainTexture.repeat.set(1, 1);
    
    const mountainMaterial = new THREE.MeshBasicMaterial({ 
      map: mountainTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    
    const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountains.position.set(0, 60, -400);
    scene.add(mountains);
    
    const farMountainGeometry = new THREE.PlaneGeometry(1200, 120);
    const farMountainTexture = textureLoader.load('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80');
    
    const farMountainMaterial = new THREE.MeshBasicMaterial({ 
      map: farMountainTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    
    const farMountains = new THREE.Mesh(farMountainGeometry, farMountainMaterial);
    farMountains.position.set(0, 30, -600);
    scene.add(farMountains);
    
    const groundSize = 2000;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 128, 128);
    
    const grassTexture = textureLoader.load('https://images.unsplash.com/photo-1570748788687-8c929488f8d4?auto=format&fit=crop&w=1000&q=80');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(100, 100);
    
    const grassNormalMap = textureLoader.load('https://assets.babylonjs.com/textures/grass_normal.jpg');
    grassNormalMap.wrapS = THREE.RepeatWrapping;
    grassNormalMap.wrapT = THREE.RepeatWrapping;
    grassNormalMap.repeat.set(100, 100);
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: grassTexture,
      color: 0x4D7942,
      roughness: 0.8,
      metalness: 0.05,
      normalMap: grassNormalMap,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    
    addEnhancedLandscape(scene);
    
    scene.fog = new THREE.FogExp2(0xE6F0FF, 0.0018);
    
    addClouds(scene);
  };

  const addClouds = (scene: THREE.Scene) => {
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load('https://assets.babylonjs.com/textures/cloud.png');
    
    for (let i = 0; i < 20; i++) {
      const cloudSize = 50 + Math.random() * 150;
      const cloudGeometry = new THREE.PlaneGeometry(cloudSize, cloudSize * 0.6);
      
      const cloudMaterial = new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3,
        depthWrite: false,
        color: 0xffffff
      });
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      
      const distance = 200 + Math.random() * 600;
      const angle = Math.random() * Math.PI * 2;
      
      cloud.position.set(
        Math.cos(angle) * distance,
        100 + Math.random() * 80,
        Math.sin(angle) * distance
      );
      
      cloud.rotation.z = Math.random() * Math.PI;
      cloud.lookAt(0, cloud.position.y, 0);
      
      scene.add(cloud);
      
      const speed = 0.01 + Math.random() * 0.02;
      const animate = () => {
        if (!isAnimatingRef.current) {
          cloud.position.x += speed;
          if (cloud.position.x > distance + 200) {
            cloud.position.x = -distance - 200;
          }
        }
        requestAnimationFrame(animate);
      };
      
      animate();
    }
  };

  const addEnhancedLandscape = (scene: THREE.Scene) => {
    addNaturalTreeDistribution(scene);
    
    addWaterFeature(scene);
    
    addRollingHills(scene);
    
    addGroundDetails(scene);
  };

  const addGroundDetails = (scene: THREE.Scene) => {
    const textureLoader = new THREE.TextureLoader();
    const rockTexture = textureLoader.load('https://assets.babylonjs.com/textures/rock.png');
    
    for (let i = 0; i < 50; i++) {
      const rockSize = 0.5 + Math.random() * 2;
      const rockGeometry = new THREE.SphereGeometry(rockSize, 6, 6);
      
      const vertices = rockGeometry.attributes.position.array;
      for (let j = 0; j < vertices.length; j += 3) {
        vertices[j] += (Math.random() - 0.5) * 0.3 * rockSize;
        vertices[j + 1] += (Math.random() - 0.5) * 0.3 * rockSize;
        vertices[j + 2] += (Math.random() - 0.5) * 0.3 * rockSize;
      }
      
      rockGeometry.computeVertexNormals();
      
      const rockMaterial = new THREE.MeshStandardMaterial({
        map: rockTexture,
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      const distance = 40 + Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      
      rock.position.set(
        Math.cos(angle) * distance,
        -0.5 + rockSize * 0.5,
        Math.sin(angle) * distance
      );
      
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }
  };

  const addNaturalTreeDistribution = (scene: THREE.Scene) => {
    const treePositions = [];
    const treeClusters = 5;
    const treesPerCluster = 8;
    
    for (let cluster = 0; cluster < treeClusters; cluster++) {
      const clusterRadius = 80 + Math.random() * 40;
      const clusterAngle = (cluster / treeClusters) * Math.PI * 2;
      const clusterX = Math.cos(clusterAngle) * clusterRadius;
      const clusterZ = Math.sin(clusterAngle) * clusterRadius;
      
      const actualTreesInCluster = Math.floor(treesPerCluster + (Math.random() * 5 - 2));
      
      for (let i = 0; i < actualTreesInCluster; i++) {
        const spread = 15 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        const x = clusterX + Math.cos(angle) * spread * Math.random();
        const z = clusterZ + Math.sin(angle) * spread * Math.random();
        treePositions.push({ x, z });
      }
    }
    
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * 100;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      treePositions.push({ x, z });
    }
    
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

  const createPineTree = (scene: THREE.Scene, x: number, z: number, height: number) => {
    const textureLoader = new THREE.TextureLoader();
    const barkTexture = textureLoader.load('https://assets.babylonjs.com/textures/bark.jpg');
    barkTexture.wrapS = THREE.RepeatWrapping;
    barkTexture.wrapT = THREE.RepeatWrapping;
    barkTexture.repeat.set(1, 2);
    
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      map: barkTexture,
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.1,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, height / 2 - 0.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    const foliageLayers = Math.floor(Math.random() * 2) + 3;
    const layerStep = height * 0.6 / foliageLayers;
    
    const colorVariance = Math.random() * 0.2;
    const baseColor = new THREE.Color(0.1, 0.5 - colorVariance, 0.1);
    
    for (let i = 0; i < foliageLayers; i++) {
      const layerSize = 3 - (i * (2.0 / foliageLayers));
      const layerHeight = 2.5 - (i * (1.0 / foliageLayers));
      
      const foliageGeometry = new THREE.ConeGeometry(layerSize, layerHeight, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ 
        color: baseColor,
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

  const createDeciduousTree = (scene: THREE.Scene, x: number, z: number, height: number) => {
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
    
    const foliageWidth = 2.5 + Math.random() * 2;
    const foliageHeight = 3 + Math.random() * 2;
    
    const foliageGeometry = new THREE.SphereGeometry(foliageWidth, 8, 8);
    foliageGeometry.scale(1, foliageHeight / foliageWidth, 1);
    
    const colorVariance = Math.random() * 0.1;
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

  const addWaterFeature = (scene: THREE.Scene) => {
    const pondRadius = 20;
    const pondGeometry = new THREE.CircleGeometry(pondRadius, 64);
    
    const waterVertexShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        float waveHeight = 0.05;
        float frequency = 10.0;
        pos.z = sin(pos.x * frequency + time) * waveHeight * sin(pos.y * frequency + time) * waveHeight;
        
        vPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
    
    const waterFragmentShader = `
      uniform float time;
      uniform vec3 waterColor;
      uniform vec3 waterHighlight;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        float ripple = sin(vUv.x * 30.0 + time) * sin(vUv.y * 30.0 + time) * 0.1;
        
        float reflection = pow(sin(vUv.y * 10.0 + ripple + time * 0.5) * 0.5 + 0.5, 3.0);
        
        vec3 color = mix(waterColor, waterHighlight, reflection);
        
        gl_FragColor = vec4(color, 0.85);
      }
    `;
    
    const waterUniforms = {
      time: { value: 0 },
      waterColor: { value: new THREE.Color(0x1E3F66) },
      waterHighlight: { value: new THREE.Color(0x4A90E2) }
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
    pond.position.set(-60, -0.2, 40);
    
    const addPondRocks = () => {
      const rockCount = 24;
      const textureLoader = new THREE.TextureLoader();
      const rockTexture = textureLoader.load('https://assets.babylonjs.com/textures/rock.png');
      
      for (let i = 0; i < rockCount; i++) {
        const angle = (i / rockCount) * Math.PI * 2;
        const radiusVariation = pondRadius + (Math.random() * 2 - 1);
        
        const rockSize = 0.8 + Math.random() * 1.2;
        const rockGeometry = new THREE.SphereGeometry(rockSize, 6, 6);
        
        const vertices = rockGeometry.attributes.position.array;
        for (let j = 0; j < vertices.length; j += 3) {
          vertices[j] += (Math.random() - 0.5) * 0.3 * rockSize;
          vertices[j + 1] += (Math.random() - 0.5) * 0.3 * rockSize;
          vertices[j + 2] += (Math.random() - 0.5) * 0.3 * rockSize;
        }
        
        rockGeometry.computeVertexNormals();
        
        const grayLevel = 0.6 + Math.random() * 0.3;
        const rockMaterial = new THREE.MeshStandardMaterial({
          map: rockTexture,
          color: new THREE.Color(grayLevel, grayLevel, grayLevel),
          roughness: 0.9,
          metalness: 0.1
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        rock.position.set(
          -60 + Math.cos(angle) * radiusVariation,
          -0.5 + rockSize * 0.3,
          40 + Math.sin(angle) * radiusVariation
        );
        
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
      }
    };
    
    addPondRocks();
    
    const animate = () => {
      if (!isAnimatingRef.current) {
        waterUniforms.time.value += 0.01;
      }
      requestAnimationFrame(animate);
    };
    
    animate();
  };

  const addRollingHills = (scene: THREE.Scene) => {
    const hillCount = 3;
    const hillColors = [0x4A7834, 0x3E6B29, 0x5D8C46];
    
    for (let i = 0; i < hillCount; i++) {
      const distance = 150 + i * 50;
      const width = 300 + i * 100;
      const height = 30 + i * 10;
      
      const hillGeometry = new THREE.PlaneGeometry(width, height, 32, 8);
      
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

  useEffect(() => {
    if (!sceneRef.current || !acres) return;

    const scene = sceneRef.current;
    
    const existingLand = scene.getObjectByName('land');
    if (existingLand) {
      scene.remove(existingLand);
    }

    const scale = 0.05;
    const landSize = Math.sqrt(acres) * 208.7 * scale;
    
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
    
    const vertices = landGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      if (i % 3 === 1 && Math.abs(vertices[i]) < 0.25) {
        vertices[i] += (Math.random() * 0.1) - 0.05;
      }
    }
    
    landGeometry.computeVertexNormals();
    
    const land = new THREE.Mesh(landGeometry, landMaterial);
    land.receiveShadow = true;
    land.name = 'land';
    land.position.y = -0.25;
    
    scene.add(land);

    updateCameraPosition(landSize);
  }, [acres, cameraAngle]);

  const updateCameraPosition = (landSize: number) => {
    if (!cameraRef.current) return;
    
    switch (cameraAngle) {
      case 'top':
        cameraRef.current.position.set(0, landSize * 2, 0.001);
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

  useEffect(() => {
    if (!sceneRef.current || !acres || cropAllocations.length === 0) return;

    const scene = sceneRef.current;
    
    const existingCrops = cropObjectsRef.current.filter(obj => obj.name.startsWith('crops-'));
    existingCrops.forEach(obj => scene.remove(obj));
    cropObjectsRef.current = [];

    const land = scene.getObjectByName('land') as THREE.Mesh;
    if (!land) return;

    const landSize = (land.geometry as THREE.BoxGeometry).parameters.width;

    let currentX = -landSize / 2;

    cropAllocations.forEach(allocation => {
      if (allocation.percentage <= 0) return;
      
      const sectionWidth = landSize * (allocation.percentage / 100);
      
      const plotGeometry = new THREE.BoxGeometry(sectionWidth, 0.05, landSize);
      
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
      
      const cropGroup = createEnhancedCropGroup(allocation.crop, sectionWidth, landSize);
      cropGroup.position.set(currentX + sectionWidth / 2, 0.2, 0);
      cropGroup.name = `crops-${allocation.crop}`;
      
      scene.add(cropGroup);
      cropObjectsRef.current.push(cropGroup);
      
      currentX += sectionWidth;
    });

    growCrops();
  }, [acres, cropAllocations]);

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
      case 'wheat': return randomize(new THREE.Color(0xF5DEB3));
      case 'corn': return randomize(new THREE.Color(0xFFD700));
      case 'soybean': return randomize(new THREE.Color(0x6B8E23));
      case 'cotton': return randomize(new THREE.Color(0xF5F5F5));
      default: return randomize(new THREE.Color(0x00FF00));
    }
  };

  const createEnhancedCropGroup = (cropType: string, width: number, depth: number): THREE.Group => {
    const group = new THREE.Group();
    
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
        
        const x = (col * spacing) - (width / 2) + (Math.random() * 0.8 - 0.4);
        const z = (row * spacing) - (depth / 2) + (Math.random() * 0.8 - 0.4);
        
        plantMesh.position.set(x, 0, z);
        plantMesh.rotation.y = Math.random() * Math.PI * 2;
        
        const baseScale = 0.8 + Math.random() * 0.4;
        plantMesh.scale.set(baseScale, 0, baseScale);
        
        const swaySpeed = 0.5 + Math.random() * 0.5;
        const swayAmount = 0.05 + Math.random() * 0.1;
        
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

  const createGenericPlant = (): THREE.Mesh => {
    const stemGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    return new THREE.Mesh(stemGeometry, stemMaterial);
  };

  const createAdvancedWheatPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.8, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xBDB76B,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.4;
    plant.add(stem);
    
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.8;
    
    const headCoreGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.3, 8);
    const headCoreMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 });
    const headCore = new THREE.Mesh(headCoreGeometry, headCoreMaterial);
    headCore.position.y = 0.15;
    headGroup.add(headCore);
    
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
    
    const stemGeometry = new THREE.CylinderGeometry(0.06, 0.08, 2, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x228B22,
      roughness: 0.7
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 1;
    plant.add(stem);
    
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
    
    for (let i = 0; i < 4; i++) {
      const angle = i * (Math.PI / 2);
      const height = 0.4 + i * 0.4;
      addLeaf(height, angle, 1.2, 0.3);
    }
    
    if (Math.random() > 0.3) {
      const earGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
      const earMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        roughness: 0.6
      });
      const ear = new THREE.Mesh(earGeometry, earMaterial);
      
      const earAngle = Math.random() * Math.PI * 2;
      ear.position.set(
        Math.cos(earAngle) * 0.2,
        1.2,
        Math.sin(earAngle) * 0.2
      );
      ear.rotation.z = Math.PI / 2;
      ear.rotation.y = earAngle;
      
      plant.add(ear);
    }
    
    return plant;
  };

  const createAdvancedSoybeanPlant = (): THREE.Object3D => {
    const plant = new THREE.Group();
    
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.6, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B7355,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.3;
    plant.add(stem);
    
    const branchCount = Math.floor(3 + Math.random() * 3);
    
    for (let i = 0; i < branchCount; i++) {
      const branchHeight = 0.1 + (i / branchCount) * 0.5;
      const branchAngle = (i / branchCount) * Math.PI * 2;
      const branchLength = 0.15 + Math.random() * 0.1;
      
      const branchGeometry = new THREE.CylinderGeometry(0.01, 0.01, branchLength, 4);
      const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      branch.position.y = branchHeight;
      branch.position.x = 0.02 * Math.cos(branchAngle);
      branch.position.z = 0.02 * Math.sin(branchAngle);
      
      branch.rotation.z = Math.PI / 2 - 0.3 - branchAngle;
      branch.rotation.y = branchAngle;
      
      plant.add(branch);
      
      const podCount = Math.floor(1 + Math.random() * 2);
      for (let j = 0; j < podCount; j++) {
        const podGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        podGeometry.scale(1, 2, 0.7);
        
        const podMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x6B8E23,
          roughness: 0.7
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
    
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.9, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xA0522D,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.45;
    plant.add(stem);
    
    const branchCount = Math.floor(3 + Math.random() * 3);
    
    for (let i = 0; i < branchCount; i++) {
      const branchHeight = 0.3 + (i / branchCount) * 0.6;
      const branchAngle = (i / branchCount) * Math.PI * 2;
      const branchLength = 0.25 + Math.random() * 0.1;
      
      const branchGeometry = new THREE.CylinderGeometry(0.015, 0.01, branchLength, 4);
      const branch = new THREE.Mesh(branchGeometry, stemMaterial);
      
      branch.position.y = branchHeight;
      branch.position.x = 0.03 * Math.cos(branchAngle);
      branch.position.z = 0.03 * Math.sin(branchAngle);
      
      branch.rotation.z = Math.PI / 2 - 0.3 - branchAngle;
      branch.rotation.y = branchAngle;
      
      plant.add(branch);
      
      if (Math.random() > 0.4) {
        const bollGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const bollMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xFFFFFF,
          roughness: 0.4,
          metalness: 0.1
        });
        
        const boll = new THREE.Mesh(bollGeometry, bollMaterial);
        
        const tipX = branch.position.x + Math.cos(branchAngle) * branchLength * 0.9;
        const tipZ = branch.position.z + Math.sin(branchAngle) * branchLength * 0.9;
        const tipY = branch.position.y + branchLength * 0.3;
        
        boll.position.set(tipX, tipY, tipZ);
        
        plant.add(boll);
      }
      
      const leafGeometry = new THREE.PlaneGeometry(0.15, 0.15, 2, 2);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x355E3B,
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

  const growCrops = () => {
    isAnimatingRef.current = true;
    
    const targetScale = 1;
    const growDuration = 2000;
    const startTime = Date.now();
    
    const cropGroups = cropObjectsRef.current.filter(obj => obj.name.startsWith('crops-'));
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / growDuration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
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
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border-2 border-primary/30 shadow-2xl bg-gradient-to-b from-sky-100/30 to-transparent dark:from-sky-900/10">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-4 animated-gradient-bg px-8 py-6 rounded-xl shadow-lg">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xl font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Loading 3D Farm Visualization...
            </p>
          </div>
        </div>
      )}
      
      <div className="absolute top-3 right-3 flex gap-2 z-10">
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
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-full threejs-container"
      />
    </div>
  );
};

export default FarmScene;
