import { OBJLoader } from "three/examples/jsm/Addons.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";
import { Bullet } from "./bullet";
import { Vector3, ArrowHelper, Clock } from "three";


export class Character{
    constructor(path, scene, configs){
        this.ACC = configs['acceleration'];
        this.TEAMCOLOR = 0x0000ff;
        this.ANG_SPEED = configs['angular_speed'];
        this.MAX_SPEED = configs['max_speed'];
        this.BASE_DRAG = configs['base_drag'];
        this.BREAKS_DRAG = configs['breaks_drag'];
        this.PRIMARY_CD = 0.5;
        this.BULLET_TTL = 4;
        
        this.scene = scene;

        this.loaded = false;
        this.vel = 0;
        this.angVel = 0;

        this.bulletCount = 0;
        this.bulletList = [];
        this.timeKeeper = 0;
        this.timeLastBullet = 0;

        const mtlLoader = new MTLLoader();
        mtlLoader.setPath(path+"/");
        mtlLoader.load('playerShip.mtl', 
            (mtl)=>{
                mtl.preload();
                const objectLoader = new OBJLoader();
                objectLoader.setPath(path+'/');
                objectLoader.setMaterials(mtl);
                objectLoader.load('playerShip.obj',
                    (obj)=>{
                        obj.scale.set(0.5,0.5,0.5);
                        obj.traverse((child)=>{
                            if(child.isMesh) child.geometry.rotateX(Math.PI/2);
                        })
                        this.obj = obj;
                        scene.add(obj);
                        this.loaded = true;
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

        var primary = keys['mb0'];

        if (w>0) this.vel += this.ACC*((a===2)? 0.1: 1) * time;
        else if(s>0) this.vel -= this.ACC*((d===2)? 0.1: 1) * time;
        
        if (a>0) this.angVel = this.ANG_SPEED*((w===2)? 0.1: 1) * time;
        else if(d>0) this.angVel = -this.ANG_SPEED*((s===2)? 0.1: 1) * time;
        else this.angVel = 0;
        
        this.vel = Math.min(this.MAX_SPEED, this.vel);
        this.angVel = Math.min(this.MAX_SPEED, this.angVel);

        var drag = (keys['c'])? this.BREAKS_DRAG: this.BASE_DRAG; 

        this.vel /= drag;

        this.obj.rotateZ(this.angVel * time);
        this.obj.translateY(this.vel * time);

        if (primary === 1){
            if (this.timeKeeper - this.timeLastBullet > this.PRIMARY_CD){
                this.shootPrimary()
                console.log('Fired shot, Total Count: ', this.bulletCount);
                this.timeLastBullet = this.timeKeeper;
            }else console.log("Bullet cooldown");
        }
        
    }

    shootPrimary(){
        var direction = new Vector3(0,1,0);
        direction.applyQuaternion(this.obj.quaternion);
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

    add(child){
        this.obj.add(child);
    }
}