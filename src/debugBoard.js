import { PlaneGeometry, MeshStandardMaterial, Mesh, CanvasTexture, DoubleSide } from "three";

function createCheckerboardTexture(size = 600, squares = 10) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const squareSize = size / squares;

  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
    }
  }

  const texture = new CanvasTexture(canvas);
  return texture;
}





export class DebugBoard{
    constructor(size, resolution, squares){
        this.geometry = new PlaneGeometry(size, size);
        this.texture = createCheckerboardTexture(resolution, squares);
        this.material = new MeshStandardMaterial({ map: this.texture, side: DoubleSide });
        this.board = new Mesh(this.geometry, this.material);
    }

    getMesh(){ return this.board; };
} 