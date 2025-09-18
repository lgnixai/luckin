// optional dep shim
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AspectRatioPrimitive: any = {};
try { AspectRatioPrimitive = require('@radix-ui/react-aspect-ratio'); } catch {}

const AspectRatio = AspectRatioPrimitive.Root;

export { AspectRatio };
