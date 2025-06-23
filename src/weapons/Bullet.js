import { SphereGeometry, Mesh, MeshPhongMaterial, Vector3} from "three";
import { GameState } from '@/GameState'

export class Bullet{
    constructor(position, direction, user) {
        this.SPEED = 10;

        this.geometry = new SphereGeometry(0.05);
        this.material = new MeshPhongMaterial({
            color:0x00ff00,
        });
        this.mesh = new Mesh(this.geometry, this.material);
        this.direction = direction;
        this.direction.normalize();
        this.mesh.position.copy(position);
        this.user = user;
    }

    getMesh(){ return this.mesh; };

    update(time){
        // const gravity = this.computeGravity();
        // const gravMag = gravity.length();
        // const gravVers = gravity.clone().normalize();
        // this.mesh.translateOnAxis(gravVers,gravMag*time);
        this.mesh.translateOnAxis(this.direction, this.SPEED*time);
    }

    getWorldPosition(){
        const res = new Vector3();
        this.mesh.getWorldPosition(res);
        return res;
    }

    computeGravity(){
        const sumVector = new Vector3();
        const currentPos = this.getWorldPosition();
        GameState.planets.forEach((planet)=>{
            const planetPos = planet.getWorldPosition();

            const vectorToPlanet = new Vector3();
            vectorToPlanet.subVectors(planetPos, currentPos);

            const distance = vectorToPlanet.length();
            if (distance < 0 || isNaN(distance)) return;
            const force = planet.getMass() / Math.max(distance*distance,1);

            sumVector.add(vectorToPlanet.clone().normalize().multiplyScalar(force));
        })
        return sumVector;
    }

    delete(){
        if (this.geometry){
            this.geometry.dispose();
            this.geometry = null;
        }

        if(this.material){
            this.material.dispose();
            this.material = null;
        }

        this.user.bulletCount--;
    }
}