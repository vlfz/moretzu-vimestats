export type TextureCanvas = HTMLCanvasElement | OffscreenCanvas;
export type TextureSource = HTMLImageElement | HTMLVideoElement | ImageBitmap | TextureCanvas;
export type ModelType = "default" | "slim";

export const steveSkinURI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAABJlBMVEVMaXEAf38AqKgAmZmqfWaWX0EAaGhGOqUwKHIAr691Ry8qHQ1qQDA/Pz9ra2smIVuHVTuWb1sAYGBWScwoKCgmGgovHw8AzMw6MYkkGAgoGwoAW1sjIyMAnp5RMSWGUzQsHg4pHAyBUzkrHg0fEAsoGg0mGAstHQ6aY0QnGwstIBB3QjWcZ0gzJBEyIxBiQy8rHg6dak8mGgwsHhGKWTsoGwsjFwmEUjF0SC+iakd6TjOHWDokGAqDVTucY0WIWjk6KBQoHAsvIhGcaUz///+0hG27iXJSPYlSKCaaZEqfaEmPXj4vIA2AUzQ0JRJvRSxtQyqQXkOsdlo/KhWcY0aWX0Cze2K+iGytgG1CKhK1e2e9jnK9i3K2iWycclzGloC9jnS3gnKSJOIgAAAAAXRSTlMAQObYZgAAAvxJREFUWMPtlmebojAQx5cEkAiecHcgwrGArPW2997b9d779/8SN0nMruK6oL71//iYocyPmTA6MzPTla5X4VOdK3Y1M6r0quMAoFo0QiMMxwE4js0BT0DG6ICqQ3Nw9LEB4GvbziQA5i8A12MAbCe25yiAaQxAbIN0feTX6Hl2O17sdF4mzknVTvROZzFu254n6iIPwI7iZCFJkoVvH6KThSSObAro1kUmIGrY8fLGfpz8+vHn59/3r+P9jeXYbkSiLrIjqDcjrx2dyhfy19+XZ2enUduLmnVP1EWOFLzVzb3D44vzq++XV+fy8eHe5iqcFHWRA1BvrG0pRx8//zOMLzuvjpSttUadbiKvi+w98JpLK62w+O7TU9CLWjFsrSw1vUjURSYgDFvhvLK+/eZtrbZ7cLC7vf58/tl8C36QtC6KYa5aeAR6DBLHFV5LlYddifOoUkHGrDGbDeDlPACogCYFIPA3JkphAKBpZa0AgoWuriRJPg5qO7VaEIAtBQghQhDiNmErAd0Cyn2AgqSqEkIB+BMCtoro3QAAUyKIBPR6CqD1AdiNBAUYPMFWCRdiYMKg9wN8VfXheoDhi9uYIMwBENQ9EYDhglTf9zGmbhiD6TNvOFYUxZRBJhh07Qe4boHuBQWAj4r5QzHAVMIOEAdYsqyYdwF694ACIADEALAH1BsgJgdYDGBZPQBNG3gLAiCxTbwB0CdTgNkfgQBotwDCvAgWG0YFfhygpAClkgCUSg9AkipJGNMAOABstg0KB8gKjQRS6QFwR7FCKmUKLLgAoEXmughjt8ABlswiyQCwiICARXlj+KJPBj/LTEcw1VRTTTXKvICGdeXcAwdoIgAaNliMkkJuQO+84NI+AYL/+GBgLsgGlG8aTQBNQuq2+vwArdzbqdBAWx8FcOdcMBSQmheGzgXDAWU+L9wAREvLC0ilQAEWB5h9c0E2gKdiMgDrymbOCLQUQOEAMycgPS8o3dzpaENTyQHob/fsydYkAMjdsthocyfgP7DZYc3t4J05AAAAAElFTkSuQmCC";

export type RemoteImage =
  | string
  | {
      src: string;
      /** @defaultvalue "anonymous" */
      crossOrigin?: string | null;
      referrerPolicy?: string;
    };

// https://www.typescriptlang.org/docs/handbook/mixins.html
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function applyMixins(derivedCtor: any, baseCtors: any[]): void {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name)!);
    });
  });
}

export function isTextureSource(value: TextureSource | RemoteImage): value is TextureSource {
  return (
    value instanceof Node || // HTMLImageElement, HTMLVideoElement, HTMLCanvasElement
    (typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap) ||
    (typeof OffscreenCanvas !== "undefined" && value instanceof OffscreenCanvas)
  );
}

export abstract class SkinContainer<T> {
  protected abstract skinLoaded(model: ModelType, options?: T): void;
  protected abstract get skinCanvas(): TextureCanvas;
  protected abstract resetSkin(): void;

  loadSkin(empty: null): void;
  loadSkin<S extends TextureSource | RemoteImage>(
    source: S,
    model?: ModelType | "auto-detect",
    options?: T
  ): S extends TextureSource ? void : Promise<void>;

  loadSkin(
    source: TextureSource | RemoteImage | null,
    model: ModelType | "auto-detect" = "auto-detect",
    options?: T
  ): void | Promise<void> {
    if (source === null) {
      this.resetSkin();
    } else if (isTextureSource(source)) {
      loadSkinToCanvas(this.skinCanvas, source);
      const actualModel = model === "auto-detect" ? inferModelType(this.skinCanvas) : model;
      this.skinLoaded(actualModel, options);
    } else {
      return loadImage(source).then((image) => this.loadSkin(image, model, options));
    }
  }
}

export abstract class CapeContainer<T> {
  protected abstract capeLoaded(options?: T): void;
  protected abstract get capeCanvas(): TextureCanvas;
  protected abstract resetCape(): void;

  loadCape(empty: null): void;
  loadCape<S extends TextureSource | RemoteImage>(
    source: S,
    options?: T
  ): S extends TextureSource ? void : Promise<void>;

  loadCape(source: TextureSource | RemoteImage | null, options?: T): void | Promise<void> {
    if (source === null) {
      this.resetCape();
    } else if (isTextureSource(source)) {
      loadCapeToCanvas(this.capeCanvas, source);
      this.capeLoaded(options);
    } else {
      return loadImage(source).then((image) => this.loadCape(image, options));
    }
  }
}

export async function loadImage(source: RemoteImage): Promise<HTMLImageElement> {
  const image = document.createElement("img");
  return new Promise((resolve, reject) => {
    image.onload = (): void => resolve(image);
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    if (typeof source === "string") {
      image.src = source;
    } else {
      if (source.crossOrigin !== undefined) {
        image.crossOrigin = source.crossOrigin;
      }
      if (source.referrerPolicy !== undefined) {
        image.referrerPolicy = source.referrerPolicy;
      }
      image.src = source.src;
    }
  });
}

function copyImage(
  context: CanvasImageData,
  sX: number,
  sY: number,
  w: number,
  h: number,
  dX: number,
  dY: number,
  flipHorizontal: boolean
): void {
  const imgData = context.getImageData(sX, sY, w, h);
  if (flipHorizontal) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w / 2; x++) {
        const index = (x + y * w) * 4;
        const index2 = (w - x - 1 + y * w) * 4;
        const pA1 = imgData.data[index];
        const pA2 = imgData.data[index + 1];
        const pA3 = imgData.data[index + 2];
        const pA4 = imgData.data[index + 3];

        const pB1 = imgData.data[index2];
        const pB2 = imgData.data[index2 + 1];
        const pB3 = imgData.data[index2 + 2];
        const pB4 = imgData.data[index2 + 3];

        imgData.data[index] = pB1;
        imgData.data[index + 1] = pB2;
        imgData.data[index + 2] = pB3;
        imgData.data[index + 3] = pB4;

        imgData.data[index2] = pA1;
        imgData.data[index2 + 1] = pA2;
        imgData.data[index2 + 2] = pA3;
        imgData.data[index2 + 3] = pA4;
      }
    }
  }
  context.putImageData(imgData, dX, dY);
}

function hasTransparency(context: CanvasImageData, x0: number, y0: number, w: number, h: number): boolean {
  const imgData = context.getImageData(x0, y0, w, h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const offset = (x + y * w) * 4;
      if (imgData.data[offset + 3] !== 0xff) {
        return true;
      }
    }
  }
  return false;
}

function computeSkinScale(width: number): number {
  return width / 64.0;
}

function fixOpaqueSkin(context: CanvasImageData & CanvasRect, width: number): void {
  // Some ancient skins don't have transparent pixels (nor have helm).
  // We have to make the helm area transparent, otherwise it will be rendered as black.
  if (!hasTransparency(context, 0, 0, width, width / 2)) {
    const scale = computeSkinScale(width);
    const clearArea = (x: number, y: number, w: number, h: number): void =>
      context.clearRect(x * scale, y * scale, w * scale, h * scale);
    clearArea(40, 0, 8, 8); // Helm Top
    clearArea(48, 0, 8, 8); // Helm Bottom
    clearArea(32, 8, 8, 8); // Helm Right
    clearArea(40, 8, 8, 8); // Helm Front
    clearArea(48, 8, 8, 8); // Helm Left
    clearArea(56, 8, 8, 8); // Helm Back
  }
}

function convertSkinTo1_8(context: CanvasImageData & CanvasRect, width: number): void {
  const scale = computeSkinScale(width);
  const copySkin = (
    sX: number,
    sY: number,
    w: number,
    h: number,
    dX: number,
    dY: number,
    flipHorizontal: boolean
  ): void => copyImage(context, sX * scale, sY * scale, w * scale, h * scale, dX * scale, dY * scale, flipHorizontal);

  fixOpaqueSkin(context, width);

  copySkin(4, 16, 4, 4, 20, 48, true); // Top Leg
  copySkin(8, 16, 4, 4, 24, 48, true); // Bottom Leg
  copySkin(0, 20, 4, 12, 24, 52, true); // Outer Leg
  copySkin(4, 20, 4, 12, 20, 52, true); // Front Leg
  copySkin(8, 20, 4, 12, 16, 52, true); // Inner Leg
  copySkin(12, 20, 4, 12, 28, 52, true); // Back Leg
  copySkin(44, 16, 4, 4, 36, 48, true); // Top Arm
  copySkin(48, 16, 4, 4, 40, 48, true); // Bottom Arm
  copySkin(40, 20, 4, 12, 40, 52, true); // Outer Arm
  copySkin(44, 20, 4, 12, 36, 52, true); // Front Arm
  copySkin(48, 20, 4, 12, 32, 52, true); // Inner Arm
  copySkin(52, 20, 4, 12, 44, 52, true); // Back Arm
}

export function loadSkinToCanvas(canvas: TextureCanvas, image: TextureSource): void {
  let isOldFormat = false;
  if (image.width !== image.height) {
    if (image.width === 2 * image.height) {
      isOldFormat = true;
    } else {
      throw new Error(`Bad skin size: ${image.width}x${image.height}`);
    }
  }

  const context = canvas.getContext("2d")!;
  if (isOldFormat) {
    const sideLength = image.width;
    canvas.width = sideLength;
    canvas.height = sideLength;
    context.clearRect(0, 0, sideLength, sideLength);
    context.drawImage(image, 0, 0, sideLength, sideLength / 2.0);
    convertSkinTo1_8(context, sideLength);
  } else {
    canvas.width = image.width;
    canvas.height = image.height;
    context.clearRect(0, 0, image.width, image.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  }
}

function computeCapeScale(image: TextureSource): number {
  if (image.width === 2 * image.height) {
    // 64x32
    return image.width / 64;
  } else if (image.width * 17 === image.height * 22) {
    // 22x17
    return image.width / 22;
  } else if (image.width * 11 === image.height * 23) {
    // 46x22
    return image.width / 46;
  } else {
    throw new Error(`Bad cape size: ${image.width}x${image.height}`);
  }
}

export function loadCapeToCanvas(canvas: TextureCanvas, image: TextureSource): void {
  const scale = computeCapeScale(image);
  canvas.width = 64 * scale;
  canvas.height = 32 * scale;

  const context = canvas.getContext("2d")!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, image.width, image.height);
}

function isAreaBlack(context: CanvasImageData, x0: number, y0: number, w: number, h: number): boolean {
  const imgData = context.getImageData(x0, y0, w, h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const offset = (x + y * w) * 4;
      if (
        !(
          imgData.data[offset + 0] === 0 &&
          imgData.data[offset + 1] === 0 &&
          imgData.data[offset + 2] === 0 &&
          imgData.data[offset + 3] === 0xff
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

export function inferModelType(canvas: TextureCanvas): ModelType {
  // The right arm area of *default* skins:
  // (44,16)->*-------*-------*
  // (40,20)  |top    |bottom |
  // \|/      |4x4    |4x4    |
  //  *-------*-------*-------*-------*
  //  |right  |front  |left   |back   |
  //  |4x12   |4x12   |4x12   |4x12   |
  //  *-------*-------*-------*-------*
  // The right arm area of *slim* skins:
  // (44,16)->*------*------*-*
  // (40,20)  |top   |bottom| |<----[x0=50,y0=16,w=2,h=4]
  // \|/      |3x4   |3x4   | |
  //  *-------*------*------***-----*-*
  //  |right  |front |left   |back  | |<----[x0=54,y0=20,w=2,h=12]
  //  |4x12   |3x12  |4x12   |3x12  | |
  //  *-------*------*-------*------*-*
  // Compared with default right arms, slim right arms have 2 unused areas.
  //
  // The same is true for left arm:
  // The left arm area of *default* skins:
  // (36,48)->*-------*-------*
  // (32,52)  |top    |bottom |
  // \|/      |4x4    |4x4    |
  //  *-------*-------*-------*-------*
  //  |right  |front  |left   |back   |
  //  |4x12   |4x12   |4x12   |4x12   |
  //  *-------*-------*-------*-------*
  // The left arm area of *slim* skins:
  // (36,48)->*------*------*-*
  // (32,52)  |top   |bottom| |<----[x0=42,y0=48,w=2,h=4]
  // \|/      |3x4   |3x4   | |
  //  *-------*------*------***-----*-*
  //  |right  |front |left   |back  | |<----[x0=46,y0=52,w=2,h=12]
  //  |4x12   |3x12  |4x12   |3x12  | |
  //  *-------*------*-------*------*-*
  //
  // If there is a transparent pixel in any of the 4 unused areas, the skin must be slim,
  // as transparent pixels are not allowed in the first layer.
  // If the 4 areas are all black, the skin is also considered as slim.

  const scale = computeSkinScale(canvas.width);
  const context = canvas.getContext("2d")!;
  const checkTransparency = (x: number, y: number, w: number, h: number): boolean =>
    hasTransparency(context, x * scale, y * scale, w * scale, h * scale);
  const checkBlack = (x: number, y: number, w: number, h: number): boolean =>
    isAreaBlack(context, x * scale, y * scale, w * scale, h * scale);
  const isSlim =
    checkTransparency(50, 16, 2, 4) ||
    checkTransparency(54, 20, 2, 12) ||
    checkTransparency(42, 48, 2, 4) ||
    checkTransparency(46, 52, 2, 12) ||
    (checkBlack(50, 16, 2, 4) && checkBlack(54, 20, 2, 12) && checkBlack(42, 48, 2, 4) && checkBlack(46, 52, 2, 12));
  return isSlim ? "slim" : "default";
}
