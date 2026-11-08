import * as THREE from 'three';
import { KnapsackItem } from '../types/knapsack';

export interface CellMeshInfo {
  i: number;
  w: number;
  columnMesh: THREE.Mesh;
  topBadge: THREE.Sprite;
  targetHeight: number;
  currentHeight: number;
  baseY: number;
  x: number;
  z: number;
}

export interface DPMatrix3DInstance {
  group: THREE.Group;
  updateTable: (
    table: number[][],
    activeCell: [number, number] | null,
    skipCell?: [number, number],
    takeCell?: [number, number],
    optimalCells?: [number, number][]
  ) => void;
  updateAnimation: (delta: number) => void;
  getCellAtPoint: (raycaster: THREE.Raycaster) => { i: number; w: number } | null;
  dispose: () => void;
}

function createTextBadge(text: string, color: string = '#1e293b', bgColor: string = '#ffffff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.roundRect(2, 2, 124, 60, 12);
  ctx.fill();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 34);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createProceduralDPMatrix(
  items: KnapsackItem[],
  capacity: number
): DPMatrix3DInstance {
  const group = new THREE.Group();
  group.name = 'dp-3d-matrix';

  const rows = items.length + 1; // 0..N
  const cols = capacity + 1; // 0..W

  const cellSpacingX = 0.95;
  const cellSpacingZ = 0.95;
  const cellWidth = 0.75;
  const cellDepth = 0.75;
  const maxHeight = 3.2;

  // Find max potential value for height scaling
  const totalValue = items.reduce((acc, it) => acc + it.value, 0) || 100;

  // Grid Base Plate
  const totalGridW = cols * cellSpacingX + 0.6;
  const totalGridD = rows * cellSpacingZ + 0.8;
  const baseGeo = new THREE.BoxGeometry(totalGridW, 0.08, totalGridD);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.8,
    metalness: 0.05,
  });
  const basePlate = new THREE.Mesh(baseGeo, baseMat);
  basePlate.position.set(0, -0.04, 0);
  basePlate.receiveShadow = true;
  group.add(basePlate);

  // Soft grid line texture
  const gridHelper = new THREE.GridHelper(Math.max(totalGridW, totalGridD), Math.max(cols, rows), 0xe2e8f0, 0xf1f5f9);
  gridHelper.position.y = 0.01;
  group.add(gridHelper);

  // Active halo ring
  const ringGeo = new THREE.RingGeometry(0.42, 0.52, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const activeRing = new THREE.Mesh(ringGeo, ringMat);
  activeRing.position.y = 0.03;
  activeRing.visible = false;
  group.add(activeRing);

  // Connecting Bezier Arcs for (Skip) and (Take)
  const arcMatSkip = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 3 });
  const arcMatTake = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 });

  let arcSkipMesh: THREE.Line | null = null;
  let arcTakeMesh: THREE.Line | null = null;

  // Cell collections
  const cells: CellMeshInfo[] = [];

  // Reusable materials for pastel columns
  const cellDefaultMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const cellCalculatedMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd, // Pastel sky blue
    roughness: 0.25,
    metalness: 0.15,
    transparent: true,
    opacity: 0.92,
  });

  const cellActiveMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a, // Soft warm highlight
    roughness: 0.15,
    metalness: 0.2,
    emissive: 0xfef08a,
    emissiveIntensity: 0.25,
  });

  const cellOptimalMat = new THREE.MeshStandardMaterial({
    color: 0xa7f3d0, // Soft pastel mint emerald
    roughness: 0.2,
    metalness: 0.2,
    emissive: 0x34d399,
    emissiveIntensity: 0.3,
  });

  // Center offset
  const startX = -((cols - 1) * cellSpacingX) / 2;
  const startZ = -((rows - 1) * cellSpacingZ) / 2;

  // Create Header Labels (Columns: Capacity W)
  for (let c = 0; c <= capacity; c++) {
    const x = startX + c * cellSpacingX;
    const z = startZ - cellSpacingZ * 0.75;
    const colTex = createTextBadge(`w=${c}`, '#475569', '#ffffff');
    const colSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: colTex, transparent: true }));
    colSprite.scale.set(0.65, 0.32, 1);
    colSprite.position.set(x, 0.25, z);
    group.add(colSprite);
  }

  // Create Header Labels (Rows: Item index)
  for (let r = 0; r <= items.length; r++) {
    const x = startX - cellSpacingX * 0.85;
    const z = startZ + r * cellSpacingZ;
    const label = r === 0 ? 'Base i=0' : `i=${r} (${items[r - 1].name.slice(0, 7)}..)`;
    const rowTex = createTextBadge(label, '#334155', '#ffffff');
    const rowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: rowTex, transparent: true }));
    rowSprite.scale.set(0.9, 0.45, 1);
    rowSprite.position.set(x, 0.25, z);
    group.add(rowSprite);
  }

  // Build grid of cell pedestals
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * cellSpacingX;
      const z = startZ + r * cellSpacingZ;

      // Base unit box
      const geo = new THREE.BoxGeometry(cellWidth, 1, cellDepth);
      geo.translate(0, 0.5, 0); // Pivot at bottom

      const mesh = new THREE.Mesh(geo, cellDefaultMat.clone());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(x, 0.01, z);
      mesh.scale.set(1, 0.05, 1); // Start minimal
      mesh.userData = { i: r, w: c };
      group.add(mesh);

      // Value badge above cell
      const badgeTex = createTextBadge('-', '#94a3b8');
      const badgeMat = new THREE.SpriteMaterial({ map: badgeTex, transparent: true, depthWrite: false });
      const badge = new THREE.Sprite(badgeMat);
      badge.scale.set(0.55, 0.28, 1);
      badge.position.set(x, 0.3, z);
      group.add(badge);

      cells.push({
        i: r,
        w: c,
        columnMesh: mesh,
        topBadge: badge,
        targetHeight: 0.05,
        currentHeight: 0.05,
        baseY: 0.01,
        x,
        z,
      });
    }
  }

  // Helper to construct a 3D curved arc line
  const makeArc = (p1: THREE.Vector3, p2: THREE.Vector3, mat: THREE.Material): THREE.Line => {
    const mid = new THREE.Vector3()
      .addVectors(p1, p2)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, 1.2, 0));
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const points = curve.getPoints(24);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geo, mat);
  };

  const updateTable = (
    table: number[][],
    activeCell: [number, number] | null,
    skipCell?: [number, number],
    takeCell?: [number, number],
    optimalCells?: [number, number][]
  ) => {
    // Clear old arcs
    if (arcSkipMesh) {
      group.remove(arcSkipMesh);
      arcSkipMesh.geometry.dispose();
      arcSkipMesh = null;
    }
    if (arcTakeMesh) {
      group.remove(arcTakeMesh);
      arcTakeMesh.geometry.dispose();
      arcTakeMesh = null;
    }

    cells.forEach(cell => {
      const val = table[cell.i] ? table[cell.i][cell.w] : -1;
      const isCalculated = val !== -1;
      const isActive = activeCell && activeCell[0] === cell.i && activeCell[1] === cell.w;
      const isOptimal = optimalCells?.some(([oi, ow]) => oi === cell.i && ow === cell.w);

      if (isCalculated) {
        // Height proportional to value
        const norm = totalValue > 0 ? val / totalValue : 0;
        const targetH = Math.max(0.12, norm * maxHeight + 0.1);
        cell.targetHeight = targetH;

        // Color coding
        if (isActive) {
          cell.columnMesh.material = cellActiveMat;
        } else if (isOptimal) {
          cell.columnMesh.material = cellOptimalMat;
        } else {
          // Pastel gradient based on row
          const itemColor = cell.i > 0 ? items[cell.i - 1]?.color || '#bae6fd' : '#e2e8f0';
          (cell.columnMesh.material as THREE.MeshStandardMaterial).color.set(itemColor);
        }

        // Update badge text
        const badgeTex = createTextBadge(`${val}`, isActive ? '#0f172a' : '#1e293b', isActive ? '#fef08a' : '#ffffff');
        cell.topBadge.material.map = badgeTex;
      } else {
        cell.targetHeight = 0.05;
        cell.columnMesh.material = cellDefaultMat;
        const badgeTex = createTextBadge('-', '#94a3b8');
        cell.topBadge.material.map = badgeTex;
      }

      if (isActive) {
        activeRing.position.set(cell.x, cell.currentHeight + 0.05, cell.z);
        activeRing.visible = true;
      }
    });

    if (!activeCell) {
      activeRing.visible = false;
    }

    // Build arcs if skip/take are provided
    if (activeCell) {
      const targetCell = cells.find(c => c.i === activeCell[0] && c.w === activeCell[1]);
      if (targetCell) {
        const targetPos = new THREE.Vector3(targetCell.x, targetCell.currentHeight + 0.2, targetCell.z);

        if (skipCell) {
          const s = cells.find(c => c.i === skipCell[0] && c.w === skipCell[1]);
          if (s) {
            const sPos = new THREE.Vector3(s.x, s.currentHeight + 0.2, s.z);
            arcSkipMesh = makeArc(sPos, targetPos, arcMatSkip);
            group.add(arcSkipMesh);
          }
        }

        if (takeCell) {
          const t = cells.find(c => c.i === takeCell[0] && c.w === takeCell[1]);
          if (t) {
            const tPos = new THREE.Vector3(t.x, t.currentHeight + 0.2, t.z);
            arcTakeMesh = makeArc(tPos, targetPos, arcMatTake);
            group.add(arcTakeMesh);
          }
        }
      }
    }
  };

  const updateAnimation = (delta: number) => {
    cells.forEach(cell => {
      // Smooth damping interpolation toward target height
      const diff = cell.targetHeight - cell.currentHeight;
      if (Math.abs(diff) > 0.005) {
        cell.currentHeight += diff * Math.min(1, delta * 10);
        cell.columnMesh.scale.y = Math.max(0.04, cell.currentHeight);
        cell.topBadge.position.y = cell.currentHeight + 0.25;
      }
    });
  };

  const getCellAtPoint = (raycaster: THREE.Raycaster): { i: number; w: number } | null => {
    const meshes = cells.map(c => c.columnMesh);
    const intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData && typeof hit.userData.i === 'number') {
        return { i: hit.userData.i, w: hit.userData.w };
      }
    }
    return null;
  };

  const dispose = () => {
    baseGeo.dispose();
    baseMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
    cells.forEach(c => {
      c.columnMesh.geometry.dispose();
      c.topBadge.material.dispose();
    });
  };

  return {
    group,
    updateTable,
    updateAnimation,
    getCellAtPoint,
    dispose,
  };
}
