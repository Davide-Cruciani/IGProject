import { SphereGeometry, TextureLoader, MeshBasicMaterial, Mesh } from "three";
import * as THREE from 'three'

export class Skysphere{
    constructor(){
        const loader = new TextureLoader();
        const texture = loader.load('assets/skysphere.jpg', 
            ()=>{console.log('Skysphere texture loaded');},
            undefined,
            (err)=>{console.log('Skysphere texture err: ', err);}
        );
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.encoding = THREE.sRGBEncoding;
        const geometry = new SphereGeometry(500, 60, 40);
        geometry.scale(-1,1,1);
        const material = new MeshBasicMaterial({
            map:texture,
            side: THREE.BackSide,
            toneMapped: false,
        });
        this.mesh = new Mesh(geometry, material);
    }
    getMesh(){
        return this.mesh;
    }
}