
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DObject.js';

export class TextObject extends CSS2DObject{
    constructor(text) {
        var div = document.createElement('div');
        div.className = 'label';
        div.textContent = text;
        div.style.marginTop = '-1em';
        div.style.color = 'white';
        div.id = 'info';
        super(div);
        this.baseEntity = div;
    };
}