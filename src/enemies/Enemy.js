
import { MTLLoader, OBJLoader } from "three/examples/jsm/Addons.js";


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
                                obj.scale.set(0.1,0.1,0.1);
                                obj.rotation.set(Math.PI/2,0,0)
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
    };
    getMesh(){ return this.obj; };
    isDead(){ return this.dead; };
}