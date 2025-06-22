import { OBJLoader } from "three/examples/jsm/Addons.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";
import { Bullet } from "./Bullet";
import { Vector3, Clock, Object3D, Quaternion} from "three";


export class Character{
    constructor(scene, camera){
        this.ACC = 1.5;
        this.TEAMCOLOR = 0x00ff00;
        this.ANG_SPEED = 10;
        this.MAX_SPEED = 3
        this.BASE_DRAG = 1.005;
        this.BREAKS_DRAG = 1.2;
        this.SENSITIVITY = 0.003;
        this.PRIMARY_CD = 0.5;
        this.BULLET_TTL = 4;
    
        this.team = 'player';    
        this.scene = scene;

        this.loaded = false;
        this.vel = 0;
        this.latVel = 0;

        this.bulletCount = 0;
        this.bulletList = [];
        this.timeKeeper = 0;
        this.timeLastBullet = 0;

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
                        this.pitchObj = new Object3D();

                        this.root.add(this.pitchObj);
                        this.pitchObj.add(this.obj);
                        this.pitchObj.add(camera);

                        scene.add(this.root);
                        camera.position.set(0,-5,3);
                        var offset = new Vector3(0,0,3)
                        camera.lookAt(offset.add(this.pitchObj.position));
                    },
                    undefined, 
                    (err)=>{ console.log(err); }
                );
            },
            undefined, 
            (err)=>{ console.log(err); }
        )
    };

    update(keys, time){
        
        this.timeKeeper += time;

        var a = keys['a'];
        var d = keys['d'];
        var w = keys['w'];
        var s = keys['s'];
        var c = keys['c'];

        var mouseX = keys['mouseX'];
        var mouseY = keys['mouseY'];

        if (mouseX !== 0) this.root.rotation.z -= mouseX * this.SENSITIVITY;
        if (mouseY !== 0) this.pitchObj.rotation.x -= mouseY * this.SENSITIVITY;

        var primary = keys['mb0'];

        this.movement(a,d,s,w,c,time);

        if (primary === 1){
            if (this.timeKeeper - this.timeLastBullet > this.PRIMARY_CD){
                this.shootPrimary()
                this.timeLastBullet = this.timeKeeper;
            }
        }
        
    }

    shootPrimary(){
        var direction = new Vector3(0, 1, 0);
        var directionQuaternion = new Quaternion();
        directionQuaternion.multiplyQuaternions(this.root.quaternion, this.pitchObj.quaternion);

        direction.applyQuaternion(directionQuaternion);
        direction.normalize();

        var position = new Vector3();
        this.obj.getWorldPosition(position)

        var bullet = new Bullet(position, direction, this.TEAMCOLOR, this);
        const bulletRecord = {
            "timer": new Clock(true),
            "ttl": this.BULLET_TTL,
            "obj": bullet,
        }
        window.bulletList.push(bulletRecord);
        this.bulletCount++;
        this.scene.add(bullet.getMesh());
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
        
        const combinedQuat = new Quaternion();
        combinedQuat.multiplyQuaternions(this.root.quaternion, this.pitchObj.quaternion);
        
        forward.applyQuaternion(combinedQuat);
        right.applyQuaternion(combinedQuat);
        
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
    getWorldDirection(){ return this.obj.getWorldDirection(new Vector3()); }
    getTeam(){ return this.team; }
}