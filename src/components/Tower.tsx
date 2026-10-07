import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { OrbitControls, ContactShadows, Edges } from '@react-three/drei';
import { RotateCcw } from 'lucide-react';
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
  onCollapse: () => void;
}

const BLOCK_H = 0.5;

function getTierColors(tier: Tier) {
  switch (tier) {
    case 'tier1': return '#fbbf24'; // amber-400
    case 'tier2': return '#f97316'; // orange-500
    case 'tier3': return '#ef4444'; // red-500
    case 'tier4': return '#e11d48'; // rose-600
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
      <meshStandardMaterial color="#05050f" roughness={1} />
    </mesh>
  );
}

// 3D Block Component
function PhysicsBlock({ block, onPullBlock, isCollapsed, onCollapse, pullCount }: { block: Block, onPullBlock: (block: Block) => void, isCollapsed: boolean, onCollapse: () => void, pullCount: number }) {

  const isVertical = block.orientation === 'vertical';
  // Use slightly shorter length to decrease maximum overhang stability
  const size = isVertical ? [0.98, 0.49, 2.90] : [2.90, 0.49, 0.98];
  const offset = block.position - 1;
  
  // Introduce realistic imperfections to break perfect mathematical balance
  const { jitterX, jitterZ, jitterRot } = useMemo(() => ({
    jitterX: (Math.random() - 0.5) * 0.01,
    jitterZ: (Math.random() - 0.5) * 0.01,
    jitterRot: (Math.random() - 0.5) * 0.02,
  }), []);

  const initialPos = isVertical 
    ? [offset * 1.0 + jitterX, (block.layer * (BLOCK_H + 0.002)) + (BLOCK_H / 2), jitterZ]
    : [jitterX, (block.layer * (BLOCK_H + 0.002)) + (BLOCK_H / 2), offset * 1.0 + jitterZ];

  const [ref, api] = useBox(() => ({
    mass: 1.0, 
    args: size as [number, number, number],
    position: initialPos as [number, number, number],
    rotation: [0, jitterRot, 0],
    material: { friction: 0.15, restitution: 0.0 },
    linearDamping: 0.1,
    angularDamping: 0.2, 
    fixedRotation: false,
    allowSleep: false,
    sleepState: 0, // 0 = AWAKE
  }));

  // Settle-on-spawn routine to zero out velocity for first 30 frames
  useEffect(() => {
    let frameCount = 0;
    let raf: number;
    const settle = () => {
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      frameCount++;
      if (frameCount < 30) {
        raf = requestAnimationFrame(settle);
      }
    };
    raf = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(raf);
  }, [api]);

  // Force wake up when a block is pulled
  useEffect(() => {
    api.wakeUp();
    // Apply a micro downward impulse to force the physics engine to break phantom friction/sleeping
    api.applyForce([0, -5, 0], [0, 0, 0]);
  }, [pullCount, api]);

  const [isHovered, setHovered] = useState(false);

  // Track Y position to detect falls
  useEffect(() => {
    if (isCollapsed || block.isRemoved) return;
    
    const startingY = (block.layer * BLOCK_H) + (BLOCK_H / 2);

    const unsubPos = api.position.subscribe((p) => {
      // Ground contact: any block originally above layer 1 that falls below 0.5 Y
      const isGroundContact = p[1] <= 0.5 && startingY > 0.6;
      if (isGroundContact) {
        onCollapse();
      }
    });

    return () => {
      unsubPos();
    };
  }, [api.position, isCollapsed, onCollapse, block.layer, block.isRemoved]);

  // Removed teleportation logic as we now unmount removed blocks completely

  const baseColor = getTierColors(block.tier);

  return (
    <mesh 
      ref={ref as any} 
      castShadow 
      receiveShadow
      onClick={(e) => {
        if (isCollapsed || block.isRemoved) return;
        e.stopPropagation();
        onPullBlock(block);
      }}
      onPointerOver={(e) => { 
        if (isCollapsed) return;
        e.stopPropagation(); 
        setHovered(true); 
      }}
      onPointerOut={() => setHovered(false)}
      scale={isHovered ? 1.02 : 1}
    >
      <boxGeometry args={size as [number, number, number]} />
      <meshPhysicalMaterial 
        color={baseColor}
        emissive={isHovered ? baseColor : '#000000'}
        emissiveIntensity={isHovered ? 0.5 : 0}
        roughness={isHovered ? 0.2 : 0.6}
        metalness={0.2}
        clearcoat={isHovered ? 0.5 : 0}
        clearcoatRoughness={0.2}
      />
      <Edges scale={1.001} color={isHovered ? "#ffffff" : "#000000"} opacity={isHovered ? 0.8 : 0.4} transparent />
    </mesh>
  );
}

// Tower Wrapper
export function Tower({ blocks, onPullBlock, isCollapsed, onCollapse }: TowerProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="w-full h-full absolute inset-0 touch-none">
      
      {/* Gesture Hint Overlay */}
      {!hasInteracted && !isCollapsed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-1000 ease-out opacity-70">
          <div className="bg-slate-900/60 backdrop-blur-md px-6 py-3 rounded-full border border-pink-500/30 text-pink-300 font-bold animate-pulse flex items-center gap-2">
            <svg className="w-6 h-6 animate-[bounce_2s_infinite_horizontal]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Swipe anywhere to rotate
          </div>
        </div>
      )}

      {/* Floating Action Button for Camera Reset */}
      <div className="absolute bottom-32 right-6 z-20 pointer-events-auto">
        <button
          onClick={resetCamera}
          className="bg-slate-800/80 backdrop-blur-md border border-slate-700 hover:border-pink-500 text-slate-300 hover:text-pink-400 p-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all active:scale-90"
          aria-label="Reset Camera"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      <Canvas shadows camera={{ position: [14, 12, 14], fov: 35 }}>
        <color attach="background" args={['#05050f']} />
        <fog attach="fog" args={['#05050f', 15, 35]} />
        
        {/* Cinematic Lighting Setup */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          castShadow 
          position={[10, 20, 15]} 
          intensity={1.2} 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={15}
          shadow-camera-bottom={-10}
        />
        {/* Rim lights for glowing edges */}
        <spotLight position={[-15, 10, -15]} intensity={2.0} color="#ec4899" angle={0.5} penumbra={1} />
        <spotLight position={[15, -5, -15]} intensity={1.5} color="#8b5cf6" angle={0.8} penumbra={1} />
        
        {/* Physics Engine with custom iterations for stability */}
        <Physics 
          iterations={20} // Set solver iterations higher for stability
          gravity={[0, -18, 0]} // Harsher gravity
          allowSleep={false}
          defaultContactMaterial={{
            friction: 0.15,
            restitution: 0.0,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 4
          }}
        >
          <Floor />
          {blocks.filter(b => !b.isRemoved).map(block => (
            <PhysicsBlock 
              key={block.id} 
              block={block} 
              onPullBlock={onPullBlock} 
              isCollapsed={isCollapsed}
              onCollapse={onCollapse}
              pullCount={blocks.filter(b => b.isRemoved).length}
            />
          ))}
        </Physics>
        
        <OrbitControls 
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableZoom={true}
          minZoom={0.5}
          maxZoom={2.0}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minDistance={15}
          maxDistance={30}
          target={[0, 4.5, 0]}
          onChange={() => {
            if (!hasInteracted) setHasInteracted(true);
          }}
        />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={20} blur={2.5} far={15} color="#000000" />
      </Canvas>
    </div>
  );
}
