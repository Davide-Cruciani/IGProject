
import { GLTFLoader } from "three/examples/jsm/Addons.js";


export class Enemy{
    constructor(path, position, scene){
        const loader = new GLTFLoader();
        this.loaded = false;
        this.obj = null;
        this.scene = scene
        loader.load(
            path, 
            (obj)=>{
                this.model = obj.scene;
                this.model.scale.set(0.1,0.1,0.1);
                this.model.position.set(position);
                scene.add(this.model);
                this.loaded = true;
            },
            (xhr)=>{console.log((xhr.loaded/xhr.total*100) + '% loaded');}, 
            (err)=>{console.error("Loading enemy mesh error: ", err)}
        );
    };
    getMesh(){ return this.model; };
}