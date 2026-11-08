import * as THREE from 'three';

export interface BackpackInstance {
  group: THREE.Group;
  updateCapacity: (packedWeight: number, maxWeight: number, totalValue: number) => void;
  getInteriorSlotPosition: (index: number, total: number) => THREE.Vector3;
}

/**
 * Creates an elegant, composite 3D Knapsack with procedural canvas and leather materials
 */
export function createProceduralBackpack(): BackpackInstance {
  const group = new THREE.Group();
  group.name = 'hero-backpack';

  // Materials
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Light oatmeal / clean chalk
    roughness: 0.85,
    metalness: 0.05,
  });

  const canvasTrimMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Slate trim
    roughness: 0.7,
    metalness: 0.1,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Warm amber leather
    roughness: 0.45,
    metalness: 0.15,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.9,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.BackSide,
  });

  // 1. Main Compartment (Hollow container for packed items)
  // Outer hull
  const outerBodyGeo = new THREE.BoxGeometry(2.0, 1.8, 1.4);
  const outerBody = new THREE.Mesh(outerBodyGeo, canvasMat);
  outerBody.position.y = 0.9;
  outerBody.castShadow = true;
  group.add(outerBody);

  // Interior hollow cavity
  const innerCavityGeo = new THREE.BoxGeometry(1.82, 1.68, 1.22);
  const innerCavity = new THREE.Mesh(innerCavityGeo, interiorMat);
  innerCavity.position.set(0, 0.96, 0);
  group.add(innerCavity);

  // Top rim collar
  const rimGeo = new THREE.BoxGeometry(2.06, 0.1, 1.46);
  const rim = new THREE.Mesh(rimGeo, canvasTrimMat);
  rim.position.set(0, 1.8, 0);
  group.add(rim);

  // 2. Front Accessory Pouch Pocket
  const frontPocketGeo = new THREE.BoxGeometry(1.5, 0.9, 0.45);
  const frontPocket = new THREE.Mesh(frontPocketGeo, canvasMat);
  frontPocket.position.set(0, 0.65, 0.88);
  frontPocket.castShadow = true;
  group.add(frontPocket);

  // Zipper track on front pouch
  const zipTrackGeo = new THREE.BoxGeometry(1.3, 0.03, 0.02);
  const zipTrack = new THREE.Mesh(zipTrackGeo, metalMat);
  zipTrack.position.set(0, 1.0, 1.11);
  group.add(zipTrack);

  // 3. Top Flap with Buckles (tilted slightly back for open interior view)
  const flapGroup = new THREE.Group();
  flapGroup.position.set(0, 1.78, -0.6);
  flapGroup.rotation.x = -0.65; // open flap angle!

  const flapGeo = new THREE.BoxGeometry(1.9, 0.08, 1.1);
  flapGeo.translate(0, 0, 0.55);
  const flapMesh = new THREE.Mesh(flapGeo, canvasMat);
  flapGroup.add(flapMesh);

  // Flap Leather Straps & Buckles
  for (const x of [-0.6, 0.6]) {
    const strapGeo = new THREE.BoxGeometry(0.12, 0.1, 1.15);
    strapGeo.translate(0, 0.01, 0.55);
    const strap = new THREE.Mesh(strapGeo, leatherMat);
    flapGroup.add(strap);

    const buckleGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 16);
    buckleGeo.rotateX(Math.PI / 2);
    const buckle = new THREE.Mesh(buckleGeo, metalMat);
    buckle.position.set(x, 0.05, 1.08);
    flapGroup.add(buckle);
  }
  group.add(flapGroup);

  // 4. Side Mesh Pocket & Flask (Left)
  const leftMeshGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.8, 16, 1, true);
  const meshMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    wireframe: true,
  });
  const leftMesh = new THREE.Mesh(leftMeshGeo, meshMat);
  leftMesh.position.set(-1.12, 0.6, 0.1);
  group.add(leftMesh);

  // Pastel Water Flask inside left pocket
  const flaskGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.9, 20);
  const flaskMat = new THREE.MeshStandardMaterial({
    color: 0xa7f3d0, // Pastel mint
    roughness: 0.3,
    metalness: 0.2,
  });
  const flask = new THREE.Mesh(flaskGeo, flaskMat);
  flask.position.set(-1.12, 0.65, 0.1);
  group.add(flask);

  const flaskCapGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.12, 16);
  const flaskCap = new THREE.Mesh(flaskCapGeo, metalMat);
  flaskCap.position.set(-1.12, 1.15, 0.1);
  group.add(flaskCap);

  // 5. Right Cinch Compression Webbing (Right side)
  for (const y of [0.6, 1.2]) {
    const strapGeo = new THREE.BoxGeometry(0.04, 0.08, 1.2);
    const strap = new THREE.Mesh(strapGeo, leatherMat);
    strap.position.set(1.02, y, 0);
    group.add(strap);

    const clipGeo = new THREE.BoxGeometry(0.06, 0.12, 0.14);
    const clip = new THREE.Mesh(clipGeo, metalMat);
    clip.position.set(1.03, y, 0.1);
    group.add(clip);
  }

  // 6. Back Shoulder Straps
  for (const x of [-0.48, 0.48]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 1.7, -0.7),
      new THREE.Vector3(x * 1.2, 1.2, -1.05),
      new THREE.Vector3(x, 0.3, -0.75),
    ]);
    const strapTubeGeo = new THREE.TubeGeometry(curve, 20, 0.07, 12, false);
    const strapMesh = new THREE.Mesh(strapTubeGeo, canvasTrimMat);
    group.add(strapMesh);
  }

  // 7. Top Grab Handle Loop
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, 1.8, -0.2),
    new THREE.Vector3(0, 2.1, -0.2),
    new THREE.Vector3(0.35, 1.8, -0.2),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 16, 0.05, 12, false);
  const handleMesh = new THREE.Mesh(handleGeo, leatherMat);
  group.add(handleMesh);

  // 8. Reinforced Bottom Wear Patches
  const basePadGeo = new THREE.BoxGeometry(1.9, 0.06, 1.35);
  const basePad = new THREE.Mesh(basePadGeo, leatherMat);
  basePad.position.y = 0.03;
  group.add(basePad);

  // 9. Dynamic Gauge Badge Canvas on Front Pocket
  const gaugeCanvas = document.createElement('canvas');
  gaugeCanvas.width = 512;
  gaugeCanvas.height = 256;
  const gaugeCtx = gaugeCanvas.getContext('2d')!;

  const gaugeTex = new THREE.CanvasTexture(gaugeCanvas);
  gaugeTex.colorSpace = THREE.SRGBColorSpace;

  const gaugeMat = new THREE.MeshBasicMaterial({
    map: gaugeTex,
    transparent: true,
  });

  const gaugeGeo = new THREE.PlaneGeometry(1.2, 0.6);
  const gaugeMesh = new THREE.Mesh(gaugeGeo, gaugeMat);
  gaugeMesh.position.set(0, 0.6, 1.115);
  group.add(gaugeMesh);

  // 10. Soft Ground Contact Shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.32)');
  grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.1)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 256);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(3.6, 2.8);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.005;
  group.add(shadowMesh);

  // Render Gauge Function
  const updateCapacity = (packedWeight: number, maxWeight: number, totalVal: number) => {
    gaugeCtx.clearRect(0, 0, 512, 256);

    // Card background
    gaugeCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    gaugeCtx.roundRect(8, 8, 496, 240, 24);
    gaugeCtx.fill();

    gaugeCtx.strokeStyle = '#e2e8f0';
    gaugeCtx.lineWidth = 4;
    gaugeCtx.stroke();

    // Title
    gaugeCtx.fillStyle = '#64748b';
    gaugeCtx.font = 'bold 30px sans-serif';
    gaugeCtx.fillText('KNAPSACK LOAD', 36, 52);

    // Value Badge
    gaugeCtx.fillStyle = '#0f766e';
    gaugeCtx.font = 'bold 36px sans-serif';
    gaugeCtx.textAlign = 'right';
    gaugeCtx.fillText(`$${totalVal}`, 476, 56);
    gaugeCtx.textAlign = 'left';

    // Weight Numbers
    gaugeCtx.fillStyle = '#0f172a';
    gaugeCtx.font = '900 68px sans-serif';
    gaugeCtx.fillText(`${packedWeight}`, 36, 126);

    gaugeCtx.fillStyle = '#94a3b8';
    gaugeCtx.font = 'bold 36px sans-serif';
    gaugeCtx.fillText(`/ ${maxWeight} kg`, 150, 120);

    // Progress bar track
    gaugeCtx.fillStyle = '#e2e8f0';
    gaugeCtx.roundRect(36, 160, 440, 28, 14);
    gaugeCtx.fill();

    // Progress bar fill
    const pct = Math.min(1, maxWeight > 0 ? packedWeight / maxWeight : 0);
    const barColor = pct > 0.9 ? '#f59e0b' : '#3b82f6';
    gaugeCtx.fillStyle = barColor;
    if (pct > 0.03) {
      gaugeCtx.roundRect(36, 160, 440 * pct, 28, 14);
      gaugeCtx.fill();
    }

    // Pct text
    gaugeCtx.fillStyle = '#475569';
    gaugeCtx.font = 'bold 26px sans-serif';
    gaugeCtx.fillText(`${Math.round(pct * 100)}% capacity utilized`, 36, 222);

    gaugeTex.needsUpdate = true;
  };

  // Initial draw
  updateCapacity(0, 10, 0);

  // Position slots for items nestled inside the knapsack
  const getInteriorSlotPosition = (index: number, total: number): THREE.Vector3 => {
    // Distribute nicely inside knapsack cavity (x: -0.6 to +0.6, z: -0.3 to +0.3)
    if (total <= 1) {
      return new THREE.Vector3(0, 0.4, 0);
    }
    const cols = Math.min(total, 3);
    const col = index % cols;
    const row = Math.floor(index / cols);

    const x = -0.5 + (cols > 1 ? (col / (cols - 1)) * 1.0 : 0);
    const z = -0.2 + row * 0.4;
    const y = 0.35 + (index % 2) * 0.15;
    return new THREE.Vector3(x, y, z);
  };

  return {
    group,
    updateCapacity,
    getInteriorSlotPosition,
  };
}
