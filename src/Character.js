import { OBJLoader } from "three/examples/jsm/Addons.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";

export class Character{
    constructor(path, scene, configs){
        this.ACC = configs['acceleration'];
        this.ANG_ACC = configs['angular_acceleration'];
        this.MAX_SPEED = configs['max_speed'];
        this.BASE_DRAG = configs['base_drag'];
        this.BREAKS_DRAG = configs['breaks_drag'];
        this.vel = 0;
        this.angVel = 0;
        this.loaded = false;
        
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
        var a = keys['a'];
        var d = keys['d'];
        var w = keys['w'];
        var s = keys['s'];

        if (w>0) this.vel += this.ACC*((a===2)? 0.1: 1) * time;
        else if(s>0) this.vel -= this.ACC*((d===2)? 0.1: 1) * time;
        
        if (a>0) this.angVel += this.ANG_ACC*((w===2)? 0.1: 1) * time;
        else if(d>0) this.angVel -= this.ANG_ACC*((s===2)? 0.1: 1) * time;
        
        this.vel = Math.min(this.MAX_SPEED, this.vel);
        this.angVel = Math.min(this.MAX_SPEED/100, this.angVel);

        var drag = (keys['c'])? this.BREAKS_DRAG: this.BASE_DRAG; 

        this.vel /= drag;
        this.angVel /= drag;

        this.obj.rotateZ(this.angVel * time);
        this.obj.translateY(this.vel * time);
    }

    add(child){
        this.obj.add(child);
    }
}