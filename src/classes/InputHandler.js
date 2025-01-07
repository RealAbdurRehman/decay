export default class InputHandler {
  constructor() {
    this.keys = [];
    this.mouse = {
      right: false,
      left: false,
    };
    window.addEventListener("keydown", ({ code }) => {
      if (
        (code === "KeyW" ||
          code === "KeyS" ||
          code === "KeyA" ||
          code === "KeyD" ||
          code === "KeyC" ||
          code === "KeyR" ||
          code === "KeyP" ||
          code === "Space" ||
          code === "ShiftLeft") &&
        !this.keys.includes(code)
      )
        this.keys.push(code);
    });
    window.addEventListener("keyup", ({ code }) => {
      if (
        code === "KeyW" ||
        code === "KeyS" ||
        code === "KeyA" ||
        code === "KeyD" ||
        code === "KeyC" ||
        code === "KeyR" ||
        code === "KeyP" ||
        code === "Space" ||
        code === "ShiftLeft"
      )
        this.keys.splice(this.keys.indexOf(code), 1);
    });
    window.addEventListener("mousedown", ({ button }) => {
      if (button === 0) this.mouse.left = true;
      else if (button === 2) this.mouse.right = true;
    });
    window.addEventListener("mouseup", ({ button }) => {
      if (button === 0) this.mouse.left = false;
      else if (button === 2) this.mouse.right = false;
    });
  }
}