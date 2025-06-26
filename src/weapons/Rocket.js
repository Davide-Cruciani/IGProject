import * as THREE from "three";
import { GameState } from '@/GameState'
import { GameConfigs } from "@/GameConfigs";
import { Planet, Star } from "../Cosmology";


export class Rocket{
    constructor(position, direction, user, size, name) {
        this.SPEED = 10;
        this.MASS = 2;
        this.BLAST = 15;
        this.DAMAGE = 200;
        this.MAX_DAMAGE = 200;
        this.EXP_RADIUS = 7;
        this.EXPLOSION_TIME = 0.75;
        this.DETECTION_RANGE = 70;
        this.BODY_LEN = 1.5
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
        this.headMesh = new THREE.Mesh(this.headGeo, this.headMtl);
        this.headMesh.position.copy(position);

        this.bodyGeo = new THREE.CylinderGeometry(size, size, this.BODY_LEN, 8, 1, true);
        this.bodyMtl = new THREE.MeshBasicMaterial({color: 0xffffff});
        this.bodyMesh = new THREE.Mesh(this.bodyGeo, this.bodyMtl);
        this.bodyMesh.position.set(0, -(this.BODY_LEN/2)+size/4, 0);
        this.headMesh.add(this.bodyMesh);

        this.bodyMesh.rotation.set(0,0,0);

        this.user = user;

        this.valid = true;
        this.direction = direction;
        this.direction.normalize();

        this.exploded = false;
        this.explosionStart = 0;

        

        this.target = null;
        this.secondTry = false;

        this.currentHeading = null;

        this.checkForTarget();

    }

    checkForTarget(){
        var bestDist = 100000;
        const position = this.getWorldPosition();
        GameState.npcs.forEach((npc)=>{
            const npcPos = npc.getWorldPosition();
            const dist = new THREE.Vector3().subVectors(npcPos, position);
            const distance = dist.length()
            if(distance < this.DETECTION_RANGE){
                if(distance < bestDist){
                    bestDist = distance;
                    this.target = npc;
                }
            }
        })
        if(this.target)
            console.log("Target looked: ", this.target.getName());
    }

    checkCelestial(celestial){
        if(!(celestial instanceof Planet) && !(celestial instanceof Star)) return;
        const myPos = this.getWorldPosition();
        if(!myPos) return;
        const celestialPos = celestial.getWorldPosition();
        const distance = new THREE.Vector3();
        distance.subVectors(celestialPos, myPos);
        if (distance.length() < celestial.getHitboxSize() + this.getHitboxSize()){
            this.delete();
        }
    }

    getWorldDirection(){
        if(!this.headMesh) return new THREE.Vector3();
        const direction = new Vector3(0, 1, 0);
        direction.applyQuaternion(this.headMesh.quaternion);
        direction.normalize();
        return direction;
    }

    getWorldPosition(){
        if(!this.headMesh) return new THREE.Vector3();;
        const res = new THREE.Vector3();
        this.headMesh.getWorldPosition(res);
        return res;
    }

    delete(){
        if(this.valid)
            this.valid = false;
        
        if(this.bodyMesh){
            this.headMesh.remove(this.bodyMesh);
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

        if (this.headGeo){
            this.headGeo.dispose();
            this.headGeo = null;
        }

        if(this.headMtl){
            this.headMtl.dispose();
            this.headMtl = null;
        }

        if(this.headMesh){
            GameState.scene.remove(this.headMesh);
            this.headMesh = null;
        }

        this.user.bulletCount--;
    }

    update(dt){
        const time = dt * GameState.timeDial;
        if (!this.valid && !this.exploded) {
            this.delete();
            return;
        }

        if(this.exploded){
            this.age += dt;
            if(this.age < this.EXPLOSION_TIME){
                const scale = THREE.MathUtils.lerp(0.3, this.EXP_RADIUS, Math.log2(this.age / this.EXPLOSION_TIME));
                this.headMesh.scale.set(scale, scale, scale);

                const alpha = 1 - Math.pow(this.age / this.EXPLOSION_TIME,2);
                this.headMtl.color.setRGB(1, alpha * 0.6, alpha * 0.2);
                this.headMtl.emissive.setRGB(1, alpha * 0.3, alpha * 0.1);
                this.headMtl.needsUpdate = true;
            }else{
                this.delete();
            }
            return;
        }
        
        if(this.age < 5){
            const movement = this.direction.clone();
            movement.multiplyScalar(this.SPEED * time);
            this.headMesh.position.add(movement);
            this.age += time;
        }

        if(this.age < this.TTL){
            const movement = this.direction.clone();
            if(!this.target  || this.target.isDead()){
                if(!this.secondTry && this.age > this.TTL*2/3){
                    this.checkForTarget()
                    this.secondTry = true;
                    if(this.target){
                        const targetPos = this.target.getWorldPosition();
                        const newDir = new THREE.Vector3().subVectors(targetPos, this.headMesh.position);
                        if(newDir.lengthSq() > 0)
                            this.direction = newDir.normalize();
                    }
                }

                const currentForward = new THREE.Vector3(0, 1, 0).applyQuaternion(this.headMesh.quaternion);
                const desiredDirection = this.direction.clone().normalize();
                const quat = new THREE.Quaternion().setFromUnitVectors(currentForward, desiredDirection);
                quat.multiply(this.headMesh.quaternion);
                this.headMesh.quaternion.slerp(quat, 0.2);

                movement.multiplyScalar(this.SPEED * time);
                this.headMesh.position.add(movement);
                this.age += time;
            }else{
                const targetPos = this.target.getWorldPosition();
                if(!this.currentHeading && !this.target.isDead())
                    this.currentHeading = targetPos.clone();
                else if(!this.target.isDead())
                    this.currentHeading.lerp(targetPos, 0.1);

                const targetDir = new THREE.Vector3().subVectors(this.currentHeading, this.headMesh.position);
                const distanceToTarget = targetDir.length();

                if (distanceToTarget > 0.5) { 
                    targetDir.normalize();
                    this.direction.lerp(targetDir, 0.1).normalize();

                    const currentForward = new THREE.Vector3(0, 1, 0).applyQuaternion(this.headMesh.quaternion);
                    const quat = new THREE.Quaternion().setFromUnitVectors(currentForward, targetDir);
                    quat.multiply(this.headMesh.quaternion)
                    this.headMesh.quaternion.slerp(quat, 0.2); 

                    this.headMesh.position.addScaledVector(targetDir, this.SPEED * time);
                }
            }

        }else{
            this.detonate();
        }
        
    }

    getMesh(){ return this.headMesh; };

    setName(name){
        this.name = name;
    }

    getName(){ return this.name; }

    setTTL(time){
        this.TTL = time;
    }

    isValid(){ return this.valid; }

    getHitboxSize(){ 
        if(this.exploded) return this.EXP_RADIUS;
        return this.size; 
    }

    hit(object){
        if(object === this.user || !this.valid) return {itAppend: false};
        const otherPos = object.getWorldPosition();
        const myPos = this.getWorldPosition();
        if(!myPos) return {itAppend: false};
        const dist = new THREE.Vector3();
        dist.subVectors(otherPos, myPos);

        const distance = dist.length();

        // console.log("Hit check:", distance, this.getHitboxSize(), object.getHitboxSize());

        const collision = distance < this.getHitboxSize() + object.getHitboxSize();
        if(!collision) return {itAppend: false};
        // console.log('boom');

        this.detonate();

        const direction = dist.clone()
        if (direction.lengthSq() > 0) 
            direction.normalize();
        
        const momentum = this.getBlast()/(distance*distance);
        const damage = this.getDamage()/(distance*distance);

        const clampedIMP = Math.min(GameConfigs.MAX_IMPULSE, momentum);
        const clampedDMG = Math.min(this.MAX_DAMAGE, damage);

        const report = {
            damage: clampedDMG,
            direction: direction,
            impulse: clampedIMP,
            itAppend: true
        }
        return report; 
    }

    getDamage(){
        return this.DAMAGE;
    }

    getBlast(){
        return this.BLAST;
    }

    detonate(){
        this.size = 0.01;
        this.exploded = true;
        this.age = 0;
        if(this.bodyGeo){
            this.bodyGeo.dispose();
            this.bodyGeo = null;
        }
        if(this.bodyMtl){
            this.bodyMtl.dispose();
            this.bodyMtl = null;
        }
        if(this.bodyMesh){
            this.headMesh.remove(this.bodyMesh);
            this.bodyMesh = null;
        }

        this.headMtl.color.setRGB(1, 0.6, 0.2);
        this.headMtl.emissive.setRGB(1, 0.3, 0.1);
        this.headMtl.needsUpdate = true;

    }
}