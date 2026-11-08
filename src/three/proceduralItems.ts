import * as THREE from 'three';
import { KnapsackItem } from '../types/knapsack';

// Create procedural Canvas texture for item label badge
function createItemLabelTexture(text: string, subText: string, bgColor: string, textColor: string = '#1e293b'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Smooth background
  ctx.fillStyle = bgColor;
  ctx.roundRect(4, 4, 248, 120, 20);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 50);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 24px sans-serif';
  ctx.fillText(subText, 128, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural 3-7 part item generator
 */
export function createProceduralItemMesh(item: KnapsackItem): THREE.Group {
  const group = new THREE.Group();
  group.name = `item-${item.id}`;

  const baseColor = new THREE.Color(item.color);
  const accentColor = new THREE.Color(item.accentColor);

  const primaryMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.35,
    metalness: 0.1,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.25,
    metalness: 0.4,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.15,
    metalness: 0.85,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
    metalness: 0.1,
  });

  switch (item.iconType) {
    case 'camera': {
      // 1. Camera Main Body
      const bodyGeo = new THREE.BoxGeometry(0.7, 0.45, 0.35);
      const body = new THREE.Mesh(bodyGeo, primaryMat);
      body.castShadow = true;
      body.position.y = 0.225;
      group.add(body);

      // 2. Camera Grip
      const gripGeo = new THREE.BoxGeometry(0.18, 0.4, 0.12);
      const grip = new THREE.Mesh(gripGeo, accentMat);
      grip.position.set(0.24, 0.225, 0.18);
      group.add(grip);

      // 3. Lens Cylinder Barrel
      const lensBarrelGeo = new THREE.CylinderGeometry(0.16, 0.17, 0.22, 24);
      lensBarrelGeo.rotateX(Math.PI / 2);
      const lensBarrel = new THREE.Mesh(lensBarrelGeo, darkMat);
      lensBarrel.position.set(-0.08, 0.22, 0.26);
      group.add(lensBarrel);

      // 4. Lens Front Glass Ring
      const lensGlassGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 24);
      lensGlassGeo.rotateX(Math.PI / 2);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transmission: 0.8,
        opacity: 1,
        transparent: true,
        roughness: 0.1,
        ior: 1.5,
      });
      const lensGlass = new THREE.Mesh(lensGlassGeo, glassMat);
      lensGlass.position.set(-0.08, 0.22, 0.38);
      group.add(lensGlass);

      // 5. Shutter Button
      const shutterGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16);
      const shutter = new THREE.Mesh(shutterGeo, metalMat);
      shutter.position.set(0.24, 0.48, 0.05);
      group.add(shutter);

      // 6. Flash / Viewfinder block
      const flashGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
      const flash = new THREE.Mesh(flashGeo, metalMat);
      flash.position.set(-0.08, 0.48, 0);
      group.add(flash);
      break;
    }

    case 'gem': {
      // 1. Faceted Gemstone (Icosahedron)
      const gemGeo = new THREE.IcosahedronGeometry(0.32, 0);
      const gemMat = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.65,
        transparent: true,
        ior: 2.1,
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.y = 0.38;
      gem.castShadow = true;
      group.add(gem);

      // 2. Golden / Silver Pedestal Prongs
      const baseGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.1, 16);
      const baseMesh = new THREE.Mesh(baseGeo, accentMat);
      baseMesh.position.y = 0.05;
      group.add(baseMesh);

      // 3. Prong claws (4 prongs)
      for (let p = 0; p < 4; p++) {
        const angle = (p * Math.PI) / 2;
        const prongGeo = new THREE.BoxGeometry(0.04, 0.26, 0.04);
        const prong = new THREE.Mesh(prongGeo, accentMat);
        prong.position.set(Math.cos(angle) * 0.2, 0.2, Math.sin(angle) * 0.2);
        prong.rotation.z = -Math.cos(angle) * 0.2;
        prong.rotation.x = Math.sin(angle) * 0.2;
        group.add(prong);
      }

      // 4. Subtle glowing core
      const coreGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 0.38;
      group.add(core);
      break;
    }

    case 'laptop': {
      // 1. Laptop Base
      const baseGeo = new THREE.BoxGeometry(0.65, 0.04, 0.5);
      const baseMesh = new THREE.Mesh(baseGeo, metalMat);
      baseMesh.position.y = 0.02;
      group.add(baseMesh);

      // 2. Keyboard recess / plate
      const kbGeo = new THREE.BoxGeometry(0.55, 0.01, 0.24);
      const kb = new THREE.Mesh(kbGeo, darkMat);
      kb.position.set(0, 0.045, -0.06);
      group.add(kb);

      // 3. Trackpad
      const tpGeo = new THREE.BoxGeometry(0.2, 0.01, 0.12);
      const tp = new THREE.Mesh(tpGeo, primaryMat);
      tp.position.set(0, 0.045, 0.14);
      group.add(tp);

      // 4. Tilted Display Screen Lid
      const lidGroup = new THREE.Group();
      lidGroup.position.set(0, 0.04, -0.24);

      const lidGeo = new THREE.BoxGeometry(0.65, 0.44, 0.03);
      lidGeo.translate(0, 0.22, 0);
      const lid = new THREE.Mesh(lidGeo, metalMat);
      lidGroup.add(lid);

      // Screen Glass
      const screenGeo = new THREE.PlaneGeometry(0.58, 0.38);
      screenGeo.translate(0, 0.22, 0.018);
      const screenMat = new THREE.MeshBasicMaterial({ color: baseColor });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      lidGroup.add(screen);

      lidGroup.rotation.x = -0.3; // Tilted back nicely
      group.add(lidGroup);
      break;
    }

    case 'trophy': {
      // 1. Marble Stepped Base
      const base1Geo = new THREE.BoxGeometry(0.38, 0.08, 0.38);
      const base1 = new THREE.Mesh(base1Geo, darkMat);
      base1.position.y = 0.04;
      group.add(base1);

      const base2Geo = new THREE.BoxGeometry(0.3, 0.06, 0.3);
      const base2 = new THREE.Mesh(base2Geo, darkMat);
      base2.position.y = 0.11;
      group.add(base2);

      // 2. Golden Stem
      const stemGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.16, 16);
      const stem = new THREE.Mesh(stemGeo, accentMat);
      stem.position.y = 0.22;
      group.add(stem);

      // 3. Chalice Cup
      const cupGeo = new THREE.CylinderGeometry(0.24, 0.08, 0.32, 24, 1, true);
      const cupMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.2,
        metalness: 0.8,
        side: THREE.DoubleSide,
      });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.y = 0.44;
      group.add(cup);

      // 4. Cup Handles (Left & Right Torus arcs)
      for (let side = -1; side <= 1; side += 2) {
        const handleGeo = new THREE.TorusGeometry(0.12, 0.025, 12, 24, Math.PI);
        const handle = new THREE.Mesh(handleGeo, accentMat);
        handle.position.set(side * 0.22, 0.46, 0);
        handle.rotation.z = side * (Math.PI / 2);
        group.add(handle);
      }
      break;
    }

    case 'potion': {
      // 1. Spherical Glass Flask
      const flaskGeo = new THREE.SphereGeometry(0.26, 24, 24);
      const flaskMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.88,
        transparent: true,
        roughness: 0.1,
        ior: 1.45,
      });
      const flask = new THREE.Mesh(flaskGeo, flaskMat);
      flask.position.y = 0.28;
      group.add(flask);

      // 2. Colorful liquid inside
      const liquidGeo = new THREE.SphereGeometry(0.23, 20, 20);
      const liquidMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.2,
        metalness: 0.1,
      });
      const liquid = new THREE.Mesh(liquidGeo, liquidMat);
      liquid.position.y = 0.26;
      group.add(liquid);

      // 3. Glass Neck
      const neckGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 16);
      const neck = new THREE.Mesh(neckGeo, flaskMat);
      neck.position.y = 0.55;
      group.add(neck);

      // 4. Cork Stopper
      const corkGeo = new THREE.CylinderGeometry(0.085, 0.07, 0.1, 16);
      const corkMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
      const cork = new THREE.Mesh(corkGeo, corkMat);
      cork.position.y = 0.66;
      group.add(cork);
      break;
    }

    case 'book': {
      // 1. Book Pages Block
      const pagesGeo = new THREE.BoxGeometry(0.44, 0.14, 0.56);
      const pagesMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
      const pages = new THREE.Mesh(pagesGeo, pagesMat);
      pages.position.set(0.02, 0.08, 0);
      group.add(pages);

      // 2. Leather Hardcover
      const coverGeo = new THREE.BoxGeometry(0.48, 0.16, 0.6);
      const coverMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.5 });
      const cover = new THREE.Mesh(coverGeo, coverMat);
      cover.position.set(0, 0.08, 0);
      group.add(cover);

      // 3. Spine Ribs
      for (let r = -0.18; r <= 0.18; r += 0.12) {
        const ribGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.17, 8);
        const rib = new THREE.Mesh(ribGeo, accentMat);
        rib.position.set(-0.24, 0.08, r);
        group.add(rib);
      }

      // 4. Gold Bookmark Ribbon
      const ribbonGeo = new THREE.BoxGeometry(0.06, 0.01, 0.28);
      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4 });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set(0.05, 0.165, 0.32);
      ribbon.rotation.x = 0.2;
      group.add(ribbon);
      break;
    }

    case 'compass': {
      // 1. Brass Outer Rim
      const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 32);
      const rim = new THREE.Mesh(rimGeo, accentMat);
      rim.position.y = 0.04;
      group.add(rim);

      // 2. Compass Face Dial
      const faceGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.01, 32);
      const faceMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.y = 0.075;
      group.add(face);

      // 3. Needle (Red & Blue cones)
      const needleNGeo = new THREE.ConeGeometry(0.04, 0.18, 8);
      needleNGeo.rotateZ(Math.PI / 2);
      const needleNMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const needleN = new THREE.Mesh(needleNGeo, needleNMat);
      needleN.position.set(0.08, 0.09, 0);
      group.add(needleN);

      const needleSGeo = new THREE.ConeGeometry(0.04, 0.18, 8);
      needleSGeo.rotateZ(-Math.PI / 2);
      const needleSMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
      const needleS = new THREE.Mesh(needleSGeo, needleSMat);
      needleS.position.set(-0.08, 0.09, 0);
      group.add(needleS);

      // 4. Top Glass Cover
      const glassGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.02, 32);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.85,
        transparent: true,
        roughness: 0.05,
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.y = 0.09;
      group.add(glass);
      break;
    }

    case 'watch':
    default: {
      // 1. Watch Body Case
      const caseGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.07, 32);
      const watchCase = new THREE.Mesh(caseGeo, metalMat);
      watchCase.position.y = 0.04;
      group.add(watchCase);

      // 2. Watch Face
      const faceGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.01, 32);
      const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.y = 0.075;
      group.add(face);

      // 3. Watch Hands
      const handGeo = new THREE.BoxGeometry(0.02, 0.01, 0.14);
      const hand = new THREE.Mesh(handGeo, darkMat);
      hand.position.set(0, 0.085, 0.04);
      group.add(hand);

      // 4. Crown Winder Knob
      const crownGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12);
      crownGeo.rotateZ(Math.PI / 2);
      const crown = new THREE.Mesh(crownGeo, metalMat);
      crown.position.set(0.26, 0.04, 0);
      group.add(crown);

      // 5. Dual Straps (Top & Bottom)
      for (let s = -1; s <= 1; s += 2) {
        const strapGeo = new THREE.BoxGeometry(0.18, 0.025, 0.24);
        const strap = new THREE.Mesh(strapGeo, primaryMat);
        strap.position.set(0, 0.02, s * 0.32);
        group.add(strap);
      }
      break;
    }
  }

  // Floating Label Badge above item
  const labelTex = createItemLabelTexture(item.name, `${item.weight}kg · $${item.value}`, item.color);
  const badgeMat = new THREE.SpriteMaterial({
    map: labelTex,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(badgeMat);
  sprite.scale.set(0.9, 0.45, 1);
  sprite.position.y = 0.95;
  sprite.name = 'item-badge';
  group.add(sprite);

  // Soft contact shadow circle below item
  const shadowGeo = new THREE.PlaneGeometry(0.8, 0.8);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, 'rgba(30, 41, 59, 0.22)');
  grad.addColorStop(1, 'rgba(30, 41, 59, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = 0.005;
  group.add(shadow);

  return group;
}
