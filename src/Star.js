import { SphereGeometry, MeshPhongMaterial, Mesh, DirectionalLight } from "three";

export class Star{
    constructor(position, radius){
        this.light = new DirectionalLight(0xffffff,1);
        this.geometry = new SphereGeometry(radius, 32,32);
        this.mtl = new MeshPhongMaterial({
            color:0xffffff,
            emissive:0xffff00,
            emissiveIntensity:2,
            toneMapped: false
        });
        this.mesh = new Mesh(this.geometry, this.mtl);
        this.mesh.position.copy(position);
        this.light.position.copy(position);
    }
    getMesh(){
        return this.mesh;
    }
    getLight(){
        return this.light;
    }
}