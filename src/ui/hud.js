// One objective line + one contextual hint, shown as DOM on desktop
// and as a body-locked panel in VR. Same content, two presentations.
import * as THREE from 'three';

export class Hud {
  constructor(camera) {
    this.dom = { root: document.querySelector('#hud'), objective: document.querySelector('#objective'), hint: document.querySelector('#hint') };
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 192;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.panel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.15),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthTest: false }),
    );
    this.panel.renderOrder = 10;
    this.panel.position.set(0, -0.32, -1.3); // low in view, readable, out of the way
    this.panel.rotation.x = -0.2;
    this.panel.visible = false;
    camera.add(this.panel);
    this.last = '';
  }

  show(visible) { this.dom.root.hidden = !visible; }

  set(objective, hint, inXR) {
    this.dom.objective.textContent = inXR ? '' : objective;
    this.dom.hint.textContent = inXR ? '' : hint;
    this.panel.visible = inXR && !!(objective || hint);
    const key = objective + '|' + hint;
    if (!inXR || key === this.last) return;
    this.last = key;
    const g = this.canvas.getContext('2d');
    g.clearRect(0, 0, 1024, 192);
    g.fillStyle = 'rgba(10,22,25,.72)';
    g.beginPath();
    g.roundRect(112, 12, 800, hint ? 168 : 96, 48);
    g.fill();
    g.textAlign = 'center';
    g.fillStyle = '#f4eddb';
    g.font = '500 46px system-ui, sans-serif';
    g.fillText(objective, 512, 76);
    if (hint) {
      g.fillStyle = '#f0a64a';
      g.font = '38px system-ui, sans-serif';
      g.fillText(hint, 512, 146);
    }
    this.texture.needsUpdate = true;
  }
}
