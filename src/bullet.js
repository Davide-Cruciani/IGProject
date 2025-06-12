import { SphereGeometry, Mesh, MeshPhongMaterial} from "three";

export class Bullet{
    constructor(position, direction, shipColor, user) {
        this.geometry = new SphereGeometry(0.1);
        this.material = new MeshPhongMaterial({
            color:shipColor,
        });
        this.mesh = new Mesh(this.geometry, this.material);
        this.direction = direction;
        this.mesh.position.copy(position);
        this.user = user;
        this.SPEED = 10;
    }

    getMesh(){ return this.mesh; };

    update(time){
        this.mesh.translateOnAxis(this.direction, this.SPEED*time);
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