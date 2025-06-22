import { MTLLoader, OBJLoader} from "three/examples/jsm/Addons.js";
import { Vector3, Quaternion } from "three";
import { AlertIcon } from "../UserInterface";
export class Enemy{
    constructor(name, position, scene, team){
        this.scene = scene;
        this.dead = false;
        this.team = team;
        this.path = "./assets/Various/";
        this.loaded = false;
        this.SIGHT_CONE = 0;
        const mtlLoader = new MTLLoader();
                mtlLoader.setPath(this.path);
                mtlLoader.load(name+".mtl", 
                    (mtl)=>{
                        this.mlt = mtl;
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
                                
                                obj.scale.set(0.5,0.5,0.5);
                                obj.rotation.set(Math.PI/2,0,0);
                                
                                obj.position.copy(position);
                                this.obj = obj;
                                this.loaded = true;
                                scene.add(obj);

                                this.alert = new AlertIcon();
                                this.obj.add(this.alert.getElement());
                                this.alert.setVisible(false);
                                console.log("Enemy loaded");
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
        return this.obj.getWorldPosition(new Vector3());
    }
    getWorldDirection(){
        if (!this.loaded) return new Vector3(0,1,0);
        const forward = new Vector3(0,0,1)
        forward.applyQuaternion(this.obj.getWorldQuaternion());
        return forward.normalize();
    }
    isSeen(object){
        if (!this.obj || !this.loaded || !object.loaded || !object) return -1;
        this.obj.updateMatrixWorld(true);
        object.getMesh().updateMatrixWorld(true);
        
        const quaternion = new Quaternion();
        this.obj.getWorldQuaternion(quaternion);
        
        const objectPos = new Vector3();
        const currentPos = new Vector3();
        const forward = new Vector3(0,0,1);
        forward.applyQuaternion(quaternion).normalize();
        const objectVector = new Vector3();
        

        object.getMesh().getWorldPosition(objectPos);
        this.obj.getWorldPosition(currentPos);
        objectVector.subVectors(objectPos, currentPos);
        
        const angleCosine = Math.cos(this.SIGHT_CONE);
        const dot = forward.clone().normalize().dot(objectVector.clone().normalize());
        const distance = objectVector.length();

        if (dot > angleCosine)
            return distance;
        else return -1;
    }
    setTeam(team){ this.team = team; }
    getTeam(){ return this.team; }
    destroy(){
        if(this.mtl){
            for (const material of Object.values(this.mtl.materials)){
                material.dispose?.();
            }
            this.mlt = null;
        }
        if(this.obj){
            this.scene.remove(this.obj);
            this.obj.traverse((child)=>{
                if(child.isMesh){
                    child.geometry.dispose();
                    if(Array.isArray(child.material)){
                        child.material.dispose?.();
                    }
                }
            });
            this.obj = null;
        }
    }
}