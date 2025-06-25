import { SphereGeometry, Mesh, MeshPhongMaterial, Vector3} from "three";
import { GameState } from '@/GameState'
import { Configs } from "@/Configs";
import { Planet, Star } from "../Cosmology";

export class Bullet{
    constructor(position, direction, user, size, name) {
        this.SPEED = 15;
        this.MASS = 2;
        this.MAX_DAMAGE = 50;
        this.TTL = 0;

        this.name = name;
        this.size = size;
        this.age = 0;
        this.geometry = new SphereGeometry(size);
        this.material = new MeshPhongMaterial({
            color:0xffff00,
        });

        this.valid = true;

        this.mesh = new Mesh(this.geometry, this.material);
        this.direction = direction;
        this.direction.normalize();
        this.mesh.position.copy(position);
        this.user = user;
    }

    getMesh(){ return this.mesh; };

    setName(name){
        this.name = name;
    }

    getVelocity(){
        const speed = this.direction.clone();
        speed.multiplyScalar(this.SPEED);
        return speed;
    }

    getName(){ return this.name; }

    setTTL(time){
        this.TTL = time;
    }

    update(time){
        if (!this.valid) {
            this.delete();
            return;
        }
        if(this.age < this.TTL){
            this.mesh.position.addScaledVector(this.direction, this.SPEED*time);
            this.age += time;
        }else{
            this.valid = false;
            this.delete();
        }
    }

    getWorldPosition(){
        if(!this.mesh) return;
        const res = new Vector3();
        this.mesh.getWorldPosition(res);
        return res;
    }

    isValid(){ return this.valid; }

    delete(){
        if(this.mesh){
            GameState.scene.remove(this.mesh);
            this.mesh = null;
        }
        if (this.geometry){
            this.geometry.dispose();
            this.geometry = null;
        }

        if(this.material){
            this.material.dispose();
            this.material = null;
        }

        this.user.bulletCount--;
        if(this.valid)
            this.valid = false;
    }

    getDamage(){ return this.MASS * this.SPEED*this.SPEED *0.5; }
    getImpulse(){ return this.MASS * this.SPEED*this.SPEED/2; }
    getHitboxSize(){ return this.size; }

    checkCelestial(celestial){
        if(!(celestial instanceof Planet) && !(celestial instanceof Star)) return;
        const myPos = this.getWorldPosition();
        if(!myPos) return;
        const celestialPos = celestial.getWorldPosition();
        const distance = new Vector3();
        distance.subVectors(celestialPos, myPos);
        if (distance < celestial.getHitboxSize() + this.getHitboxSize()){
            this.delete();
        }
    }

    hit(object){
        if(object === this.user || !this.valid) return {itAppend: false};
        const otherPos = object.getWorldPosition();
        const myPos = this.getWorldPosition();
        if(!myPos) return {itAppend: false};
        const dist = new Vector3();
        dist.subVectors(otherPos, myPos);

        const collision = dist.length() < this.getHitboxSize() + object.getHitboxSize();
        if(!collision) return {itAppend: false};

        const direction = dist.clone()
        if (direction.lengthSq() > 0) 
            direction.normalize();
        
        const momentum = this.MASS * this.SPEED;
        const energy = this.getDamage();

        const clampedIMP = Math.min(Configs.MAX_IMPULSE, momentum);
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