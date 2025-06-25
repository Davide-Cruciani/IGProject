import * as THREE from "three";
import { GameState } from '@/GameState'
import { GameConfigs } from "@/GameConfigs";
import { Planet, Star } from "../Cosmology";


export class Rocket{
    constructor(position, direction, user, size, name) {
        this.SPEED = 15;
        this.MASS = 2;
        this.MAX_DAMAGE = 50;
        this.TTL = 0;

        this.name = name;
        this.size = size;
        this.age = 0;
        this.headGeo = new THREE.SphereGeometry(size);
        this.headMtl = new THREE.MeshPhongMaterial({
            color:0xff0000,
            emissive:0xff0000,
            emissiveIntensity: 2,
            shininess: 100
        });

        this.valid = true;
        this.direction = direction;
        this.direction.normalize();
        
        this.group = new THREE.Group();
        this.group.position.copy(position);

        this.headMesh = new THREE.Mesh(this.headGeo, this.headMtl);
        this.user = user;

        this.group.add(this.headMesh);

        this.bodyGeo = new THREE.CylinderGeometry(size, size, size*1.5, 8, 1, true);
        this.bodyGeo.rotateX(Math.PI / 2);
        this.bodyMtl = new THREE.MeshBasicMaterial({color: 0xffffff});
        this.bodyMesh = new THREE.Mesh(this.bodyGeo, this.bodyMtl);
        this.bodyMesh.position.copy(this.headMesh.position).sub(this.direction);
        this.bodyMesh.lookAt(new THREE.Vector3(0,0,0));
        this.group.add(this.bodyMesh);
    }

    delete(){
        if(this.headMesh){
            this.group.remove(this.headMesh);
            this.headMesh = null;
        }
        if (this.headGeo){
            this.headGeo.dispose();
            this.headGeo = null;
        }

        if(this.headMtl){
            this.headMtl.dispose();
            this.headMtl = null;
        }

        if(this.valid)
            this.valid = false;
        if(this.bodyMesh){
            this.group.remove(this.bodyMesh);
            this.bodyMesh = null;
        }
        if(this.bodyGeo){
            this.bodyGeo.dispose();
            this.bodyGeo = null;
        }
        if(this.bodyMtl){
            this.bodyMtl.dispose();
            this.bodyMtl = null;
        }
        if(this.group){
            GameState.scene.remove(this.group);
            this.group = null;
        }

        this.user.bulletCount--;
    }

    update(){

    }

    getMesh(){ return this.group; };

    setName(name){
        this.name = name;
    }

    getName(){ return this.name; }

    setTTL(time){
        this.TTL = time;
    }

    isValid(){ return this.valid; }

    getHitboxSize(){ return this.size; }

    hit(object){
        if(object === this.user || !this.valid) return {itAppend: false};
        const otherPos = object.getWorldPosition();
        const myPos = this.getWorldPosition();
        if(!myPos) return {itAppend: false};
        const dist = new THREE.Vector3();
        dist.subVectors(otherPos, myPos);

        const collision = dist.length() < this.getHitboxSize() + object.getHitboxSize();
        if(!collision) return {itAppend: false};

        const direction = dist.clone()
        if (direction.lengthSq() > 0) 
            direction.normalize();
        
        const momentum = this.MASS * this.SPEED;
        const energy = this.getDamage();

        const clampedIMP = Math.min(GameConfigs.MAX_IMPULSE, momentum);
        const clampedDMG = Math.min(this.MAX_DAMAGE, energy/object.getMass());

        const report = {
            damage: clampedDMG,
            direction: direction,
            impulse: clampedIMP,
            itAppend: true
        }
        this.valid = false;
        this.delete();
        return report; 
    }
}