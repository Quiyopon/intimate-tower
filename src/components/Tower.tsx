import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { OrbitControls, ContactShadows, Edges } from '@react-three/drei';
import type { Block, Tier } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TowerProps {
  blocks: Block[];
  onPullBlock: (block: Block) => void;
  isCollapsed: boolean;
  isPaused: boolean;
  onCollapse: () => void;
}

const BLOCK_H = 0.5;

function getTierColors(tier: Tier) {
  switch (tier) {
    case 'tier1': return '#fbbf24'; // amber-400
    case 'tier2': return '#f97316'; // orange-500
    case 'tier3': return '#ef4444'; // red-500
    case 'tier4': return '#e11d48'; // rose-600 (vibrant crimson)
    default: return '#94a3b8'; // slate-400
  }
}

// Floor
function Floor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: { friction: 0.8, restitution: 0.1 }
  }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#020617" /> {/* slate-950 */}
    </mesh>
  );
}

// 3D Block Component
function PhysicsBlock({ block, onPullBlock, isCollapsed, onCollapse }: { block: Block, onPullBlock: (block: Block) => void, isCollapsed: boolean, onCollapse: () => void }) {

  const isVertical = block.orientation === 'vertical';
  // Use slightly smaller collision boxes (0.48 vs 0.5) to prevent spawn-overlap explosion
  const size = isVertical ? [0.95, 0.48, 2.95] : [2.95, 0.48, 0.95];
  const offset = block.position - 1;
  const initialPos = isVertical 
    ? [offset * 1.0, (block.layer * BLOCK_H) + (BLOCK_H / 2), 0]
    : [0, (block.layer * BLOCK_H) + (BLOCK_H / 2), offset * 1.0];

  const [ref, api] = useBox(() => ({
    mass: 2, // Lighter blocks stack more stably in Cannon.js
    args: size as [number, number, number],
    position: initialPos as [number, number, number],
    material: { friction: 0.75, restitution: 0.0 }, 
    linearDamping: 0.48, 
    angularDamping: 0.48, 
    allowSleep: false,
  }));

  const [isHovered, setHovered] = useState(false);

  // Track Y position to detect falls
  useEffect(() => {
    if (isCollapsed || block.isRemoved) return;
    const unsub = api.position.subscribe((p) => {
      const startingY = (block.layer * BLOCK_H) + (BLOCK_H / 2);
      const dx = p[0] - initialPos[0];
      const dz = p[2] - initialPos[2];
      const horizontalDrift = Math.sqrt(dx*dx + dz*dz);
      // If block falls more than 2 units or drifts significantly horizontally, trigger collapse
      if (startingY - p[1] > 2.0 || horizontalDrift > 2.0) {
        onCollapse();
      }
    });
    return unsub;
  }, [api.position, isCollapsed, onCollapse, block.layer, block.isRemoved]);

  // Teleport the block away when it is removed to correctly wake up the resting bodies above it
  useEffect(() => {
    if (block.isRemoved) {
      api.position.set(0, -1000, 0);
      api.mass.set(0);
    }
  }, [block.isRemoved, api]);

  return (
    <mesh 
      ref={ref as any} 
      visible={!block.isRemoved}
      castShadow 
      receiveShadow
      onClick={(e) => {
        if (isCollapsed || block.isRemoved) return;
        e.stopPropagation();
        onPullBlock(block);
      }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={size as [number, number, number]} />
      <meshStandardMaterial 
        color={isHovered ? '#ffffff' : getTierColors(block.tier)} 
        roughness={0.7}
        metalness={0.1}
      />
      <Edges scale={1.001} color="#0f172a" opacity={0.3} transparent />
    </mesh>
  );
}

// Tower Wrapper
export function Tower({ blocks, onPullBlock, isCollapsed, isPaused, onCollapse }: TowerProps) {
  return (
    <div className="w-full h-full absolute inset-0 pt-16">
      <Canvas shadows camera={{ position: [14, 12, 14], fov: 35 }}>
        <color attach="background" args={['#0f172a']} /> {/* slate-900 */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          castShadow 
          position={[10, 20, 10]} 
          intensity={1.0} 
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.5} />
        <directionalLight position={[0, 5, -15]} intensity={0.3} />
        <directionalLight position={[-15, 5, 0]} intensity={0.3} />
        
        {/* Physics Engine with custom iterations for stability */}
        <Physics 
          iterations={60} 
          gravity={[0, -20, 0]} 
          allowSleep={false}
          isPaused={isPaused}
          defaultContactMaterial={{
            friction: 0.75, // Slightly lower static friction (2-3% weaker)
            restitution: 0.0,
            contactEquationStiffness: 1e7, // Relaxed stiffness for stacking
            contactEquationRelaxation: 4
          }}
        >
          <Floor />
          {blocks.map(block => (
            <PhysicsBlock 
              key={block.id} 
              block={block} 
              onPullBlock={onPullBlock} 
              isCollapsed={isCollapsed}
              onCollapse={onCollapse}
            />
          ))}
        </Physics>
        
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minDistance={15}
          maxDistance={25}
          target={[0, 4.5, 0]}
        />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={2} far={10} />
      </Canvas>
    </div>
  );
}
