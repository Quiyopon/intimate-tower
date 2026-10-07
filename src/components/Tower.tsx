import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { OrbitControls, ContactShadows, Edges } from '@react-three/drei';
import { useThemeStore } from '../store/themeStore';
import type { Block } from '../types';
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
  isDareActive?: boolean;
}

const BLOCK_H = 0.5;



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

// Global store to track physical state without React overhead
export const blockPhysicsStates = new Map<string, { pos: [number, number, number], rot: [number, number, number, number] }>();

// Real-time Physics Instability Tracker
function InstabilityTracker({ isCollapsed, blocksRemoved }: { isCollapsed: boolean, blocksRemoved: number }) {
  const currentInstabilityRef = useRef(0);

  useFrame(() => {
    if (isCollapsed) {
      // Force 100% on collapse
      const textEl = document.getElementById('instability-text');
      const barEl = document.getElementById('instability-bar');
      const containerEl = document.getElementById('instability-container');
      if (textEl && barEl) {
        textEl.innerText = '100%';
        barEl.style.width = '100%';
        barEl.className = 'h-full rounded-full bg-gradient-to-r transition-colors duration-200 from-pink-500 to-red-600 shadow-[0_0_15px_rgba(225,29,72,0.9)]';
        textEl.className = 'text-sm font-black text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]';
        if (containerEl) containerEl.className = 'absolute bottom-8 pb-6 left-1/2 -translate-x-1/2 w-72 text-center pointer-events-none z-10 animate-pulse';
      }
      return;
    }

    let totalX = 0, totalZ = 0;
    let maxTilt = 0;
    let activeBlocks = 0;
    
    const upVector = new THREE.Vector3(0, 1, 0);
    const blockUp = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();

    blockPhysicsStates.forEach((state) => {
      totalX += state.pos[0];
      totalZ += state.pos[2];
      activeBlocks++;

      quaternion.set(state.rot[0], state.rot[1], state.rot[2], state.rot[3]);
      blockUp.set(0, 1, 0).applyQuaternion(quaternion);
      const tilt = blockUp.angleTo(upVector);
      if (tilt > maxTilt) maxTilt = tilt;
    });

    if (activeBlocks === 0) return;

    const comX = totalX / activeBlocks;
    const comZ = totalZ / activeBlocks;
    const comOffset = Math.sqrt(comX * comX + comZ * comZ);

    const offsetFactor = Math.min(1, comOffset / 0.8);
    const tiltFactor = Math.min(1, maxTilt / 0.35);
    
    let target = Math.max(offsetFactor, tiltFactor) * 100;
    
    const baseline = Math.min(40, (blocksRemoved / 18) * 40);
    target = Math.max(baseline, target);
    target = Math.min(99, target);

    // Lerp smoothing
    currentInstabilityRef.current += (target - currentInstabilityRef.current) * 0.05;

    // Direct DOM updates
    const val = Math.round(currentInstabilityRef.current);
    const textEl = document.getElementById('instability-text');
    const barEl = document.getElementById('instability-bar');
    const containerEl = document.getElementById('instability-container');

    if (textEl && barEl) {
      textEl.innerText = `${val}%`;
      barEl.style.width = `${val}%`;

      if (val < 40) {
        barEl.className = 'h-full rounded-full bg-gradient-to-r transition-colors duration-200 from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]';
        textEl.className = 'text-sm font-black text-slate-200';
        if (containerEl) containerEl.className = 'absolute bottom-8 pb-6 left-1/2 -translate-x-1/2 w-72 text-center pointer-events-none z-10';
      } else if (val < 70) {
        barEl.className = 'h-full rounded-full bg-gradient-to-r transition-colors duration-200 from-yellow-400 to-amber-500 shadow-[0_0_10px_rgba(250,204,21,0.8)]';
        textEl.className = 'text-sm font-black text-slate-200';
        if (containerEl) containerEl.className = 'absolute bottom-8 pb-6 left-1/2 -translate-x-1/2 w-72 text-center pointer-events-none z-10';
      } else {
        barEl.className = 'h-full rounded-full bg-gradient-to-r transition-colors duration-200 from-pink-500 to-red-600 shadow-[0_0_15px_rgba(225,29,72,0.9)]';
        textEl.className = 'text-sm font-black text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]';
        if (containerEl) containerEl.className = 'absolute bottom-8 pb-6 left-1/2 -translate-x-1/2 w-72 text-center pointer-events-none z-10 animate-pulse';
      }
    }
  });

  return null;
}

// 3D Block Component
function PhysicsBlock({ block, onPullBlock, isCollapsed, onCollapse, pullCount, isDareActive = false }: { block: Block, onPullBlock: (block: Block) => void, isCollapsed: boolean, onCollapse: () => void, pullCount: number, isDareActive?: boolean }) {
  const activeColors = useThemeStore((state) => state.getActiveColors());
  const theme = useThemeStore((state) => state.theme);

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

  // Zero-drift protection on dare modal open
  useEffect(() => {
    if (isDareActive) {
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }
  }, [isDareActive, api]);

  const [isHovered, setHovered] = useState(false);

  // Track Y position to detect falls
  useEffect(() => {
    if (isCollapsed || block.isRemoved) return;
    
    const startingY = (block.layer * BLOCK_H) + (BLOCK_H / 2);

    const unsubPos = api.position.subscribe((p) => {
      // Sync state for dynamic instability calculation
      if (!blockPhysicsStates.has(block.id)) {
        blockPhysicsStates.set(block.id, { pos: p, rot: [0, 0, 0, 1] });
      } else {
        blockPhysicsStates.get(block.id)!.pos = p;
      }

      // Ground contact: any block originally above layer 1 that falls below 0.5 Y
      const isGroundContact = p[1] <= 0.5 && startingY > 0.6;
      if (isGroundContact) {
        onCollapse();
      }
    });

    const unsubRot = api.quaternion.subscribe((q) => {
      if (!blockPhysicsStates.has(block.id)) {
        blockPhysicsStates.set(block.id, { pos: [0, 0, 0], rot: q });
      } else {
        blockPhysicsStates.get(block.id)!.rot = q;
      }
    });

    return () => {
      unsubPos();
      unsubRot();
      blockPhysicsStates.delete(block.id);
    };
  }, [api.position, api.quaternion, isCollapsed, onCollapse, block.layer, block.isRemoved, block.id]);

  // Removed teleportation logic as we now unmount removed blocks completely

  // Procedural wood grain variations so blocks don't look identical
  const woodColors = ['#C19A6B', '#B5885C', '#A87A51', '#D2A679'];
  const proceduralIndex = (block.layer * 7 + block.position * 13) % woodColors.length;
  
  const baseColor = theme === 'natural' ? woodColors[proceduralIndex] : activeColors[block.tier];
  
  // Highlight accent logic
  const accentColor = theme === 'natural' ? activeColors[block.tier] : baseColor;

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
      <meshStandardMaterial 
        color={baseColor}
        emissive={isHovered ? accentColor : '#000000'}
        emissiveIntensity={isHovered ? (theme === 'natural' ? 0.4 : 0.2) : 0}
        roughness={0.85}
        metalness={0.0}
      />
      <Edges 
        scale={1.001} 
        color={isHovered ? (theme === 'natural' ? accentColor : "#ffffff") : "#000000"} 
        opacity={isHovered ? 0.8 : (theme === 'natural' ? 0.1 : 0.2)} 
        transparent 
      />
    </mesh>
  );
}

// Tower Wrapper
export function Tower({ blocks, onPullBlock, isCollapsed, onCollapse, isDareActive = false }: TowerProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const controlsRef = useRef<any>(null);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cameraZ = isMobile ? 16 : 14;

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

      <Canvas shadows camera={{ position: [14, 12, cameraZ], fov: 35 }}>
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
          isPaused={isDareActive}
          iterations={40} // Lowered slightly so instability resolves faster
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
              isDareActive={isDareActive}
            />
          ))}
          <InstabilityTracker isCollapsed={isCollapsed} blocksRemoved={blocks.filter(b => b.isRemoved).length} />
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
