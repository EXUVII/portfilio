// Bundle entry for runner/vendor/three.bundle.min.js.
// Rebuild: npm i three@0.170.0 esbuild && npx esbuild runner/vendor/entry.js --bundle --minify --format=iife --global-name=THREEKIT --outfile=runner/vendor/three.bundle.min.js
import * as THREE from 'three';
export { THREE };
export { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
export { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
export { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
export { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
