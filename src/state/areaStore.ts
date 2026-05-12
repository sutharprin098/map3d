import { create } from "zustand";

type AreaStore = {
  areas: any[];
  center: any[];
  roadData: any[];
  waterAreas: any[];
  parkAreas: any[];
  treeNodes: any[];

  appendAreas: (areas: any[]) => void;
  setCenter: (center: any[]) => void;
  setRoadData: (data: any[]) => void;
  setWaterAreas: (areas: any[]) => void;
  setParkAreas: (areas: any[]) => void;
  setTreeNodes: (nodes: any[]) => void;
};

export const useAreaStore = create<AreaStore>((set) => ({
  areas: [],
  center: [],
  roadData: [],
  waterAreas: [],
  parkAreas: [],
  treeNodes: [],
  appendAreas: (areas) => set(() => ({ areas: [...areas] })),
  setCenter: (center) => set(() => ({ center: [...center] })),
  setRoadData: (data) => set(() => ({ roadData: [...data] })),
  setWaterAreas: (areas) => set(() => ({ waterAreas: [...areas] })),
  setParkAreas: (areas) => set(() => ({ parkAreas: [...areas] })),
  setTreeNodes: (nodes) => set(() => ({ treeNodes: [...nodes] })),
}));
