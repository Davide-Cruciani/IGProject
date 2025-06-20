import { SphereGeometry, MeshPhongMaterial, Mesh, DirectionalLight, Group } from "three";

export class Star{
    constructor(position, radius){
        this.light = new DirectionalLight(0xffffff,1);
        this.geometry = new SphereGeometry(radius, 32,32);
        this.mtl = new MeshPhongMaterial({
            color:0xffc100,
            emissive:0xffc100,
            emissiveIntensity:2,
            toneMapped: false
        });
        this.mesh = new Mesh(this.geometry, this.mtl);
        this.mesh.position.copy(position);
        this.light.position.copy(position);
        this.group = new Group();
        this.group.add(this.light);
        this.group.add(this.mesh);
    }
    getGroup(){
        return this.group;
    }
}