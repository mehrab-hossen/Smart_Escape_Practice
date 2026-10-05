/**
 * Smart Escape - Tactical Evacuation Simulator & Interactive Game
 * Features:
 * - Dijkstra Optimal Pathfinding with strict tie-breaking
 * - Real-Time Evacuation Simulation Runner with Survivor Avatar
 * - Audio Synthesizer (Native Web Audio API, Zero Dependencies)
 * - Emergency Crisis Scenario Presets
 * - High-Tech Tactical SVG Blueprint Map with HUD
 * - Full Bilingual Support (EN / বাংলা)
 */

// Embedded default dataset fallback (identical to building.json)
const DEFAULT_BUILDING_DATA = {
  "building": "East Annex - Practice Building",
  "nodes": [
    { "id": "R1", "label": "Room 101", "type": "room", "x": 60, "y": 65 },
    { "id": "R2", "label": "Room 102", "type": "room", "x": 60, "y": 185 },
    { "id": "C1", "label": "Junction A", "type": "junction", "x": 190, "y": 65 },
    { "id": "C2", "label": "Junction B", "type": "junction", "x": 325, "y": 65 },
    { "id": "C3", "label": "Junction C", "type": "junction", "x": 190, "y": 185 },
    { "id": "C4", "label": "Junction D", "type": "junction", "x": 325, "y": 185 },
    { "id": "E1", "label": "North Exit", "type": "exit", "x": 445, "y": 65 },
    { "id": "E2", "label": "South Exit", "type": "exit", "x": 445, "y": 185 }
  ],
  "edges": [
    { "id": "L01", "from": "R1", "to": "C1", "cost": 2 },
    { "id": "L02", "from": "C1", "to": "C2", "cost": 3 },
    { "id": "L03", "from": "C2", "to": "E1", "cost": 2 },
    { "id": "L04", "from": "R1", "to": "R2", "cost": 4 },
    { "id": "L05", "from": "R2", "to": "C3", "cost": 2 },
    { "id": "L06", "from": "C3", "to": "C4", "cost": 3 },
    { "id": "L07", "from": "C4", "to": "E2", "cost": 2 },
    { "id": "L08", "from": "C1", "to": "C3", "cost": 4 },
    { "id": "L09", "from": "C2", "to": "C4", "cost": 3 }
  ],
  "initial_state": {
    "blocked_nodes": [],
    "blocked_edges": [],
    "closed_exits": []
  }
};

// Global App State
const AppState = {
  dataset: null,
  startNodeId: null,
  blockedNodes: new Set(),
  blockedEdges: new Set(),
  closedExits: new Set(),
  interactionMode: 'start', // 'start' | 'hazard'
  activeSidebarTab: 'route', // 'route' | 'hazards' | 'scenarios'
  activeHazardFilter: 'all',  // 'all' | 'nodes' | 'exits' | 'edges'
  activeRoute: null,
  soundEnabled: true,
  
  // Evacuation Simulation Runner State
  simulation: {
    isRunning: false,
    isPaused: false,
    currentIndex: 0,
    speed: 1, // 1x, 2x, 4x
    elapsedCost: 0,
    timerId: null,
    runnerPos: null // { x, y }
  },

  // Map Pan/Zoom
  zoomTransform: { scale: 1, x: 0, y: 0 },
  isPanning: false,
  panStart: { x: 0, y: 0 }
};

// ==========================================
// 1. NATIVE WEB AUDIO SYNTHESIZER
// ==========================================
class SoundFX {
  static ctx = null;

  static init() {
    if (!SoundFX.ctx && (window.AudioContext || window.webkitAudioContext)) {
      SoundFX.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  static playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (!AppState.soundEnabled) return;
    try {
      SoundFX.init();
      if (!SoundFX.ctx) return;
      if (SoundFX.ctx.state === 'suspended') SoundFX.ctx.resume();

      const osc = SoundFX.ctx.createOscillator();
      const gain = SoundFX.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, SoundFX.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, SoundFX.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, SoundFX.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(SoundFX.ctx.destination);

      osc.start();
      osc.stop(SoundFX.ctx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked by browser policy before first gesture
    }
  }

  static blip() {
    SoundFX.playTone(660, 'sine', 0.08, 0.08);
  }

  static selectStart() {
    SoundFX.playTone(520, 'sine', 0.1, 0.12);
    setTimeout(() => SoundFX.playTone(780, 'sine', 0.15, 0.12), 60);
  }

  static hazardToggle(isBlocked) {
    if (isBlocked) {
      SoundFX.playTone(220, 'sawtooth', 0.2, 0.1);
    } else {
      SoundFX.playTone(440, 'triangle', 0.12, 0.08);
      setTimeout(() => SoundFX.playTone(660, 'sine', 0.15, 0.08), 50);
    }
  }

  static routeFound() {
    SoundFX.playTone(440, 'sine', 0.08, 0.06);
    setTimeout(() => SoundFX.playTone(587.33, 'sine', 0.08, 0.06), 70);
    setTimeout(() => SoundFX.playTone(880, 'sine', 0.18, 0.08), 140);
  }

  static alertAlarm() {
    SoundFX.playTone(330, 'sawtooth', 0.18, 0.15);
    setTimeout(() => SoundFX.playTone(290, 'sawtooth', 0.25, 0.15), 120);
  }

  static stepMove() {
    SoundFX.playTone(580, 'sine', 0.06, 0.05);
  }

  static victoryFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      setTimeout(() => SoundFX.playTone(f, 'triangle', 0.35, 0.12), i * 110);
    });
  }
}

// ==========================================
// 2. DATA VALIDATION
// ==========================================
function validateBuildingData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: getTranslation('errInvalidJSON') };
  }

  if (typeof data.building !== 'string' || !data.building.trim()) {
    return { valid: false, error: getTranslation('errMissingBuilding') };
  }

  if (!Array.isArray(data.nodes) || data.nodes.length < 2 || data.nodes.length > 60) {
    return { valid: false, error: getTranslation('errInvalidNodes') };
  }

  const nodeMap = new Map();
  let hasExit = false;

  for (let i = 0; i < data.nodes.length; i++) {
    const n = data.nodes[i];
    if (!n || typeof n !== 'object') {
      return { valid: false, error: getTranslation('errInvalidNodeItem', { index: i + 1 }) };
    }

    const { id, label, type, x, y } = n;
    if (typeof id !== 'string' || !id.trim() ||
        typeof label !== 'string' || !label.trim() ||
        !['room', 'junction', 'exit'].includes(type) ||
        typeof x !== 'number' || !Number.isFinite(x) ||
        typeof y !== 'number' || !Number.isFinite(y)) {
      return { valid: false, error: getTranslation('errInvalidNodeItem', { index: i + 1 }) };
    }

    if (nodeMap.has(id)) {
      return { valid: false, error: getTranslation('errDuplicateNodeId', { id }) };
    }

    nodeMap.set(id, n);
    if (type === 'exit') hasExit = true;
  }

  if (!hasExit) {
    return { valid: false, error: getTranslation('errNoExitNode') };
  }

  if (!Array.isArray(data.edges) || data.edges.length < 1 || data.edges.length > 150) {
    return { valid: false, error: getTranslation('errInvalidEdges') };
  }

  const edgeMap = new Map();
  for (let i = 0; i < data.edges.length; i++) {
    const e = data.edges[i];
    if (!e || typeof e !== 'object') {
      return { valid: false, error: getTranslation('errInvalidEdgeItem', { index: i + 1 }) };
    }

    const { id, from, to, cost } = e;
    if (typeof id !== 'string' || !id.trim() ||
        typeof from !== 'string' || typeof to !== 'string' ||
        !Number.isInteger(cost) || cost <= 0) {
      return { valid: false, error: getTranslation('errInvalidEdgeItem', { index: i + 1 }) };
    }

    if (edgeMap.has(id)) {
      return { valid: false, error: getTranslation('errDuplicateEdgeId', { id }) };
    }

    if (!nodeMap.has(from)) {
      return { valid: false, error: getTranslation('errEdgeUnknownNode', { id, node: from }) };
    }

    if (!nodeMap.has(to)) {
      return { valid: false, error: getTranslation('errEdgeUnknownNode', { id, node: to }) };
    }

    if (from === to) {
      return { valid: false, error: getTranslation('errSelfLoop', { id, from }) };
    }

    edgeMap.set(id, e);
  }

  if (data.initial_state) {
    const { blocked_nodes, blocked_edges, closed_exits } = data.initial_state;
    if (blocked_nodes && !Array.isArray(blocked_nodes)) {
      return { valid: false, error: getTranslation('errInvalidInitialState') };
    }
    if (blocked_edges && !Array.isArray(blocked_edges)) {
      return { valid: false, error: getTranslation('errInvalidInitialState') };
    }
    if (closed_exits && !Array.isArray(closed_exits)) {
      return { valid: false, error: getTranslation('errInvalidInitialState') };
    }

    if (blocked_nodes) {
      for (const nid of blocked_nodes) {
        if (!nodeMap.has(nid)) {
          return { valid: false, error: getTranslation('errUnknownBlockedNode', { id: nid }) };
        }
      }
    }

    if (blocked_edges) {
      for (const eid of blocked_edges) {
        if (!edgeMap.has(eid)) {
          return { valid: false, error: getTranslation('errUnknownBlockedEdge', { id: eid }) };
        }
      }
    }

    if (closed_exits) {
      for (const eid of closed_exits) {
        const node = nodeMap.get(eid);
        if (!node || node.type !== 'exit') {
          return { valid: false, error: getTranslation('errUnknownClosedExit', { id: eid }) };
        }
      }
    }
  }

  return { valid: true };
}

// ==========================================
// 3. DIJKSTRA ROUTE FINDER WITH TIE-BREAKING
// ==========================================
function compareNodePaths(pathA, pathB) {
  if (!pathA && !pathB) return 0;
  if (!pathA) return 1;
  if (!pathB) return -1;
  const len = Math.min(pathA.length, pathB.length);
  for (let i = 0; i < len; i++) {
    const cmp = pathA[i].localeCompare(pathB[i]);
    if (cmp !== 0) return cmp;
  }
  return pathA.length - pathB.length;
}

function findOptimalRoute(dataset, startId, blockedNodes, blockedEdges, closedExits) {
  if (!startId) {
    return { status: 'NO_START', path: null, cost: 0, exitId: null, edgeIds: [] };
  }

  if (blockedNodes.has(startId)) {
    return { status: 'START_BLOCKED', path: null, cost: 0, exitId: null, edgeIds: [] };
  }

  const { nodes, edges } = dataset;

  const openExits = new Set();
  for (const n of nodes) {
    if (n.type === 'exit' && !closedExits.has(n.id) && !blockedNodes.has(n.id)) {
      openExits.add(n.id);
    }
  }

  if (openExits.size === 0) {
    return { status: 'NO_ROUTE', path: null, cost: 0, exitId: null, edgeIds: [] };
  }

  const adj = new Map();
  for (const n of nodes) {
    adj.set(n.id, []);
  }

  for (const edge of edges) {
    if (blockedEdges.has(edge.id)) continue;

    const u = edge.from;
    const v = edge.to;

    if (blockedNodes.has(u) || blockedNodes.has(v)) continue;
    if (closedExits.has(u) || closedExits.has(v)) continue;

    adj.get(u).push({ neighbor: v, edgeId: edge.id, cost: edge.cost });
    adj.get(v).push({ neighbor: u, edgeId: edge.id, cost: edge.cost });
  }

  const dist = new Map();
  const paths = new Map();
  const edgePaths = new Map();
  const unvisited = new Set();

  for (const n of nodes) {
    dist.set(n.id, Infinity);
    paths.set(n.id, []);
    edgePaths.set(n.id, []);
    if (!blockedNodes.has(n.id) && !closedExits.has(n.id)) {
      unvisited.add(n.id);
    }
  }

  dist.set(startId, 0);
  paths.set(startId, [startId]);
  edgePaths.set(startId, []);

  while (unvisited.size > 0) {
    let current = null;
    let minDist = Infinity;

    for (const u of unvisited) {
      const d = dist.get(u);
      if (d < minDist) {
        minDist = d;
        current = u;
      } else if (d === minDist && minDist < Infinity) {
        const cmp = compareNodePaths(paths.get(u), paths.get(current));
        if (cmp < 0 || (cmp === 0 && u.localeCompare(current) < 0)) {
          current = u;
        }
      }
    }

    if (current === null || minDist === Infinity) break;
    unvisited.delete(current);

    const currentDist = minDist;
    const currentPath = paths.get(current);
    const currentEdgePath = edgePaths.get(current);

    const neighbors = adj.get(current) || [];
    for (const { neighbor, edgeId, cost } of neighbors) {
      if (!unvisited.has(neighbor)) continue;

      const newDist = currentDist + cost;
      const newPath = [...currentPath, neighbor];
      const newEdgePath = [...currentEdgePath, edgeId];

      const existingDist = dist.get(neighbor);
      if (newDist < existingDist) {
        dist.set(neighbor, newDist);
        paths.set(neighbor, newPath);
        edgePaths.set(neighbor, newEdgePath);
      } else if (newDist === existingDist) {
        const existingPath = paths.get(neighbor);
        if (compareNodePaths(newPath, existingPath) < 0) {
          paths.set(neighbor, newPath);
          edgePaths.set(neighbor, newEdgePath);
        }
      }
    }
  }

  let bestExit = null;
  let bestCost = Infinity;
  let bestPath = null;
  let bestEdgePath = [];

  for (const exitId of openExits) {
    const cost = dist.get(exitId);
    if (cost === undefined || cost === Infinity) continue;
    const path = paths.get(exitId);
    const edgePath = edgePaths.get(exitId);

    if (cost < bestCost) {
      bestCost = cost;
      bestExit = exitId;
      bestPath = path;
      bestEdgePath = edgePath;
    } else if (cost === bestCost) {
      const exitCmp = exitId.localeCompare(bestExit);
      if (exitCmp < 0) {
        bestCost = cost;
        bestExit = exitId;
        bestPath = path;
        bestEdgePath = edgePath;
      } else if (exitCmp === 0) {
        if (compareNodePaths(path, bestPath) < 0) {
          bestCost = cost;
          bestExit = exitId;
          bestPath = path;
          bestEdgePath = edgePath;
        }
      }
    }
  }

  if (!bestExit) {
    return { status: 'NO_ROUTE', path: null, cost: 0, exitId: null, edgeIds: [] };
  }

  return {
    status: 'ROUTE_FOUND',
    cost: bestCost,
    exitId: bestExit,
    path: bestPath,
    edgeIds: bestEdgePath
  };
}

// ==========================================
// 4. HIGH-TECH SVG BLUEPRINT MAP RENDERER
// ==========================================
function renderSVGMap() {
  const container = document.getElementById('map-canvas-container');
  if (!container || !AppState.dataset) return;

  const { nodes, edges } = AppState.dataset;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Calculate tight bounding box with proportional padding
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const width = Math.max(100, maxX - minX);
  const height = Math.max(100, maxY - minY);
  const pad = 48; // crisp proportioned padding
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = width + pad * 2;
  const vbH = height + pad * 2;

  const routeNodes = new Set(AppState.activeRoute?.path || []);
  const routeEdges = new Set(AppState.activeRoute?.edgeIds || []);

  let svgContent = `
    <svg id="building-svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" class="interactive-map">
      <defs>
        <!-- Blueprint Grid Pattern -->
        <pattern id="blueprint-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(56, 189, 248, 0.05)" stroke-width="0.8"/>
        </pattern>
        
        <!-- Tactical Route Glow Filter -->
        <filter id="route-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Runner Beacon Glow -->
        <filter id="runner-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Hazard Pattern -->
        <pattern id="hazard-pattern" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="12" stroke="#EF4444" stroke-width="4.5" />
          <line x1="6" y1="0" x2="6" y2="12" stroke="#450A0A" stroke-width="4.5" />
        </pattern>
      </defs>

      <!-- Background Grid -->
      <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="url(#blueprint-grid)" />

      <!-- Map Zoom & Pan Group -->
      <g id="map-zoom-group" transform="translate(${AppState.zoomTransform.x}, ${AppState.zoomTransform.y}) scale(${AppState.zoomTransform.scale})">
        
        <!-- Corridors / Edges Layer -->
        <g id="edges-layer">
  `;

  // Render Corridors / Edges
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;

    const isBlocked = AppState.blockedEdges.has(edge.id);
    const isRoute = routeEdges.has(edge.id);

    let edgeClass = 'map-edge';
    if (isBlocked) edgeClass += ' blocked';
    else if (isRoute) edgeClass += ' on-route';

    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;

    svgContent += `
      <g class="edge-group" data-edge-id="${edge.id}" tabindex="0" role="button" aria-label="Corridor ${edge.id}, Cost ${edge.cost}">
        <!-- Generous hit box for effortless clicking -->
        <line x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" class="edge-hitbox" />
        
        <!-- Base Corridor Line -->
        <line x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" class="${edgeClass}" />

        ${isRoute && !isBlocked ? `
          <!-- Active Animated Pulse Route Line -->
          <line x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" class="route-animated-line" filter="url(#route-glow)" />
        ` : ''}

        <!-- Edge Cost Badge Pill -->
        <g class="cost-badge ${isBlocked ? 'cost-badge-blocked' : isRoute ? 'cost-badge-route' : ''}" transform="translate(${midX}, ${midY})">
          <rect x="-18" y="-12" width="36" height="24" rx="7" class="cost-badge-bg" />
          ${isBlocked ? `
            <text x="0" y="4" text-anchor="middle" class="cost-badge-blocked-icon">✕</text>
          ` : `
            <text x="0" y="4" text-anchor="middle" class="cost-badge-text">${edge.cost}</text>
          `}
        </g>
      </g>
    `;
  }

  svgContent += `
        </g>
        
        <!-- Nodes Layer -->
        <g id="nodes-layer">
  `;

  // Render Nodes
  for (const node of nodes) {
    const isStart = AppState.startNodeId === node.id;
    const isBlocked = AppState.blockedNodes.has(node.id);
    const isClosedExit = node.type === 'exit' && AppState.closedExits.has(node.id);
    const isRoute = routeNodes.has(node.id);

    let nodeClass = `map-node type-${node.type}`;
    if (isStart) nodeClass += ' is-start';
    if (isBlocked) nodeClass += ' is-blocked';
    if (isClosedExit) nodeClass += ' is-closed';
    if (isRoute) nodeClass += ' on-route';

    svgContent += `
      <g class="node-group ${nodeClass}" data-node-id="${node.id}" transform="translate(${node.x}, ${node.y})" tabindex="0" role="button" aria-label="${node.label} (${node.id})">
    `;

    if (node.type === 'exit') {
      // Exit Node: Tactical Shield & Emergency Icon
      svgContent += `
        <rect x="-26" y="-26" width="52" height="52" rx="14" class="node-glow-ring exit-ring" />
        <rect x="-22" y="-22" width="44" height="44" rx="12" class="node-shape exit-shape" />
        <!-- Running Man / Doorway Icon -->
        <g class="exit-glyph-icon" transform="translate(-10, -10)">
          <path d="M14 2v16H4V2h10m2-2H2v20h16V0z" fill="#FFFFFF"/>
          <path d="M7 10h2v2H7z" fill="#FFFFFF"/>
        </g>
        <!-- Exit Status Badge -->
        <rect x="-20" y="16" width="40" height="15" rx="5" class="node-badge-bg ${isClosedExit ? 'badge-closed' : 'badge-exit'}" />
        <text x="0" y="27" text-anchor="middle" class="node-badge-text">${isClosedExit ? 'CLOSED' : 'EXIT'}</text>
      `;
    } else {
      // Room or Junction
      const radius = node.type === 'room' ? 22 : 18;

      svgContent += `
        ${isStart ? `
          <!-- Start Pulsing Beacon -->
          <circle cx="0" cy="0" r="${radius + 12}" class="start-pulse-ring" filter="url(#runner-glow)" />
          <circle cx="0" cy="0" r="${radius + 6}" class="start-pulse-ring-inner" />
        ` : ''}

        <circle cx="0" cy="0" r="${radius + 5}" class="node-glow-ring" />
        <circle cx="0" cy="0" r="${radius}" class="node-shape" />

        <!-- Node Center Icon Glyph -->
        <g class="node-inner-glyph">
          ${node.type === 'room' ? `
            <!-- Room Icon -->
            <rect x="-6" y="-7" width="12" height="14" rx="2" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>
            <circle cx="2" cy="0" r="1.2" fill="#FFFFFF"/>
          ` : `
            <!-- Junction Icon -->
            <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" opacity="0.9"/>
          `}
        </g>

        ${isBlocked ? `
          <!-- Hazard Crossed Overlay -->
          <circle cx="0" cy="0" r="${radius - 2}" fill="url(#hazard-pattern)" class="hazard-overlay" />
          <line x1="-9" y1="-9" x2="9" y2="9" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" />
          <line x1="9" y1="-9" x2="-9" y2="9" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" />
        ` : ''}

        ${isStart ? `
          <rect x="-24" y="${-radius - 20}" width="48" height="17" rx="6" class="start-pill-bg" />
          <text x="0" y="${-radius - 8}" text-anchor="middle" class="start-pill-text">START</text>
        ` : ''}
      `;
    }

    // High Readability Label
    const labelY = node.type === 'exit' ? -32 : 36;
    svgContent += `
        <g class="node-label-pill" transform="translate(0, ${labelY})">
          <text x="0" y="0" text-anchor="middle" class="node-title">${node.label}</text>
          <text x="0" y="13" text-anchor="middle" class="node-id-sub">[${node.id}]</text>
        </g>
      </g>
    `;
  }

  // Simulation Evacuee Runner Avatar Layer
  const runner = AppState.simulation.runnerPos;
  if (AppState.simulation.isRunning && runner) {
    svgContent += `
      <g id="sim-runner-avatar" transform="translate(${runner.x}, ${runner.y})" filter="url(#runner-glow)">
        <circle cx="0" cy="0" r="14" class="runner-halo" />
        <circle cx="0" cy="0" r="9" class="runner-core" />
        <text x="0" y="4" text-anchor="middle" class="runner-icon">🏃</text>
      </g>
    `;
  }

  svgContent += `
        </g>
      </g>
    </svg>
  `;

  container.innerHTML = svgContent;
  attachSVGInteractions();
}

// ==========================================
// 5. ATTACH INTERACTIVE SVG EVENTS
// ==========================================
function attachSVGInteractions() {
  const container = document.getElementById('map-canvas-container');
  const svg = document.getElementById('building-svg');
  if (!svg || !container) return;

  svg.querySelectorAll('.node-group').forEach(group => {
    group.addEventListener('click', (e) => {
      e.stopPropagation();
      handleNodeClick(group.getAttribute('data-node-id'));
    });

    group.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNodeClick(group.getAttribute('data-node-id'));
      }
    });
  });

  svg.querySelectorAll('.edge-group').forEach(group => {
    group.addEventListener('click', (e) => {
      e.stopPropagation();
      handleEdgeClick(group.getAttribute('data-edge-id'));
    });

    group.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEdgeClick(group.getAttribute('data-edge-id'));
      }
    });
  });

  // Pan & Zoom
  container.onwheel = (e) => {
    e.preventDefault();
    zoomMap(e.deltaY < 0 ? 1.15 : 0.87);
  };

  container.onmousedown = (e) => {
    if (e.target.closest('.node-group') || e.target.closest('.edge-group')) return;
    AppState.isPanning = true;
    AppState.panStart = { x: e.clientX - AppState.zoomTransform.x, y: e.clientY - AppState.zoomTransform.y };
    container.classList.add('grabbing');
  };

  window.onmousemove = (e) => {
    if (!AppState.isPanning) return;
    AppState.zoomTransform.x = e.clientX - AppState.panStart.x;
    AppState.zoomTransform.y = e.clientY - AppState.panStart.y;
    applyMapTransform();
  };

  window.onmouseup = () => {
    if (AppState.isPanning) {
      AppState.isPanning = false;
      container.classList.remove('grabbing');
    }
  };
}

function zoomMap(factor) {
  const newScale = Math.min(3.5, Math.max(0.4, AppState.zoomTransform.scale * factor));
  AppState.zoomTransform.scale = newScale;
  applyMapTransform();
}

function resetMapView() {
  AppState.zoomTransform = { scale: 1, x: 0, y: 0 };
  applyMapTransform();
}

function applyMapTransform() {
  const group = document.getElementById('map-zoom-group');
  if (group) {
    group.setAttribute('transform', `translate(${AppState.zoomTransform.x}, ${AppState.zoomTransform.y}) scale(${AppState.zoomTransform.scale})`);
  }
}

// ==========================================
// 6. INTERACTION & HAZARDS LOGIC
// ==========================================
function handleNodeClick(nodeId) {
  const node = AppState.dataset.nodes.find(n => n.id === nodeId);
  if (!node) return;

  if (AppState.interactionMode === 'hazard') {
    if (node.type === 'exit') {
      toggleClosedExit(nodeId);
    } else {
      toggleBlockedNode(nodeId);
    }
    return;
  }

  // Start Mode
  if (node.type === 'exit') {
    flashToast(getTranslation('selectStartPrompt'), 'info');
    SoundFX.blip();
    return;
  }

  if (AppState.blockedNodes.has(nodeId)) {
    flashToast(getTranslation('startBlockedDetails'), 'warning');
    SoundFX.alertAlarm();
    return;
  }

  AppState.startNodeId = nodeId;
  SoundFX.selectStart();
  stopEvacuationSimulation();
  updateSimulation();
}

function handleEdgeClick(edgeId) {
  toggleBlockedEdge(edgeId);
}

function toggleBlockedNode(nodeId) {
  const isBlocked = AppState.blockedNodes.has(nodeId);
  if (isBlocked) {
    AppState.blockedNodes.delete(nodeId);
  } else {
    AppState.blockedNodes.add(nodeId);
  }
  SoundFX.hazardToggle(!isBlocked);
  handleDynamicSimulationInterruption();
  updateSimulation();
}

function toggleClosedExit(exitId) {
  const isClosed = AppState.closedExits.has(exitId);
  if (isClosed) {
    AppState.closedExits.delete(exitId);
  } else {
    AppState.closedExits.add(exitId);
  }
  SoundFX.hazardToggle(!isClosed);
  handleDynamicSimulationInterruption();
  updateSimulation();
}

function toggleBlockedEdge(edgeId) {
  const isBlocked = AppState.blockedEdges.has(edgeId);
  if (isBlocked) {
    AppState.blockedEdges.delete(edgeId);
  } else {
    AppState.blockedEdges.add(edgeId);
  }
  SoundFX.hazardToggle(!isBlocked);
  handleDynamicSimulationInterruption();
  updateSimulation();
}

function clearAllHazards() {
  AppState.blockedNodes.clear();
  AppState.blockedEdges.clear();
  AppState.closedExits.clear();
  SoundFX.hazardToggle(false);
  updateSimulation();
  flashToast(getTranslation('clearAllHazards'), 'success');
}

function resetToInitialState() {
  if (!AppState.dataset) return;
  const initial = AppState.dataset.initial_state || {};
  AppState.blockedNodes = new Set(initial.blocked_nodes || []);
  AppState.blockedEdges = new Set(initial.blocked_edges || []);
  AppState.closedExits = new Set(initial.closed_exits || []);
  stopEvacuationSimulation();
  SoundFX.blip();
  updateSimulation();
  flashToast(getTranslation('resetSimulation'), 'success');
}

// ==========================================
// 7. EVACUATION RUNNER SIMULATION (GAME FEATURE)
// ==========================================
function startEvacuationSimulation() {
  if (!AppState.activeRoute || AppState.activeRoute.status !== 'ROUTE_FOUND') {
    flashToast(getTranslation('noRoute'), 'warning');
    SoundFX.alertAlarm();
    return;
  }

  const { path } = AppState.activeRoute;
  const nodeMap = new Map(AppState.dataset.nodes.map(n => [n.id, n]));
  const startNode = nodeMap.get(path[0]);

  AppState.simulation.isRunning = true;
  AppState.simulation.isPaused = false;
  AppState.simulation.currentIndex = 0;
  AppState.simulation.elapsedCost = 0;
  AppState.simulation.runnerPos = { x: startNode.x, y: startNode.y };

  updateSimulationHUD();
  SoundFX.blip();
  renderSVGMap();
  advanceSimulationStep();
}

function advanceSimulationStep() {
  if (!AppState.simulation.isRunning || AppState.simulation.isPaused) return;

  const { path, edgeIds } = AppState.activeRoute;
  const curIdx = AppState.simulation.currentIndex;

  if (curIdx >= path.length - 1) {
    // Evacuation Successful!
    AppState.simulation.isRunning = false;
    SoundFX.victoryFanfare();
    updateSimulationHUD('success');
    renderSVGMap();
    return;
  }

  const nodeMap = new Map(AppState.dataset.nodes.map(n => [n.id, n]));
  const edgeMap = new Map(AppState.dataset.edges.map(e => [e.id, e]));

  const fromNode = nodeMap.get(path[curIdx]);
  const toNode = nodeMap.get(path[curIdx + 1]);
  const edgeObj = edgeMap.get(edgeIds[curIdx]);
  const cost = edgeObj ? edgeObj.cost : 1;

  // Step duration scaled by speed
  const baseStepDuration = 900; // ms
  const stepTime = (baseStepDuration * (cost / 2.5)) / AppState.simulation.speed;

  SoundFX.stepMove();

  // Smoothly move runner from fromNode to toNode
  const startTime = performance.now();
  function animateRunner(now) {
    if (!AppState.simulation.isRunning || AppState.simulation.isPaused) return;

    const progress = Math.min(1, (now - startTime) / stepTime);
    AppState.simulation.runnerPos = {
      x: fromNode.x + (toNode.x - fromNode.x) * progress,
      y: fromNode.y + (toNode.y - fromNode.y) * progress
    };

    const runnerAvatar = document.getElementById('sim-runner-avatar');
    if (runnerAvatar) {
      runnerAvatar.setAttribute('transform', `translate(${AppState.simulation.runnerPos.x}, ${AppState.simulation.runnerPos.y})`);
    }

    if (progress < 1) {
      requestAnimationFrame(animateRunner);
    } else {
      AppState.simulation.currentIndex++;
      AppState.simulation.elapsedCost += cost;
      updateSimulationHUD('running');
      AppState.simulation.timerId = setTimeout(advanceSimulationStep, 200 / AppState.simulation.speed);
    }
  }

  requestAnimationFrame(animateRunner);
}

function pauseEvacuationSimulation() {
  AppState.simulation.isPaused = true;
  if (AppState.simulation.timerId) clearTimeout(AppState.simulation.timerId);
  updateSimulationHUD('paused');
  SoundFX.blip();
}

function resumeEvacuationSimulation() {
  if (!AppState.simulation.isRunning) return;
  AppState.simulation.isPaused = false;
  updateSimulationHUD('running');
  SoundFX.blip();
  advanceSimulationStep();
}

function stopEvacuationSimulation() {
  AppState.simulation.isRunning = false;
  AppState.simulation.isPaused = false;
  AppState.simulation.currentIndex = 0;
  AppState.simulation.elapsedCost = 0;
  AppState.simulation.runnerPos = null;
  if (AppState.simulation.timerId) clearTimeout(AppState.simulation.timerId);
  updateSimulationHUD('ready');
  renderSVGMap();
}

function handleDynamicSimulationInterruption() {
  // If simulation is running, adaptively check if path is still intact
  if (!AppState.simulation.isRunning) return;

  const currentPath = AppState.activeRoute?.path;
  if (!currentPath) {
    stopEvacuationSimulation();
    SoundFX.alertAlarm();
    return;
  }

  const currentIdx = AppState.simulation.currentIndex;
  const currentNodeId = currentPath[currentIdx];

  // Re-calculate route from current position!
  const newRoute = findOptimalRoute(
    AppState.dataset,
    currentNodeId,
    AppState.blockedNodes,
    AppState.blockedEdges,
    AppState.closedExits
  );

  if (newRoute.status !== 'ROUTE_FOUND') {
    AppState.simulation.isRunning = false;
    SoundFX.alertAlarm();
    updateSimulationHUD('failed');
    flashToast(getTranslation('simStatusFailed'), 'warning');
  }
}

function updateSimulationHUD(overrideStatus) {
  const statusEl = document.getElementById('sim-status-text');
  const timerEl = document.getElementById('sim-timer-val');
  const locEl = document.getElementById('sim-loc-val');
  const playBtn = document.getElementById('btn-sim-play');
  const pauseBtn = document.getElementById('btn-sim-pause');

  if (!statusEl || !timerEl || !locEl) return;

  const sim = AppState.simulation;
  const path = AppState.activeRoute?.path || [];
  const curId = path[sim.currentIndex] || AppState.startNodeId || '—';

  timerEl.textContent = `${sim.elapsedCost} units`;
  locEl.textContent = curId;

  if (overrideStatus === 'success') {
    statusEl.textContent = getTranslation('simStatusSuccess', { exit: AppState.activeRoute?.exitId });
    statusEl.className = 'sim-status-banner status-success';
    if (playBtn) playBtn.textContent = '▶ ' + getTranslation('btnSimulate');
  } else if (overrideStatus === 'failed') {
    statusEl.textContent = getTranslation('simStatusFailed');
    statusEl.className = 'sim-status-banner status-danger';
    if (playBtn) playBtn.textContent = '▶ ' + getTranslation('btnSimulate');
  } else if (sim.isRunning && !sim.isPaused) {
    statusEl.textContent = getTranslation('simStatusRunning');
    statusEl.className = 'sim-status-banner status-running';
    if (playBtn) playBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-flex';
  } else if (sim.isPaused) {
    statusEl.textContent = getTranslation('simStatusPaused');
    statusEl.className = 'sim-status-banner status-paused';
    if (playBtn) {
      playBtn.style.display = 'inline-flex';
      playBtn.textContent = '▶ ' + getTranslation('btnSimResume');
    }
    if (pauseBtn) pauseBtn.style.display = 'none';
  } else {
    statusEl.textContent = getTranslation('simStatusReady');
    statusEl.className = 'sim-status-banner status-ready';
    if (playBtn) {
      playBtn.style.display = 'inline-flex';
      playBtn.textContent = '▶ ' + getTranslation('btnSimulate');
    }
    if (pauseBtn) pauseBtn.style.display = 'none';
  }
}

// ==========================================
// 8. CRISIS SCENARIO PRESETS (GAME FEATURE)
// ==========================================
function applyEmergencyScenario(scenarioKey) {
  stopEvacuationSimulation();

  if (scenarioKey === 'normal') {
    resetToInitialState();
    return;
  }

  // Clear previous hazards then apply specific disaster
  AppState.blockedNodes.clear();
  AppState.blockedEdges.clear();
  AppState.closedExits.clear();

  if (scenarioKey === 'fire-junction-a') {
    // Fire blocks Junction A (C1)
    AppState.blockedNodes.add('C1');
    flashToast(`🚨 ${getTranslation('scenarioFireJunctionA')}`, 'warning');
  } else if (scenarioKey === 'north-exit-closed') {
    // North Exit (E1) collapsed
    AppState.closedExits.add('E1');
    flashToast(`🚨 ${getTranslation('scenarioNorthExitClosed')}`, 'warning');
  } else if (scenarioKey === 'corridor-collapse') {
    // Corridors L02 and L06 collapse
    AppState.blockedEdges.add('L02');
    AppState.blockedEdges.add('L06');
    flashToast(`🚨 ${getTranslation('scenarioCorridorCollapse')}`, 'warning');
  } else if (scenarioKey === 'worst-case') {
    // Multi hazard: C2, C3, and E1 closed
    AppState.blockedNodes.add('C2');
    AppState.blockedNodes.add('C3');
    AppState.closedExits.add('E1');
    flashToast(`🚨 ${getTranslation('scenarioWorstCase')}`, 'warning');
  }

  SoundFX.alertAlarm();
  updateSimulation();
}

// ==========================================
// 9. SIMULATION RECOMPUTATION & UI UPDATES
// ==========================================
function updateSimulation() {
  if (!AppState.dataset) return;

  const prevStatus = AppState.activeRoute?.status;

  // Run Dijkstra
  AppState.activeRoute = findOptimalRoute(
    AppState.dataset,
    AppState.startNodeId,
    AppState.blockedNodes,
    AppState.blockedEdges,
    AppState.closedExits
  );

  if (AppState.activeRoute.status === 'ROUTE_FOUND' && prevStatus !== 'ROUTE_FOUND') {
    SoundFX.routeFound();
  }

  renderSVGMap();
  updateStatusBar();
  updateRouteSummaryCard();
  updateHazardManagerList();
  updateSimulationHUD();
}

function updateStatusBar() {
  const banner = document.getElementById('status-banner');
  const icon = document.getElementById('status-icon');
  const title = document.getElementById('status-title');
  const desc = document.getElementById('status-desc');
  if (!banner || !icon || !title || !desc) return;

  const route = AppState.activeRoute;
  banner.className = 'status-banner';

  if (route.status === 'NO_START') {
    banner.classList.add('status-info');
    icon.textContent = 'ℹ️';
    title.textContent = getTranslation('selectStartPrompt');
    desc.textContent = getTranslation('inst1');
  } else if (route.status === 'START_BLOCKED') {
    banner.classList.add('status-danger');
    icon.textContent = '⚠️';
    title.textContent = getTranslation('startBlocked');
    desc.textContent = getTranslation('startBlockedDetails');
  } else if (route.status === 'NO_ROUTE') {
    banner.classList.add('status-warning');
    icon.textContent = '🚫';
    title.textContent = getTranslation('noRoute');
    desc.textContent = getTranslation('noRouteDetails');
  } else if (route.status === 'ROUTE_FOUND') {
    banner.classList.add('status-success');
    icon.textContent = '⚡';
    const exitNode = AppState.dataset.nodes.find(n => n.id === route.exitId);
    const exitLabel = exitNode ? `${exitNode.label} (${exitNode.id})` : route.exitId;
    title.textContent = getTranslation('routeActive', { exit: exitLabel, cost: route.cost });
    desc.textContent = `${getTranslation('totalEvacuationCost')}: ${route.cost} | ${getTranslation('hopCount')}: ${route.path.length - 1}`;
  }
}

function updateRouteSummaryCard() {
  const card = document.getElementById('route-details-panel');
  if (!card) return;

  const route = AppState.activeRoute;
  const nodeMap = new Map(AppState.dataset.nodes.map(n => [n.id, n]));
  const edgeMap = new Map(AppState.dataset.edges.map(e => [e.id, e]));

  if (!route || route.status !== 'ROUTE_FOUND') {
    let emptyMsg = getTranslation('selectStartPrompt');
    if (route?.status === 'START_BLOCKED') emptyMsg = getTranslation('startBlockedDetails');
    else if (route?.status === 'NO_ROUTE') emptyMsg = getTranslation('noRouteDetails');

    card.innerHTML = `
      <div class="empty-route-state">
        <div class="empty-icon">${route?.status === 'START_BLOCKED' ? '⚠️' : route?.status === 'NO_ROUTE' ? '🚫' : '📍'}</div>
        <h4 class="empty-title">${getTranslation('routeNoneTitle')}</h4>
        <p class="empty-desc">${emptyMsg}</p>
      </div>
    `;
    return;
  }

  const startNode = nodeMap.get(AppState.startNodeId);
  const exitNode = nodeMap.get(route.exitId);

  // Turn-by-Turn Steps
  let stepsHtml = '';
  for (let i = 0; i < route.path.length; i++) {
    const curId = route.path[i];
    const curNode = nodeMap.get(curId);
    const curLabel = curNode ? curNode.label : curId;

    if (i === 0) {
      stepsHtml += `
        <li class="route-step start-step">
          <div class="step-marker">●</div>
          <div class="step-content">
            <span class="step-desc">${getTranslation('initialStep', { label: curLabel, id: curId })}</span>
          </div>
        </li>
      `;
    } else {
      const edgeId = route.edgeIds[i - 1];
      const edgeObj = edgeMap.get(edgeId);
      const cost = edgeObj ? edgeObj.cost : '?';
      const isFinal = (i === route.path.length - 1);

      stepsHtml += `
        <li class="route-step ${isFinal ? 'exit-step' : 'transit-step'}">
          <div class="step-marker">${isFinal ? '🏁' : '↓'}</div>
          <div class="step-content">
            <span class="step-desc">
              ${isFinal 
                ? getTranslation('finalExitStep', { label: curLabel, id: curId, cost }) 
                : getTranslation('traversalStep', { label: curLabel, id: curId, cost })
              }
            </span>
            <span class="step-edge-badge">${edgeId} (${cost})</span>
          </div>
        </li>
      `;
    }
  }

  // Sequence Flow Badges
  const seqBadges = route.path.map((nid, idx) => {
    const n = nodeMap.get(nid);
    const isExit = n?.type === 'exit';
    const isStart = idx === 0;
    const cls = isStart ? 'seq-badge start' : isExit ? 'seq-badge exit' : 'seq-badge';
    return `<span class="${cls}">${nid}</span>`;
  }).join('<span class="seq-arrow">→</span>');

  card.innerHTML = `
    <!-- Simulation Runner Controller (Game Feature) -->
    <div class="sim-controller-panel">
      <div class="sim-header">
        <span class="sim-title-label">⚡ ${getTranslation('simTitle')}</span>
        <div class="sim-speed-selector">
          <span>${getTranslation('simSpeed')}:</span>
          <button type="button" class="btn-speed ${AppState.simulation.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
          <button type="button" class="btn-speed ${AppState.simulation.speed === 2 ? 'active' : ''}" data-speed="2">2x</button>
          <button type="button" class="btn-speed ${AppState.simulation.speed === 4 ? 'active' : ''}" data-speed="4">4x</button>
        </div>
      </div>

      <div class="sim-hud-status">
        <div id="sim-status-text" class="sim-status-banner status-ready">${getTranslation('simStatusReady')}</div>
        <div class="sim-metrics-bar">
          <span class="sim-metric-item">⏱ ${getTranslation('evacueeTimeElapsed')}: <strong id="sim-timer-val">0 units</strong></span>
          <span class="sim-metric-item">📍 ${getTranslation('evacueeCurrentLocation')}: <strong id="sim-loc-val">${AppState.startNodeId}</strong></span>
        </div>
      </div>

      <div class="sim-action-buttons">
        <button id="btn-sim-play" class="btn btn-primary btn-sim">▶ ${getTranslation('btnSimulate')}</button>
        <button id="btn-sim-pause" class="btn btn-secondary btn-sim" style="display:none;">⏸ ${getTranslation('btnSimPause')}</button>
        <button id="btn-sim-reset" class="btn btn-outline btn-sim">⏹ ${getTranslation('btnSimReset')}</button>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="route-metrics-grid">
      <div class="metric-card">
        <span class="metric-label">${getTranslation('startLocation')}</span>
        <span class="metric-value text-start">${startNode ? startNode.label : AppState.startNodeId} [${AppState.startNodeId}]</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">${getTranslation('destinationExit')}</span>
        <span class="metric-value text-exit">${exitNode ? exitNode.label : route.exitId} [${route.exitId}]</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">${getTranslation('totalEvacuationCost')}</span>
        <span class="metric-value text-cost">${route.cost}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">${getTranslation('hopCount')}</span>
        <span class="metric-value">${route.path.length - 1}</span>
      </div>
    </div>

    <!-- Sequence Badges Flow -->
    <div class="route-sequence-box">
      <div class="sequence-title">${getTranslation('pathSequence')}:</div>
      <div class="sequence-flow">${seqBadges}</div>
    </div>

    <!-- Turn-by-Turn Waypoints -->
    <div class="route-steps-section">
      <h4 class="steps-title">${getTranslation('stepByStepGuidance')}</h4>
      <ol class="steps-list">
        ${stepsHtml}
      </ol>
    </div>
  `;

  // Bind Simulation Controls
  document.getElementById('btn-sim-play')?.addEventListener('click', () => {
    if (AppState.simulation.isPaused) resumeEvacuationSimulation();
    else startEvacuationSimulation();
  });

  document.getElementById('btn-sim-pause')?.addEventListener('click', pauseEvacuationSimulation);
  document.getElementById('btn-sim-reset')?.addEventListener('click', stopEvacuationSimulation);

  card.querySelectorAll('.btn-speed').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.simulation.speed = parseInt(btn.getAttribute('data-speed'), 10);
      card.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function updateHazardManagerList() {
  const container = document.getElementById('hazard-items-list');
  if (!container || !AppState.dataset) return;

  const { nodes, edges } = AppState.dataset;
  const filter = AppState.activeHazardFilter;

  let items = [];

  // Rooms & Hubs
  if (filter === 'all' || filter === 'nodes') {
    nodes.filter(n => n.type !== 'exit').forEach(n => {
      const isBlocked = AppState.blockedNodes.has(n.id);
      items.push({
        id: n.id,
        category: 'node',
        label: `${n.label} (${n.id})`,
        type: n.type,
        statusText: isBlocked ? getTranslation('statusBlocked') : getTranslation('statusNormal'),
        btnText: isBlocked ? getTranslation('unblockAction') : getTranslation('blockAction'),
        isHazard: isBlocked,
        toggle: () => toggleBlockedNode(n.id)
      });
    });
  }

  // Exits
  if (filter === 'all' || filter === 'exits') {
    nodes.filter(n => n.type === 'exit').forEach(n => {
      const isClosed = AppState.closedExits.has(n.id);
      items.push({
        id: n.id,
        category: 'exit',
        label: `${n.label} (${n.id})`,
        type: 'exit',
        statusText: isClosed ? getTranslation('statusClosed') : getTranslation('statusOpen'),
        btnText: isClosed ? getTranslation('openAction') : getTranslation('closeAction'),
        isHazard: isClosed,
        toggle: () => toggleClosedExit(n.id)
      });
    });
  }

  // Corridors / Edges
  if (filter === 'all' || filter === 'edges') {
    edges.forEach(e => {
      const isBlocked = AppState.blockedEdges.has(e.id);
      items.push({
        id: e.id,
        category: 'edge',
        label: `${e.id}: ${e.from} ↔ ${e.to} (Cost: ${e.cost})`,
        type: 'edge',
        statusText: isBlocked ? getTranslation('statusBlocked') : getTranslation('statusNormal'),
        btnText: isBlocked ? getTranslation('unblockAction') : getTranslation('blockAction'),
        isHazard: isBlocked,
        toggle: () => toggleBlockedEdge(e.id)
      });
    });
  }

  const nodeCount = nodes.filter(n => n.type !== 'exit').length;
  const exitCount = nodes.filter(n => n.type === 'exit').length;
  const edgeCount = edges.length;
  const totalCount = nodeCount + exitCount + edgeCount;

  const tabAllBtn = document.getElementById('filter-all');
  const tabNodesBtn = document.getElementById('filter-nodes');
  const tabExitsBtn = document.getElementById('filter-exits');
  const tabEdgesBtn = document.getElementById('filter-edges');

  if (tabAllBtn) tabAllBtn.textContent = getTranslation('tabAll', { count: totalCount });
  if (tabNodesBtn) tabNodesBtn.textContent = getTranslation('tabNodes', { count: nodeCount });
  if (tabExitsBtn) tabExitsBtn.textContent = getTranslation('tabExits', { count: exitCount });
  if (tabEdgesBtn) tabEdgesBtn.textContent = getTranslation('tabEdges', { count: edgeCount });

  container.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = `hazard-row ${item.isHazard ? 'is-hazard' : ''}`;
    row.innerHTML = `
      <div class="hazard-row-info">
        <span class="hazard-type-pill type-${item.type}">${item.type.toUpperCase()}</span>
        <span class="hazard-row-label">${item.label}</span>
      </div>
      <div class="hazard-row-controls">
        <span class="hazard-status-tag ${item.isHazard ? 'tag-hazard' : 'tag-clear'}">${item.statusText}</span>
        <button type="button" class="btn btn-sm ${item.isHazard ? 'btn-unblock' : 'btn-block'}">${item.btnText}</button>
      </div>
    `;

    row.querySelector('button').addEventListener('click', () => item.toggle());
    container.appendChild(row);
  });
}

// ==========================================
// 10. FILE LOADING & DATASET PARSING
// ==========================================
function loadBuildingData(jsonStringOrObject) {
  try {
    const data = typeof jsonStringOrObject === 'string' 
      ? JSON.parse(jsonStringOrObject) 
      : jsonStringOrObject;

    const validation = validateBuildingData(data);
    if (!validation.valid) {
      showErrorModal(validation.error);
      return false;
    }

    AppState.dataset = data;

    const initial = data.initial_state || {};
    AppState.blockedNodes = new Set(initial.blocked_nodes || []);
    AppState.blockedEdges = new Set(initial.blocked_edges || []);
    AppState.closedExits = new Set(initial.closed_exits || []);

    const validRooms = data.nodes.filter(n => (n.type === 'room' || n.type === 'junction') && !AppState.blockedNodes.has(n.id));
    AppState.startNodeId = validRooms.length > 0 ? validRooms[0].id : null;

    const titleEl = document.getElementById('building-title-display');
    const metaEl = document.getElementById('building-meta-display');
    if (titleEl) titleEl.textContent = data.building;
    if (metaEl) {
      metaEl.textContent = getTranslation('datasetInfo', {
        nodes: data.nodes.length,
        edges: data.edges.length,
        exits: data.nodes.filter(n => n.type === 'exit').length
      });
    }

    stopEvacuationSimulation();
    resetMapView();
    updateSimulation();
    SoundFX.routeFound();
    flashToast(`✓ ${data.building} loaded successfully`, 'success');
    return true;
  } catch (err) {
    showErrorModal(getTranslation('errInvalidJSON') + ' (' + err.message + ')');
    return false;
  }
}

function handleFileDropOrSelect(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => loadBuildingData(e.target.result);
  reader.onerror = () => showErrorModal("Failed to read file.");
  reader.readAsText(file);
}

// ==========================================
// 11. MODALS & TOAST NOTIFICATIONS
// ==========================================
function showErrorModal(message) {
  const modal = document.getElementById('error-modal');
  const msgEl = document.getElementById('modal-error-message');
  if (modal && msgEl) {
    msgEl.textContent = message;
    modal.classList.add('visible');
    SoundFX.alertAlarm();
  } else {
    alert(message);
  }
}

function closeErrorModal() {
  document.getElementById('error-modal')?.classList.remove('visible');
}

function flashToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

// ==========================================
// 12. I18N DOM BINDINGS
// ==========================================
function updateStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = getTranslation(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', getTranslation(key));
  });

  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.innerHTML = currentLang === 'en' 
      ? '<span class="lang-flag">🌐</span> <strong>EN</strong> / বাংলা' 
      : '<span class="lang-flag">🌐</span> EN / <strong>বাংলা</strong>';
  }

  const soundBtn = document.getElementById('btn-sound-toggle');
  if (soundBtn) {
    soundBtn.innerHTML = AppState.soundEnabled 
      ? `<span>🔊</span> ${getTranslation('soundOn')}` 
      : `<span>🔇</span> ${getTranslation('soundOff')}`;
  }

  if (AppState.dataset) {
    const metaEl = document.getElementById('building-meta-display');
    if (metaEl) {
      metaEl.textContent = getTranslation('datasetInfo', {
        nodes: AppState.dataset.nodes.length,
        edges: AppState.dataset.edges.length,
        exits: AppState.dataset.nodes.filter(n => n.type === 'exit').length
      });
    }
  }

  updateStatusBar();
  updateRouteSummaryCard();
  updateHazardManagerList();
}

// ==========================================
// 13. INITIALIZATION
// ==========================================
async function initApp() {
  initLanguage();

  // Language Toggle
  document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
    setLanguage(currentLang === 'en' ? 'bn' : 'en');
    SoundFX.blip();
    updateStaticTranslations();
  });

  // Sound FX Toggle
  document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
    AppState.soundEnabled = !AppState.soundEnabled;
    SoundFX.init();
    if (AppState.soundEnabled) SoundFX.blip();
    updateStaticTranslations();
  });

  // Mode Selection
  const modeStartBtn = document.getElementById('mode-start-btn');
  const modeHazardBtn = document.getElementById('mode-hazard-btn');
  if (modeStartBtn && modeHazardBtn) {
    modeStartBtn.addEventListener('click', () => {
      AppState.interactionMode = 'start';
      modeStartBtn.classList.add('active');
      modeHazardBtn.classList.remove('active');
      document.getElementById('map-canvas-container')?.classList.remove('hazard-cursor');
      SoundFX.blip();
    });

    modeHazardBtn.addEventListener('click', () => {
      AppState.interactionMode = 'hazard';
      modeHazardBtn.classList.add('active');
      modeStartBtn.classList.remove('active');
      document.getElementById('map-canvas-container')?.classList.add('hazard-cursor');
      SoundFX.blip();
    });
  }

  // Sidebar Tabs (Route, Hazards, Scenarios)
  const sidebarTabs = [
    { id: 'tab-nav-route', panel: 'panel-route', key: 'route' },
    { id: 'tab-nav-hazards', panel: 'panel-hazards', key: 'hazards' },
    { id: 'tab-nav-scenarios', panel: 'panel-scenarios', key: 'scenarios' }
  ];

  sidebarTabs.forEach(({ id, panel, key }) => {
    const tabEl = document.getElementById(id);
    if (!tabEl) return;
    tabEl.addEventListener('click', () => {
      sidebarTabs.forEach(t => {
        document.getElementById(t.id)?.classList.remove('active');
        document.getElementById(t.panel)?.classList.remove('active');
      });
      tabEl.classList.add('active');
      document.getElementById(panel)?.classList.add('active');
      AppState.activeSidebarTab = key;
      SoundFX.blip();
    });
  });

  // Crisis Scenarios Buttons
  document.querySelectorAll('.btn-scenario').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenarioKey = btn.getAttribute('data-scenario');
      applyEmergencyScenario(scenarioKey);
    });
  });

  // Action Buttons
  document.getElementById('btn-reset-state')?.addEventListener('click', resetToInitialState);
  document.getElementById('btn-clear-hazards')?.addEventListener('click', clearAllHazards);
  document.getElementById('btn-reload-default')?.addEventListener('click', () => loadBuildingData(DEFAULT_BUILDING_DATA));
  document.getElementById('btn-reset-view')?.addEventListener('click', resetMapView);
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => zoomMap(1.2));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => zoomMap(0.83));
  document.getElementById('btn-modal-close')?.addEventListener('click', closeErrorModal);

  // Hazard Filter Tabs
  ['filter-all', 'filter-nodes', 'filter-exits', 'filter-edges'].forEach(fid => {
    const el = document.getElementById(fid);
    if (!el) return;
    el.addEventListener('click', () => {
      ['filter-all', 'filter-nodes', 'filter-exits', 'filter-edges'].forEach(id => document.getElementById(id)?.classList.remove('active'));
      el.classList.add('active');
      AppState.activeHazardFilter = fid.replace('filter-', '');
      SoundFX.blip();
      updateHazardManagerList();
    });
  });

  // Drag & Drop / File Input
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFileDropOrSelect(e.target.files[0]);
    });
  }

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eName => {
      dropZone.addEventListener(eName, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eName => {
      dropZone.addEventListener(eName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileDropOrSelect(e.dataTransfer.files[0]);
      }
    });
  }

  // Load Initial Dataset
  try {
    const res = await fetch('building.json');
    if (res.ok) {
      const data = await res.json();
      loadBuildingData(data);
    } else {
      loadBuildingData(DEFAULT_BUILDING_DATA);
    }
  } catch (e) {
    loadBuildingData(DEFAULT_BUILDING_DATA);
  }

  updateStaticTranslations();
}

window.addEventListener('DOMContentLoaded', initApp);
