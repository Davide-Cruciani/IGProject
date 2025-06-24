import { OBJLoader } from "three/examples/jsm/Addons.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";
import { Vector3, Object3D, Quaternion} from "three";
import * as WEAPON from "./weapons/Weapons";
import { GameState } from "@/GameState";
import { PeripheralsInputs } from "./PeripheralsInputs";


export class Character{
    constructor(scene, camera, position){
        this.ACC = 3;
        this.ANG_SPEED = 10;
        this.MAX_SPEED = 10;
        this.BASE_DRAG = 1.005;
        this.BREAKS_DRAG = 1.2;
        this.SENSITIVITY = 0.003;
        this.MAX_PITCH = Math.PI / 2 * 0.98; 
        
        this.weaponList = []
        this.weaponList.push(new WEAPON.Shotgun(this,scene));
        this.weaponList.push(new WEAPON.SimpleGun(this, scene))

        this.selectedWeapon = 0;
        
        this.maxHp = 100;
        this.currentHp = 100;

        this.team = 'player';    
        this.scene = scene;
        this.camera = camera;
        this.yaw = 0;
        this.pitch = 0;

        this.loaded = false;
        this.vel = 0;
        this.latVel = 0;
        

        const path = "assets/PlayerCharacter"

        const mtlLoader = new MTLLoader();
        mtlLoader.setPath(path+"/");
        mtlLoader.load('SciFi_Fighter_AK5.mtl', 
            (mtl)=>{
                mtl.preload();
                const objectLoader = new OBJLoader();
                objectLoader.setPath(path+'/');
                objectLoader.setMaterials(mtl);
                objectLoader.load('SciFi_Fighter_AK5.obj',
                    (obj)=>{
                        obj.scale.set(0.003,0.003,0.003);
                        obj.traverse((child)=>{
                            if(child.isMesh) child.geometry.rotateX(Math.PI/2);
                        })
                        this.obj = obj;
                        this.loaded = true;
                        this.root = new Object3D();
                        this.root.position.copy(position);

                        this.root.add(this.obj);

                        scene.add(this.root);
                    },
                    undefined, 
                    (err)=>{ console.log(err); }
                );
            },
            undefined, 
            (err)=>{ console.log(err); }
        )
    };

    update(time){
        
        this.timeKeeper += time;

        this.yaw -= PeripheralsInputs['mouseX'] * this.SENSITIVITY;
        this.pitch -= PeripheralsInputs['mouseY'] * this.SENSITIVITY;

        this.pitch = Math.max(-this.MAX_PITCH + (Math.PI/12), Math.min(this.MAX_PITCH, this.pitch));


        const yawQuat = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), this.yaw);
        const pitchQuat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), this.pitch);

        const combinedQuat = new Quaternion().multiplyQuaternions(yawQuat, pitchQuat);

        this.root.quaternion.copy(combinedQuat);


        this.handleCamera(combinedQuat);

        const key_q = PeripheralsInputs['q'];
        const key_e = PeripheralsInputs['e'];

        if (key_q === 1) {
            this.selectedWeapon--;
            PeripheralsInputs['q'] = 0;
        }
        if (key_e === 1){
            this.selectedWeapon++;
            PeripheralsInputs['e'] = 0;
        }
        if(this.selectedWeapon >= this.weaponList.length) this.selectedWeapon = 0;
        if(this.selectedWeapon < 0) this.selectedWeapon = this.weaponList.length-1;

        const key_a = PeripheralsInputs['a'];
        const key_d = PeripheralsInputs['d'];
        const key_w = PeripheralsInputs['w'];
        const key_s = PeripheralsInputs['s'];
        const key_c = PeripheralsInputs['c'];



        const firePrimary = PeripheralsInputs['mb0'];

        this.movement(key_a,key_d,key_s,key_w,key_c,time);

        if (firePrimary === 1)
            this.fireSelectedWeapon();
        
    }

    fireSelectedWeapon(){
        this.weaponList[this.selectedWeapon].shoot();
    }

    getEquippedWeapon(){
        return this.weaponList[this.selectedWeapon];
    }

    handleCamera(combinedQuat){
        const shipPos = this.root.getWorldPosition(new Vector3());

        const baseOffset = new Vector3(0,-5,3);
        const cameraOffset = baseOffset.clone().multiplyScalar(GameState.zoom.level);
        cameraOffset.applyQuaternion(combinedQuat);

        const cameraPos = shipPos.clone().add(cameraOffset);
        this.camera.position.copy(cameraPos);
        
        const forward = new Vector3(0,1,0);
        forward.applyQuaternion(combinedQuat);

        const lookPos = shipPos.clone().add(forward.multiplyScalar(10));

        this.camera.up.set(0,0,1);
        this.camera.lookAt(lookPos);
    }

    movement(keyA, keyD, keyS, keyW, keyC, time){
        if (keyD>0) this.latVel += this.ACC*((keyD===2)? 0.1: 1) * time;
        else if(keyA>0) this.latVel -= this.ACC*((keyA===2)? 0.1: 1) * time;
        if (keyW>0) this.vel += this.ACC*((keyW===2)? 0.1: 1) * time;
        else if(keyS>0) this.vel -= this.ACC*((keyS===2)? 0.1: 1) * time;
        
        this.latVel = Math.min(this.MAX_SPEED, this.latVel);
        this.vel = Math.min(this.MAX_SPEED, this.vel);
        var drag = (keyC)? this.BREAKS_DRAG: this.BASE_DRAG;
        
        this.latVel /= drag;
        this.vel /= drag;
        
        var right = new Vector3(1, 0, 0);
        var forward = new Vector3(0, 1, 0)
        
        
        forward.applyQuaternion(this.root.quaternion);
        right.applyQuaternion(this.root.quaternion);
        
        this.root.position.addScaledVector(forward, this.vel * time);
        this.root.position.addScaledVector(right, this.latVel * time);
    }

    getMesh(){ return this.obj; }

    add(child){
        this.obj.add(child);
    }

    getVelocity(){
        return Math.sqrt(this.latVel*this.latVel + this.vel*this.vel);
    }

    getWorldPosition(){ return this.obj.getWorldPosition(new Vector3()); }
    getWorldDirection(){
        const direction = new Vector3(0, 1, 0); // Local forward
        direction.applyQuaternion(this.root.quaternion); // Apply combined rotation
        direction.normalize();
        return direction;
    }
    getTeam(){ return this.team; }
    getHealth(){ return this.currentHp; }
    getMaxHealth() {return this.maxHp; }
}