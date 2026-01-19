// @ts-nocheck
import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';

// Extend R3F elements if needed, but usually works with automatic declaration merging.
// We remove unused imports 'Color', 'Vector2' to fix lints.

const WaveMesh = () => {
    const meshRef = useRef<any>(null);
    const { mouse } = useThree();

    // Create a grid of points
    const count = 100;
    const sep = 3;

    const positions = useMemo(() => {
        let positions = [];
        for (let xi = 0; xi < count; xi++) {
            for (let zi = 0; zi < count; zi++) {
                let x = sep * (xi - count / 2);
                let z = sep * (zi - count / 2);
                let y = 0;
                positions.push(x, y, z);
            }
        }
        return new Float32Array(positions);
    }, [count, sep]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const { clock } = state;
        const t = clock.getElapsedTime() * 0.5;

        // Smooth mouse interpolation
        const mouseX = MathUtils.lerp(0, mouse.x * 20, 0.1);
        const mouseY = MathUtils.lerp(0, mouse.y * 20, 0.1);

        const positions = meshRef.current.geometry.attributes.position.array;

        let i = 0;
        for (let xi = 0; xi < count; xi++) {
            for (let zi = 0; zi < count; zi++) {
                const x = sep * (xi - count / 2);
                const z = sep * (zi - count / 2);

                // Distance from "mouse" center (simulated effects)
                const dist = Math.sqrt((x - mouseX) ** 2 + (z - mouseY) ** 2);

                // Wave formula
                // base wave + mouse influence
                const y = Math.sin(x * 0.1 + t) * Math.cos(z * 0.1 + t) * 2
                    + Math.sin(dist * 0.2 - t * 2) * 2 * Math.exp(-dist * 0.05);

                positions[i + 1] = y; // Update Y
                i += 3;
            }
        }
        meshRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={positions}
                    count={positions.length / 3}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.2}
                color="#7000ff"
                transparent
                opacity={0.8}
                sizeAttenuation
            />
        </points>
    );
};

export const InteractiveBackground = () => {
    return (
        <div className="fixed inset-0 z-0 bg-[#030305]">
            <Canvas camera={{ position: [0, 20, 25], fov: 55 }}>
                {/* Visual debug: Ensure points are thick and purple */}
                <WaveMesh />
            </Canvas>
        </div>
    );
};
