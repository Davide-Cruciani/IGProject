import { OBJLoader } from "three/examples/jsm/Addons.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";

const BASE_DRAG = 1.005;
const BREAKS_DRAG = 2;
const MAX_SPEED = 2;

export class Character{
    constructor(path, scene){
        this.velocity = 0;
        this.angVelocity = 0;
        this.acceleration = 0.01;
        this.angAcceleration = 0.001; 
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

        if (w>0) this.velocity += this.acceleration*((a===2)? 0.1: 1) * time;
        else if(s>0) this.velocity -= this.acceleration*((d===2)? 0.1: 1) * time;
        
        if (a>0) this.angVelocity += this.angAcceleration*((w===2)? 0.1: 1) * time;
        else if(d>0) this.angVelocity -= this.angAcceleration*((s===2)? 0.1: 1) * time;
        
        this.velocity = Math.min(MAX_SPEED, this.velocity);
        this.angVelocity = Math.min(MAX_SPEED/100, this.angVelocity);

        var drag = (keys['c'])? BREAKS_DRAG: BASE_DRAG; 

        this.velocity /= drag;
        this.angVelocity /= drag;

        this.obj.rotateZ(this.angVelocity * time);
        this.obj.translateY(this.velocity * time);
    }

    add(child){
        this.obj.add(child);
    }
}