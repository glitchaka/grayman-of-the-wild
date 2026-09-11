import * as T from 'three';

// Procedural Dungeon System with Rarity-coded Portals (Green, Blue, Electric Purple)
export function createDungeonSystem({ world, character, encounters, toast, isWalking, save }) {
  const DUNGEON_TYPES = {
    common: { name: 'Catacumba Musgosa', color: 0x22c55e, glowColor: 0x4ade80, rooms: 3, enemyTier: 1, boss: 'sprout_golem' },
    rare: { name: 'Cripta de Hielo Sombrío', color: 0x3b82f6, glowColor: 0x60a5fa, rooms: 4, enemyTier: 2, boss: 'frost_revenant' },
    epic: { name: 'Abismo del Rayo Ancestral', color: 0xa855f7, glowColor: 0xc084fc, rooms: 5, enemyTier: 3, boss: 'storm_colossus' }
  };

  const portalMeshes = [];
  let currentDungeon = null;
  let inDungeon = false;
  let dungeonGroup = new T.Group();
  dungeonGroup.name = 'Mazmorra_Instanciada';
  world.root.add(dungeonGroup);
  dungeonGroup.visible = false;

  // Portal positions in overworld
  const PORTAL_LOCATIONS = [
    { x: -76, z: 28, y: 2, rarity: 'common' },
    { x: 58, z: 12, y: 2, rarity: 'rare' },
    { x: 26, z: -68, y: 2, rarity: 'epic' },
    { x: 92, z: -58, y: .8, rarity: 'epic' } // Near tide chamber island
  ];

  function initPortals() {
    PORTAL_LOCATIONS.forEach((loc, idx) => {
      const def = DUNGEON_TYPES[loc.rarity];
      const portalGroup = new T.Group();
      portalGroup.position.set(loc.x, loc.y, loc.z);
      portalGroup.name = `Portal_${loc.rarity}_${idx}`;
      world.layers.Ruinas.add(portalGroup);

      // Stone gate frame
      const frameMat = new T.MeshToonMaterial({ color: 0x475569, gradientMap: world.gradient });
      const pillarGeo = new T.BoxGeometry(0.6, 3.2, 0.6);
      const leftPillar = new T.Mesh(pillarGeo, frameMat);
      leftPillar.position.set(-1.1, 1.6, 0);
      const rightPillar = new T.Mesh(pillarGeo, frameMat);
      rightPillar.position.set(1.1, 1.6, 0);
      const lintelGeo = new T.BoxGeometry(3, 0.6, 0.8);
      const lintel = new T.Mesh(lintelGeo, frameMat);
      lintel.position.set(0, 3.2, 0);
      portalGroup.add(leftPillar, rightPillar, lintel);

      // Swirling Vortex Gateway
      const vortexGeo = new T.PlaneGeometry(1.8, 2.8);
      const vortexMat = new T.MeshBasicMaterial({
        color: def.glowColor,
        transparent: true,
        opacity: 0.8,
        side: T.DoubleSide
      });
      const vortex = new T.Mesh(vortexGeo, vortexMat);
      vortex.position.set(0, 1.5, 0);
      portalGroup.add(vortex);

      // Light glow
      const pLight = new T.PointLight(def.glowColor, loc.rarity === 'epic' ? 3.5 : 2, 8);
      pLight.position.set(0, 1.7, 0.4);
      portalGroup.add(pLight);

      // Lightning arcs for Epic
      const electricBeams = [];
      if (loc.rarity === 'epic') {
        const lineMat = new T.LineBasicMaterial({ color: 0xe9d5ff });
        for (let i = 0; i < 4; i++) {
          const lineGeo = new T.BufferGeometry().setFromPoints([
            new T.Vector3(-0.9, 0.2 + i * 0.7, 0),
            new T.Vector3(0, 0.5 + i * 0.6, 0.2),
            new T.Vector3(0.9, 0.2 + i * 0.7, 0)
          ]);
          const line = new T.Line(lineGeo, lineMat);
          portalGroup.add(line);
          electricBeams.push(line);
        }
      }

      portalMeshes.push({
        id: `portal-${idx}`,
        loc,
        def,
        group: portalGroup,
        vortex,
        pLight,
        electricBeams,
        rarity: loc.rarity
      });
    });
  }

  initPortals();

  // Procedural Dungeon Generation
  function generateDungeon(def, companion = null) {
    // Clear previous
    while (dungeonGroup.children.length > 0) {
      dungeonGroup.remove(dungeonGroup.children[0]);
    }

    const rooms = [];
    const roomSize = 12;
    const startX = 200, startZ = 200, baseY = 0;

    const wallMat = new T.MeshToonMaterial({ color: 0x334155, gradientMap: world.gradient });
    const floorMat = new T.MeshToonMaterial({ color: def.color, gradientMap: world.gradient });
    const runeMat = new T.MeshBasicMaterial({ color: def.glowColor });

    for (let r = 0; r < def.rooms; r++) {
      const rx = startX + r * 16;
      const rz = startZ;
      const roomG = new T.Group();
      roomG.position.set(rx, baseY, rz);

      // Floor
      const floor = new T.Mesh(new T.BoxGeometry(roomSize, 0.4, roomSize), floorMat);
      floor.position.y = -0.2;
      roomG.add(floor);

      // North and South solid walls
      const wallNorth = new T.Mesh(new T.BoxGeometry(roomSize, 4, 0.6), wallMat);
      wallNorth.position.set(0, 2, -roomSize / 2);
      const wallSouth = new T.Mesh(new T.BoxGeometry(roomSize, 4, 0.6), wallMat);
      wallSouth.position.set(0, 2, roomSize / 2);
      roomG.add(wallNorth, wallSouth);

      // West wall (with doorway if connecting from previous room)
      if (r > 0) {
        const segW = (roomSize - 3.2) / 2;
        const wallWest1 = new T.Mesh(new T.BoxGeometry(0.6, 4, segW), wallMat);
        wallWest1.position.set(-roomSize / 2, 2, -roomSize / 4 - 0.8);
        const wallWest2 = new T.Mesh(new T.BoxGeometry(0.6, 4, segW), wallMat);
        wallWest2.position.set(-roomSize / 2, 2, roomSize / 4 + 0.8);
        const lintelW = new T.Mesh(new T.BoxGeometry(0.6, 1, 3.4), wallMat);
        lintelW.position.set(-roomSize / 2, 3.5, 0);
        roomG.add(wallWest1, wallWest2, lintelW);
      } else {
        const wallWest = new T.Mesh(new T.BoxGeometry(0.6, 4, roomSize), wallMat);
        wallWest.position.set(-roomSize / 2, 2, 0);
        roomG.add(wallWest);
      }

      // East wall (with doorway & corridor if connecting to next room)
      if (r < def.rooms - 1) {
        const segW = (roomSize - 3.2) / 2;
        const wallEast1 = new T.Mesh(new T.BoxGeometry(0.6, 4, segW), wallMat);
        wallEast1.position.set(roomSize / 2, 2, -roomSize / 4 - 0.8);
        const wallEast2 = new T.Mesh(new T.BoxGeometry(0.6, 4, segW), wallMat);
        wallEast2.position.set(roomSize / 2, 2, roomSize / 4 + 0.8);
        const lintelE = new T.Mesh(new T.BoxGeometry(0.6, 1, 3.4), wallMat);
        lintelE.position.set(roomSize / 2, 3.5, 0);
        roomG.add(wallEast1, wallEast2, lintelE);

        // Corridor to next chamber
        const corrFloor = new T.Mesh(new T.BoxGeometry(4.2, 0.4, 3.2), floorMat);
        corrFloor.position.set(roomSize / 2 + 2, -0.2, 0);
        const corrWallN = new T.Mesh(new T.BoxGeometry(4.2, 4, 0.6), wallMat);
        corrWallN.position.set(roomSize / 2 + 2, 2, -1.6);
        const corrWallS = new T.Mesh(new T.BoxGeometry(4.2, 4, 0.6), wallMat);
        corrWallS.position.set(roomSize / 2 + 2, 2, 1.6);
        roomG.add(corrFloor, corrWallN, corrWallS);
      } else {
        const wallEast = new T.Mesh(new T.BoxGeometry(0.6, 4, roomSize), wallMat);
        wallEast.position.set(roomSize / 2, 2, 0);
        roomG.add(wallEast);
      }

      // Torches / crystals on walls
      const crystal = new T.Mesh(new T.ConeGeometry(0.3, 1, 5), runeMat);
      crystal.position.set(0, 2.5, -roomSize / 2 + 0.4);
      const cLight = new T.PointLight(def.glowColor, 1.8, 8);
      cLight.position.set(0, 2.5, -roomSize / 2 + 0.8);
      roomG.add(crystal, cLight);

      // Centerpiece: Pedestal, traps or chest
      if (r === def.rooms - 1) {
        // Boss Room / Grand Treasure
        const bossPedestal = new T.Mesh(new T.CylinderGeometry(1.8, 2.2, 0.6, 8), wallMat);
        bossPedestal.position.set(0, 0.3, 0);
        roomG.add(bossPedestal);

        // Big Legendary Chest
        const chestMesh = new T.Mesh(new T.BoxGeometry(1.6, 1.1, 1.1), new T.MeshToonMaterial({ color: 0xd97706, gradientMap: world.gradient }));
        chestMesh.position.set(0, 0.9, 0);
        const chestGold = new T.Mesh(new T.BoxGeometry(1.7, 0.15, 1.2), new T.MeshBasicMaterial({ color: 0xfde047 }));
        chestGold.position.set(0, 1.45, 0);
        const chestLight = new T.PointLight(0xfde047, 2.5, 6);
        chestLight.position.set(0, 1.8, 0);
        roomG.add(chestMesh, chestGold, chestLight);
      } else {
        // Pillars in intermediate rooms
        for (const px of [-3, 3]) {
          for (const pz of [-3, 3]) {
            const pillar = new T.Mesh(new T.BoxGeometry(1, 4, 1), wallMat);
            pillar.position.set(px, 2, pz);
            roomG.add(pillar);
          }
        }
      }

      dungeonGroup.add(roomG);
      rooms.push({ x: rx, z: rz, roomG, cleared: false });
    }

    // Exit portal at start room
    const exitPortal = new T.Mesh(new T.TorusGeometry(1.2, 0.2, 8, 16), runeMat);
    exitPortal.position.set(startX - 4, baseY + 1.5, startZ);
    exitPortal.rotation.y = Math.PI / 2;
    dungeonGroup.add(exitPortal);

    return {
      def,
      startX,
      startZ,
      baseY,
      rooms,
      companion,
      currentRoom: 0,
      cleared: false
    };
  }

  function enterDungeon(portal, companion = null) {
    if (inDungeon) return;
    inDungeon = true;
    currentDungeon = generateDungeon(portal.def, companion);
    currentDungeon.portalRarity = portal.rarity;
    dungeonGroup.visible = true;

    // Save previous overworld position to return
    currentDungeon.returnPos = {
      x: character.position.x,
      y: character.position.y,
      z: character.position.z
    };

    // Teleport player into dungeon
    character.position.set(currentDungeon.startX, currentDungeon.baseY + 1, currentDungeon.startZ);

    toast(`Entrando a ${portal.def.name} [Rango ${portal.rarity.toUpperCase()}]`);

    if (companion) {
      toast(`¡Tu esposa ${companion.name} lucha a tu lado!`);
    }
  }

  function claimDungeonChest() {
    if (!currentDungeon || currentDungeon.cleared) return;
    currentDungeon.cleared = true;
    const rarity = currentDungeon.portalRarity || 'common';
    let coins = 15, ore = 6, crystals = 2, silk = 2, ectoplasm = 0, xp = 150;
    if (rarity === 'rare') {
      coins = 30; ore = 12; crystals = 5; silk = 4; ectoplasm = 2; xp = 280;
    } else if (rarity === 'epic') {
      coins = 65; ore = 20; crystals = 10; silk = 8; ectoplasm = 6; xp = 500;
    }
    window.dispatchEvent(new CustomEvent('dungeon:chest', { detail: { coins, ore, crystals, silk, ectoplasm, xp } }));
    toast(`¡Gran Cofre Legendario abierto! +${coins} 🪙 +${ore} mineral +${crystals} cristales +${xp} XP`);
    setTimeout(() => {
      exitDungeon(true);
    }, 1400);
  }

  function exitDungeon(completed = false) {
    if (!inDungeon || !currentDungeon) return;
    dungeonGroup.visible = false;
    inDungeon = false;

    // Teleport back to entrance
    const p = currentDungeon.returnPos || { x: 0, y: 2, z: 0 };
    character.position.set(p.x, p.y, p.z);

    if (completed) {
      toast('¡Mazmorra completada con éxito! Has regresado con el botín.');
    } else {
      toast('Has salido de la mazmorra.');
    }
    currentDungeon = null;
  }

  // Update dynamic effects (swirling vortices, electric arcs)
  function update(dt, time) {
    portalMeshes.forEach(p => {
      // Swirl vortex opacity & scale
      p.vortex.rotation.z = time * 0.8;
      const pulse = 0.8 + Math.sin(time * 3) * 0.15;
      p.vortex.scale.set(pulse, pulse, pulse);

      // Arc electricity
      if (p.electricBeams && p.electricBeams.length > 0) {
        p.electricBeams.forEach((beam, idx) => {
          beam.visible = Math.sin(time * 12 + idx) > -0.2;
          beam.rotation.z = Math.sin(time * 20 + idx * 2) * 0.15;
        });
      }
    });
  }

  function interaction(companion = null) {
    if (!isWalking()) return null;
    const px = character.position.x, pz = character.position.z;

    if (inDungeon && currentDungeon) {
      const exitDist = Math.hypot(px - (currentDungeon.startX - 4), pz - currentDungeon.startZ);
      if (exitDist < 2.8) {
        return {
          x: currentDungeon.startX - 4,
          z: currentDungeon.startZ,
          y: currentDungeon.baseY,
          label: 'Cruzar portal de salida de la mazmorra',
          fn: () => exitDungeon(false),
          dist: exitDist
        };
      }

      const lastRoomX = currentDungeon.startX + (currentDungeon.def.rooms - 1) * 16;
      const chestDist = Math.hypot(px - lastRoomX, pz - currentDungeon.startZ);
      if (chestDist < 3.2 && !currentDungeon.cleared) {
        return {
          x: lastRoomX,
          z: currentDungeon.startZ,
          y: currentDungeon.baseY,
          label: `Abrir Gran Cofre Legendario [${currentDungeon.def.name}]`,
          fn: () => claimDungeonChest(),
          dist: chestDist
        };
      }
      return null;
    }

    for (const p of portalMeshes) {
      const d = Math.hypot(px - p.loc.x, pz - p.loc.z);
      if (d < 3.2) {
        const rarityNames = { common: 'Común (Verde)', rare: 'Rara (Azul)', epic: 'Épica (Púrpura Eléctrico)' };
        return {
          x: p.loc.x,
          z: p.loc.z,
          y: p.loc.y,
          label: `Entrar a ${p.def.name} · ${rarityNames[p.rarity]}`,
          fn: () => enterDungeon(p, companion),
          dist: d
        };
      }
    }
    return null;
  }

  return {
    portalMeshes,
    enterDungeon,
    exitDungeon,
    update,
    interaction,
    isInDungeon: () => inDungeon,
    getCurrentDungeon: () => currentDungeon
  };
}
