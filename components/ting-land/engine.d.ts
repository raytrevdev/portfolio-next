export interface TingLandOptions {
  /** public URL folder for the baked textures, default '/ting-land/textures/' */
  textureBase?: string;
}
/** Mounts the experience onto the TingLand markup. Returns a dispose function (stops the loop, removes listeners, frees GPU resources). */
export function initTingLand(root: HTMLElement, opts?: TingLandOptions): () => void;
