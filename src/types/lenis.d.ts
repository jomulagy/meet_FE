export {};

declare global {
  interface Window {
    Lenis: new (options?: {
      smoothWheel?: boolean;
      lerp?: number;
      wheelMultiplier?: number;
      touchMultiplier?: number;
    }) => {
      raf: (time: number) => void;
      destroy: () => void;
    };
  }
}
