import { CanvasTexture, Sprite, SpriteMaterial } from "three";
import { CSS2DObject } from "three/examples/jsm/Addons.js";

export class HUD{
    constructor(){
        this.htmlElement = document.createElement('div');
        this.htmlElement.id = 'hud';
        document.body.append(this.htmlElement);
    }

    addChild(child){
        this.htmlElement.appendChild(child)
    }

    removeChild(child){
        this.htmlElement.removeChild(child);
    }

    destroy(){
        document.removeChild(this.htmlElement);
    }
}

export class FPSIndicator{
    constructor(text){
        this.htmlElement = document.createElement('div');
        this.htmlElement.id = 'fps-counter';
        this.htmlElement.textContent = text;
    }
    setText(text){
        this.htmlElement.textContent = text;
    }
    getElement(){
        return this.htmlElement;
    }
}

export class AlertIcon{
    constructor(){
        this.canvas = document.createElement('canvas');
        this.canvas.width = 64;
        this.canvas.height = 64;
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.font = '48px bold sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 32,32);

        this.texture = new CanvasTexture(this.canvas);
        this.mlt = new SpriteMaterial({
            map: this.texture,
            depthFunc:false,
        });
        this.sprite = new Sprite(this.mlt);
        this.sprite.scale.set(5,5,5);
        this.sprite.position.set(0,5,0);
    }

    getElement(){
        return this.sprite;
    }

    setVisible(setting){
        this.sprite.visible = setting;
    }

    setAlert(color, text){
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = color;
        ctx.font = '48px bold sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        this.texture.needsUpdate = true;
    }
}