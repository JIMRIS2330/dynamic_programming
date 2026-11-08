import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { KnapsackItem, DPSnapshot } from '../types/knapsack';
import { createProceduralBackpack, BackpackInstance } from './proceduralBackpack';
import { createProceduralItemMesh } from './proceduralItems';
import { createProceduralDPMatrix, DPMatrix3DInstance } from './proceduralDPMatrix';

export type CameraPreset = 'split' | 'backpack' | 'matrix' | 'topdown';

interface ItemAnimationState {
  item: KnapsackItem;
  meshGroup: THREE.Group;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  currentScale: THREE.Vector3;
  targetScale: THREE.Vector3;
  shelfPos: THREE.Vector3;
  isPacked: boolean;
  isHovered: boolean;
}

// Module-scope temporary vectors for zero GC in render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

export class KnapsackSceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private frameId: number = 0;
  private clock: THREE.Clock;

  // Scene Components
  private backpackInstance: BackpackInstance;
  private dpMatrixInstance: DPMatrix3DInstance | null = null;
  private itemStates: Map<string, ItemAnimationState> = new Map();
  private shelfGroup: THREE.Group;

  // Current problem configuration
  private items: KnapsackItem[] = [];
  private capacity: number = 7;

  // Camera transition state
  private cameraTargetPos = new THREE.Vector3(0, 7.5, 12);
  private cameraLookTarget = new THREE.Vector3(0, 1.2, 0);

  // Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  public onCellClicked?: (i: number, w: number) => void;
  public onItemClicked?: (item: KnapsackItem) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc);
    this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.025);

    // 4. Studio Environment map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 5. Camera & OrbitControls
    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 8.5, 14);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't go below ground
    this.controls.minDistance = 3;
    this.controls.maxDistance = 35;
    this.controls.target.set(0, 1.2, 0);

    // 6. Lighting Rig
    this.setupLighting();

    // 7. Ground Pedestal Platform
    this.setupGround();

    // 8. Hero Backpack
    this.backpackInstance = createProceduralBackpack();
    this.backpackInstance.group.position.set(-3.6, 0, 1.8);
    this.backpackInstance.group.rotation.y = 0.25;
    this.scene.add(this.backpackInstance.group);

    // 9. Items Shelf / Pedestal
    this.shelfGroup = new THREE.Group();
    this.shelfGroup.position.set(-3.6, 0, 4.4);
    this.scene.add(this.shelfGroup);

    // Event listeners
    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);

    // Start Animation Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private setupLighting() {
    // Warm Key Directional Light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(8, 16, 10);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool Sky / Ground Fill
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 0.9);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // Gentle Rim / Accent Light
    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    rimLight.position.set(-10, 10, -10);
    this.scene.add(rimLight);
  }

  private setupGround() {
    // Clean, satin circular ground disk with beveled edge
    const groundGeo = new THREE.CylinderGeometry(18, 18.2, 0.3, 64);
    groundGeo.translate(0, -0.15, 0);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.02,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle radial ring decal
    const ringGeo = new THREE.RingGeometry(8, 16, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.002;
    this.scene.add(ring);
  }

  public initProblem(items: KnapsackItem[], capacity: number) {
    this.items = items;
    this.capacity = capacity;

    // Clean up old items
    this.itemStates.forEach(state => {
      this.scene.remove(state.meshGroup);
    });
    this.itemStates.clear();

    // Clean up old shelf
    while (this.shelfGroup.children.length > 0) {
      this.shelfGroup.remove(this.shelfGroup.children[0]);
    }

    // Clean up old DP matrix
    if (this.dpMatrixInstance) {
      this.scene.remove(this.dpMatrixInstance.group);
      this.dpMatrixInstance.dispose();
      this.dpMatrixInstance = null;
    }

    // Build Shelf Geometry (Sleek curved display bar for items)
    const shelfWidth = Math.max(3.6, items.length * 1.15 + 0.6);
    const shelfGeo = new THREE.BoxGeometry(shelfWidth, 0.16, 1.4);
    shelfGeo.translate(0, 0.08, 0);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.5,
      metalness: 0.1,
    });
    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    shelfMesh.castShadow = true;
    shelfMesh.receiveShadow = true;
    this.shelfGroup.add(shelfMesh);

    // Shelf title badge
    const shelfLabelGeo = new THREE.BoxGeometry(shelfWidth, 0.04, 0.04);
    const shelfLabelMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const shelfLabel = new THREE.Mesh(shelfLabelGeo, shelfLabelMat);
    shelfLabel.position.set(0, 0.16, 0.7);
    this.shelfGroup.add(shelfLabel);

    // Spawn 3D Item Models
    const startX = -((items.length - 1) * 1.15) / 2;
    items.forEach((item, idx) => {
      const meshGroup = createProceduralItemMesh(item);
      const shelfPos = new THREE.Vector3(
        this.shelfGroup.position.x + startX + idx * 1.15,
        0.16,
        this.shelfGroup.position.z
      );

      meshGroup.position.copy(shelfPos);
      this.scene.add(meshGroup);

      this.itemStates.set(item.id, {
        item,
        meshGroup,
        currentPos: shelfPos.clone(),
        targetPos: shelfPos.clone(),
        currentScale: new THREE.Vector3(1, 1, 1),
        targetScale: new THREE.Vector3(1, 1, 1),
        shelfPos: shelfPos.clone(),
        isPacked: false,
        isHovered: false,
      });
    });

    // Spawn 3D DP Matrix
    this.dpMatrixInstance = createProceduralDPMatrix(items, capacity);
    // Position DP Matrix nicely to the right
    const matrixOffsetCol = Math.max(4.5, (capacity * 0.95) / 2 + 1.5);
    this.dpMatrixInstance.group.position.set(matrixOffsetCol, 0, 2.8);
    this.scene.add(this.dpMatrixInstance.group);

    // Initial capacity display
    this.backpackInstance.updateCapacity(0, capacity, 0);
  }

  public applySnapshot(snapshot: DPSnapshot) {
    if (!this.dpMatrixInstance) return;

    // 1. Update DP 3D Matrix Pedestals
    const activeCell: [number, number] | null =
      snapshot.action !== 'start' ? snapshot.comparisonCells.target : null;

    const skipCell = snapshot.comparisonCells.skipCell;
    const takeCell = snapshot.comparisonCells.takeCell;

    const optimalCells: [number, number][] | undefined =
      snapshot.action === 'optimal_solution'
        ? [[this.items.length, this.capacity]]
        : undefined;

    this.dpMatrixInstance.updateTable(
      snapshot.table,
      activeCell,
      skipCell,
      takeCell,
      optimalCells
    );

    // 2. Update Backpack Load Gauge
    const currentTotalVal = snapshot.chosenValue;
    this.backpackInstance.updateCapacity(
      snapshot.totalWeightPacked,
      this.capacity,
      currentTotalVal
    );

    // 3. Update Item Packing Positions
    const packedIds = new Set(snapshot.packedItemIds);
    let packedIndex = 0;

    this.itemStates.forEach(state => {
      const isPacked = packedIds.has(state.item.id);
      const isCurrentlyExamined = snapshot.currentItem?.id === state.item.id;
      state.isPacked = isPacked;

      if (isPacked) {
        // Nest inside backpack
        const localSlot = this.backpackInstance.getInteriorSlotPosition(
          packedIndex,
          snapshot.packedItemIds.length
        );
        const worldSlot = localSlot
          .clone()
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.backpackInstance.group.rotation.y)
          .add(this.backpackInstance.group.position);

        state.targetPos.copy(worldSlot);
        state.targetScale.set(0.72, 0.72, 0.72); // Scaled slightly to fit snugly
        packedIndex++;
      } else {
        // Rest on shelf
        state.targetPos.copy(state.shelfPos);
        state.targetScale.set(1, 1, 1);

        if (isCurrentlyExamined) {
          // Lift up gently into active spotlight
          state.targetPos.y = state.shelfPos.y + 0.45;
          state.targetScale.set(1.1, 1.1, 1.1);
        }
      }
    });
  }

  public setCameraPreset(preset: CameraPreset) {
    switch (preset) {
      case 'backpack':
        this.cameraTargetPos.set(-3.6, 3.8, 6.2);
        this.cameraLookTarget.set(-3.6, 1.2, 2.5);
        break;
      case 'matrix':
        if (this.dpMatrixInstance) {
          const mPos = this.dpMatrixInstance.group.position;
          this.cameraTargetPos.set(mPos.x, 8.5, mPos.z + 7.5);
          this.cameraLookTarget.set(mPos.x, 1.0, mPos.z);
        }
        break;
      case 'topdown':
        this.cameraTargetPos.set(0, 16, 2.8);
        this.cameraLookTarget.set(0, 0, 2.8);
        break;
      case 'split':
      default:
        this.cameraTargetPos.set(0, 8.2, 13.5);
        this.cameraLookTarget.set(0, 1.2, 2.5);
        break;
    }
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onPointerDown = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check DP Matrix Click
    if (this.dpMatrixInstance && this.onCellClicked) {
      const cellHit = this.dpMatrixInstance.getCellAtPoint(this.raycaster);
      if (cellHit) {
        this.onCellClicked(cellHit.i, cellHit.w);
        return;
      }
    }

    // Check Item Click
    if (this.onItemClicked) {
      for (const state of this.itemStates.values()) {
        const intersects = this.raycaster.intersectObjects(state.meshGroup.children, true);
        if (intersects.length > 0) {
          this.onItemClicked(state.item);
          return;
        }
      }
    }
  };

  private onPointerMove = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    let cursorPointer = false;

    if (this.dpMatrixInstance) {
      const cellHit = this.dpMatrixInstance.getCellAtPoint(this.raycaster);
      if (cellHit) cursorPointer = true;
    }

    for (const state of this.itemStates.values()) {
      const hits = this.raycaster.intersectObjects(state.meshGroup.children, true);
      if (hits.length > 0) cursorPointer = true;
    }

    this.renderer.domElement.style.cursor = cursorPointer ? 'pointer' : 'default';
  };

  private animate() {
    this.frameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Smooth camera damping toward target preset
    this.camera.position.lerp(this.cameraTargetPos, delta * 3.5);
    this.controls.target.lerp(this.cameraLookTarget, delta * 3.5);
    this.controls.update();

    // Smooth item packing animations
    this.itemStates.forEach(state => {
      // Position spring lerp
      state.currentPos.lerp(state.targetPos, delta * 6);
      state.meshGroup.position.copy(state.currentPos);

      // Scale lerp
      state.currentScale.lerp(state.targetScale, delta * 6);
      state.meshGroup.scale.copy(state.currentScale);

      // Gentle floating hover if examined
      if (state.meshGroup.position.y > state.shelfPos.y + 0.2 && !state.isPacked) {
        state.meshGroup.rotation.y += delta * 1.2;
      } else if (!state.isPacked) {
        state.meshGroup.rotation.y = THREE.MathUtils.damp(state.meshGroup.rotation.y, 0, 5, delta);
      }
    });

    // Update 3D DP Matrix column heights
    if (this.dpMatrixInstance) {
      this.dpMatrixInstance.updateAnimation(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);

    if (this.dpMatrixInstance) {
      this.dpMatrixInstance.dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
