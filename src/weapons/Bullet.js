import { SphereGeometry, Mesh, MeshPhongMaterial} from "three";

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