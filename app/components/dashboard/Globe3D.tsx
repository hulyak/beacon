'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Globe, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// Supply chain locations with lat/long
const supplyChainNodes = [
  { id: 1, name: 'Shanghai', lat: 31.2304, lng: 121.4737, type: 'supplier', status: 'healthy', risk: 15 },
  { id: 2, name: 'Shenzhen', lat: 22.5431, lng: 114.0579, type: 'manufacturer', status: 'warning', risk: 45 },
  { id: 3, name: 'Singapore', lat: 1.3521, lng: 103.8198, type: 'warehouse', status: 'healthy', risk: 10 },
  { id: 4, name: 'Rotterdam', lat: 51.9244, lng: 4.4777, type: 'distributor', status: 'healthy', risk: 20 },
  { id: 5, name: 'Los Angeles', lat: 34.0522, lng: -118.2437, type: 'warehouse', status: 'critical', risk: 75 },
  { id: 6, name: 'New York', lat: 40.7128, lng: -74.006, type: 'retailer', status: 'healthy', risk: 12 },
  { id: 7, name: 'Tokyo', lat: 35.6762, lng: 139.6503, type: 'supplier', status: 'healthy', risk: 18 },
  { id: 8, name: 'Mumbai', lat: 19.076, lng: 72.8777, type: 'manufacturer', status: 'warning', risk: 55 },
  { id: 9, name: 'Dubai', lat: 25.2048, lng: 55.2708, type: 'warehouse', status: 'healthy', risk: 8 },
  { id: 10, name: 'London', lat: 51.5074, lng: -0.1278, type: 'retailer', status: 'healthy', risk: 15 },
];

// Routes between nodes
const routes = [
  { from: 1, to: 3, status: 'active' },
  { from: 2, to: 3, status: 'delayed' },
  { from: 3, to: 4, status: 'active' },
  { from: 3, to: 5, status: 'disrupted' },
  { from: 4, to: 6, status: 'active' },
  { from: 4, to: 10, status: 'active' },
  { from: 7, to: 3, status: 'active' },
  { from: 8, to: 9, status: 'delayed' },
  { from: 9, to: 4, status: 'active' },
  { from: 5, to: 6, status: 'active' },
];

// Convert lat/lng to 3D coordinates
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Generate arc points between two locations
function generateArcPoints(start: THREE.Vector3, end: THREE.Vector3, segments: number = 50): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  midPoint.normalize().multiplyScalar(2 + distance * 0.3);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3();

    // Quadratic bezier curve
    point.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * midPoint.x + t * t * end.x;
    point.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * midPoint.y + t * t * end.y;
    point.z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * midPoint.z + t * t * end.z;

    points.push(point);
  }
  return points;
}

// Animated globe mesh
function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main globe */}
      <Sphere args={[2, 64, 64]}>
        <meshPhongMaterial
          color="#0ea5e9"
          transparent
          opacity={0.15}
          wireframe={false}
        />
      </Sphere>

      {/* Wireframe overlay */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial
          color="#06b6d4"
          wireframe
          transparent
          opacity={0.3}
        />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere args={[2.1, 32, 32]}>
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

// Node marker on globe
function NodeMarker({ node }: { node: typeof supplyChainNodes[0] }) {
  const position = latLngToVector3(node.lat, node.lng, 2.08);
  const [hovered, setHovered] = useState(false);

  const color = node.status === 'healthy' ? '#22c55e' :
                node.status === 'warning' ? '#f59e0b' : '#ef4444';

  const typeIcon = node.type === 'supplier' ? '🏭' :
                   node.type === 'manufacturer' ? '⚙️' :
                   node.type === 'warehouse' ? '📦' :
                   node.type === 'distributor' ? '🚚' : '🏪';

  return (
    <group position={position}>
      {/* Large outer glow ring */}
      <mesh>
        <ringGeometry args={[0.12, 0.18, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Middle ring */}
      <mesh>
        <ringGeometry args={[0.08, 0.12, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Marker point - larger */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Vertical beam for visibility */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* Always visible label */}
      <Html distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap shadow-lg border ${
          hovered ? 'scale-125' : ''
        } transition-transform ${
          node.status === 'healthy' ? 'bg-green-500/90 border-green-400 text-white' :
          node.status === 'warning' ? 'bg-yellow-500/90 border-yellow-400 text-white' :
          'bg-red-500/90 border-red-400 text-white'
        }`}>
          <span>{typeIcon}</span>
          <span>{node.name}</span>
        </div>
      </Html>

      {/* Detailed tooltip on hover */}
      {hovered && (
        <Html distanceFactor={5} position={[0, 0.4, 0]}>
          <div className="bg-gray-900/95 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl border border-gray-700">
            <div className="font-bold text-sm">{node.name}</div>
            <div className="text-gray-300 capitalize">{node.type}</div>
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-700">
              <span className="text-gray-400">Risk:</span>
              <span className={`font-bold ${
                node.risk > 50 ? 'text-red-400' : node.risk > 30 ? 'text-yellow-400' : 'text-green-400'
              }`}>{node.risk}%</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Route arc between nodes
function RouteArc({ from, to, status }: { from: typeof supplyChainNodes[0]; to: typeof supplyChainNodes[0]; status: string }) {
  const startPos = latLngToVector3(from.lat, from.lng, 2.08);
  const endPos = latLngToVector3(to.lat, to.lng, 2.08);
  const points = useMemo(() => generateArcPoints(startPos, endPos), [startPos, endPos]);

  const color = status === 'active' ? '#22c55e' :
                status === 'delayed' ? '#f59e0b' : '#ef4444';

  return (
    <Line
      points={points}
      color={color}
      lineWidth={status === 'disrupted' ? 3 : 2}
      transparent
      opacity={0.8}
      dashed={status === 'disrupted'}
      dashSize={0.15}
      gapSize={0.08}
    />
  );
}

// Scene content
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#06b6d4" />

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

      <GlobeMesh />

      {/* Node markers */}
      {supplyChainNodes.map((node) => (
        <NodeMarker key={node.id} node={node} />
      ))}

      {/* Route arcs */}
      {routes.map((route, index) => {
        const fromNode = supplyChainNodes.find(n => n.id === route.from);
        const toNode = supplyChainNodes.find(n => n.id === route.to);
        if (fromNode && toNode) {
          return <RouteArc key={index} from={fromNode} to={toNode} status={route.status} />;
        }
        return null;
      })}

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// Stats summary
function GlobeStats() {
  const healthyCount = supplyChainNodes.filter(n => n.status === 'healthy').length;
  const warningCount = supplyChainNodes.filter(n => n.status === 'warning').length;
  const criticalCount = supplyChainNodes.filter(n => n.status === 'critical').length;
  const activeRoutes = routes.filter(r => r.status === 'active').length;

  return (
    <div className="absolute bottom-4 left-4 right-4 flex justify-center">
      <div className="bg-white/95 backdrop-blur rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span className="text-gray-600">{healthyCount} Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-gray-600">{warningCount} Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-gray-600">{criticalCount} Critical</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="text-gray-600">
            <span className="text-green-600 font-medium">{activeRoutes}</span>/{routes.length} Active Routes
          </div>
        </div>
      </div>
    </div>
  );
}

export function Globe3D() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Globe className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">Global Supply Chain</h3>
            <p className="text-gray-500 text-sm">Interactive 3D visualization</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-medium border border-cyan-200">
            3D View
          </span>
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* 3D Globe Canvas */}
      <div className="relative h-[400px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Scene />
        </Canvas>

        {/* Stats overlay */}
        <GlobeStats />

        {/* Instructions */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 border border-gray-200">
          <p className="text-[10px] text-gray-500">Drag to rotate | Scroll to zoom</p>
        </div>
      </div>
    </motion.div>
  );
}

export default Globe3D;
