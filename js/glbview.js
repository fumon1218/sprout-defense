// Minimal WebGL GLB viewer (no external libraries).
// Renders one textured, lit mesh to an offscreen transparent canvas so the 2D game can draw it as a sprite.

const VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv;
uniform mat3 uR; uniform vec3 uC; uniform vec2 uS;
varying vec3 vN; varying vec2 vUv;
void main(){
  vec3 q = uR * (aPos - uC);
  gl_Position = vec4(q.x*uS.x, q.y*uS.y, -q.z*0.5, 1.0);
  vN = uR * aNor; vUv = aUv;
}`;
const FS = `
precision mediump float;
varying vec3 vN; varying vec2 vUv;
uniform sampler2D uTex;
void main(){
  vec3 n = normalize(vN);
  float d = max(dot(n, normalize(vec3(0.35,0.65,0.75))), 0.0);
  vec3 c = texture2D(uTex, vUv).rgb * (0.62 + 0.7*d) * 1.35;
  gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);
}`;

function sh(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

class GLBView {
  constructor(w = 288, h = 320) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = w; this.canvas.height = h;
    const gl = this.gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) throw new Error('WebGL is not available');
    const p = this.prog = gl.createProgram();
    gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this.loc = {
      pos: gl.getAttribLocation(p, 'aPos'), nor: gl.getAttribLocation(p, 'aNor'), uv: gl.getAttribLocation(p, 'aUv'),
      R: gl.getUniformLocation(p, 'uR'), C: gl.getUniformLocation(p, 'uC'), S: gl.getUniformLocation(p, 'uS'),
      tex: gl.getUniformLocation(p, 'uTex'),
    };
    this.aspect = w / h;
  }

  async load(url) { return this.loadBuffer(await (await fetch(url)).arrayBuffer()); }

  async loadBuffer(buf) {
    const gl = this.gl;
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB');
    const jl = dv.getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
    const binStart = 20 + jl + 8;
    const view = (i) => { const v = json.bufferViews[i]; return buf.slice(binStart + (v.byteOffset || 0), binStart + (v.byteOffset || 0) + v.byteLength); };
    const acc = (i, Type) => new Type(view(json.accessors[i].bufferView));
    const prim = json.meshes[0].primitives[0];
    const A = prim.attributes;
    const pos = acc(A.POSITION, Float32Array), nor = acc(A.NORMAL, Float32Array), uv = acc(A.TEXCOORD_0, Float32Array);
    const idxAcc = json.accessors[prim.indices];
    const idx = idxAcc.componentType === 5123 ? acc(prim.indices, Uint16Array) : acc(prim.indices, Uint32Array);
    if (idxAcc.componentType !== 5123) throw new Error('32-bit indices are not supported by this viewer');
    const mk = (target, data) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; };
    const model = { bp: mk(gl.ARRAY_BUFFER, pos), bn: mk(gl.ARRAY_BUFFER, nor), bu: mk(gl.ARRAY_BUFFER, uv), bi: mk(gl.ELEMENT_ARRAY_BUFFER, idx), count: idxAcc.count };
    const mn = json.accessors[A.POSITION].min, mx = json.accessors[A.POSITION].max;
    model.center = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
    model.height = mx[1] - mn[1];
    // base color texture
    const img = json.images[json.textures[json.materials[0].pbrMetallicRoughness.baseColorTexture.index].source];
    const bmp = await createImageBitmap(new Blob([view(img.bufferView)], { type: img.mimeType }), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    const t = model.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return model;
  }

  render(model, yaw = 0, pitch = -0.14) {
    const gl = this.gl, L = this.loc;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS);
    gl.useProgram(this.prog);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    // R = Rx(pitch) * Ry(yaw), row-major -> column-major upload
    const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
    const Rx = [[1, 0, 0], [0, cp, -sp], [0, sp, cp]];
    const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) R[r][c] += Rx[r][k] * Ry[k][c];
    const m = new Float32Array(9);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 3 + r] = R[r][c];
    const hh = model.height * 0.56, hw = hh * this.aspect;
    gl.uniformMatrix3fv(L.R, false, m);
    gl.uniform3fv(L.C, model.center);
    gl.uniform2f(L.S, 1 / hw, 1 / hh);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, model.tex); gl.uniform1i(L.tex, 0);
    const attr = (loc, buf, n) => { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0); };
    attr(L.pos, model.bp, 3); attr(L.nor, model.bn, 3); attr(L.uv, model.bu, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.bi);
    gl.drawElements(gl.TRIANGLES, model.count, gl.UNSIGNED_SHORT, 0);
    return this.canvas;
  }
}

window.GLBView = GLBView;
