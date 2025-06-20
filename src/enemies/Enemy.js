import { MTLLoader, OBJLoader} from "three/examples/jsm/Addons.js";
import { Vector3 } from "three";


export class Enemy{
    constructor(name, position, scene){
        this.scene = scene;
        this.dead = false;
        this.path = "./assets/Various/";
        const mtlLoader = new MTLLoader();
                mtlLoader.setPath(this.path);
                mtlLoader.load(name+".mtl", 
                    (mtl)=>{
                        mtl.preload();
                        const objectLoader = new OBJLoader();
                        objectLoader.setPath(this.path);
                        if (!mtl){
                            console.log('Material not found');
                            throw new Error;
                        }
                        objectLoader.setMaterials(mtl);
                        objectLoader.load(name+".obj",
                            (obj)=>{
                                switch (name){
                                    case "spaceship1":
                                        obj.scale.set(0.5,0.5,0.5);
                                        obj.rotation.set(Math.PI/2,0,0);
                                        break;
                                    case "spaceship2":
                                        obj.scale.set(0.5,0.5,0.5);
                                        obj.rotation.set(-Math.PI/2,0,0);
                                        break;

                                    case "spaceship3":
                                        obj.scale.set(0.5,0.5,0.5);
                                        obj.rotation.set(Math.PI/2,0,0);
                                        break;

                                    default:
                                        console.warn("Ship type unknown");
                                        break;
                                }
                                
                                this.obj = obj;
                                this.obj.position.copy(position);
                                this.loaded = true;
                                scene.add(this.obj);
                                console.log("Enemy loaded")
                            }, 
                            (err)=>{ console.log(err); }
                        );
                    }, 
                    (err)=>{ console.log(err); }
                )
    }
    addChild(child){ this.obj.add(child); }
    getMesh(){ return this.obj; }
    isDead(){ return this.dead; }
    getWorldPosition(){ 
        return this.obj.getWorldPosition();
    }
    isSeen(object, coneSize, maxDistance){
        const objectPos = new Vector3();
        const currentPos = new Vector3();
        const forward = new Vector3();
        const objectVector = new Vector3();

        object.getWorldPosition(objectPos);

        this.obj.getWorldDirection(forward);
        this.obj.getWorldPosition(currentPos);
        objectVector.subVectors(objectPos, currentPos);

        const angle = forward.angleTo(objectVector);
        if (angle < coneSize && objectVector.length() < maxDistance)
            return true;
        else return false;
    }
}