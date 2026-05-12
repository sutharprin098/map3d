import { create } from "zustand";

type CarStore = {
  thirdMode: boolean;
  autoDrive: boolean;
  carPos: { x: number; z: number };

  setThirdMode: (thirdMode: boolean) => void;
  setAutoDrive: (autoDrive: boolean) => void;
  setCarPos: (x: number, z: number) => void;
};

export const useCarStore = create<CarStore>((set) => ({
  thirdMode: false,
  autoDrive: false,
  carPos: { x: 0, z: 0 },
  setThirdMode: (thirdMode) => set(() => ({ thirdMode: thirdMode })),
  setAutoDrive: (autoDrive) => set(() => ({ autoDrive: autoDrive })),
  setCarPos: (x, z) => set(() => ({ carPos: { x, z } })),
}));
