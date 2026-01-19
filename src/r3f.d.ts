import { Object3DNode } from '@react-three/fiber';
import { Points, BufferGeometry, BufferAttribute, PointsMaterial, Fog } from 'three';

declare module '@react-three/fiber' {
    interface ThreeElements {
        points: Object3DNode<Points, typeof Points>;
        bufferGeometry: Object3DNode<BufferGeometry, typeof BufferGeometry>;
        bufferAttribute: Object3DNode<BufferAttribute, typeof BufferAttribute>;
        pointsMaterial: Object3DNode<PointsMaterial, typeof PointsMaterial>;
        fog: Object3DNode<Fog, typeof Fog>;
    }
}
