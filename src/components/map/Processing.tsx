import { useAreaStore } from "@/state/areaStore";
import { useCityStore } from "@/state/cityStore";
import { css, keyframes } from "@emotion/react";
import { Loader2, CheckCircle2, Info } from "lucide-react";
import React, { useEffect } from "react";

const spinAnimation = keyframes`
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
`;

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter"
];

export function BuildingHeights({ area }: { area: any }) {
  const { isGenerating, isReady, progress, status, setReady, setGenerating, setProgress, setStatus } = useCityStore();
  const { appendAreas, setRoadData, setWaterAreas, setParkAreas, setTreeNodes } = useAreaStore();

  useEffect(() => {
    if (area && area.length >= 2 && !isReady && !isGenerating) {
      generateFullCity();
    }
  }, [area]);

  const fetchWithFallback = async (query: string, mirrorIndex = 0): Promise<any> => {
    if (mirrorIndex >= MIRRORS.length) throw new Error("All mirrors failed");
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s timeout per mirror

      const res = await fetch(MIRRORS[mirrorIndex], { 
        method: "POST", 
        body: query,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Mirror Error");
      return await res.json();
    } catch (error) {
      console.warn(`Mirror ${MIRRORS[mirrorIndex]} failed, trying next in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      return fetchWithFallback(query, mirrorIndex + 1);
    }
  };

  const generateFullCity = async () => {
    setGenerating(true);
    setStatus("Connecting to City Engine...");
    setProgress(5);

    const south = area[1].lat;
    const west = area[1].lng;
    const north = area[0].lat;
    const east = area[0].lng;
    const bbox = `${south},${west},${north},${east}`;

    try {
      setStatus("Downloading City Assets...");
      setProgress(20);
      
      const query = `[out:json][timeout:60];(
        way["building"](${bbox});
        relation["building"](${bbox});
        way["highway"](${bbox});
        way["leisure"="park"](${bbox});
        relation["leisure"="park"](${bbox});
        way["landuse"="grass"](${bbox});
        relation["landuse"="grass"](${bbox});
        way["natural"="water"](${bbox});
        relation["natural"="water"](${bbox});
        way["waterway"](${bbox});
      );out body geom;`;
      
      const data = await fetchWithFallback(query);
      
      setStatus("Processing City Data...");
      setProgress(60);

      const buildings: any[] = [];
      const roads: any[] = [];
      const parks: any[] = [];
      const water: any[] = [];
      const trees: any[] = [];

      data.elements.forEach((el: any) => {
        if (el.tags?.building) {
          buildings.push({
            id: el.id,
            tags: el.tags,
            geometry: el.geometry ? el.geometry.map((pt: any) => ({ lat: pt.lat, lng: pt.lon })) : undefined,
          });
        } else if (el.tags?.highway) {
          roads.push(el);
        } else if (el.tags?.leisure === "park" || el.tags?.landuse === "grass" || el.tags?.landuse === "forest") {
          parks.push(el);
        } else if (el.tags?.natural === "water" || el.tags?.waterway) {
          water.push(el);
        } else if (el.tags?.natural === "tree" || el.type === "node" && el.tags?.natural === "tree") {
          trees.push(el);
        }
      });

      appendAreas(buildings);
      setRoadData(roads);
      setParkAreas(parks);
      setWaterAreas(water);
      setTreeNodes(trees);

      setStatus("City Ready!");
      setProgress(100);
      setTimeout(() => setReady(true), 800);
    } catch (error) {
      console.error(error);
      setStatus("All servers busy. Retrying in 5s...");
      setTimeout(generateFullCity, 5000);
    }
  };

  return (
    <div css={css({ position: "relative" })}>
      <div className="premium-card"
        css={css({
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          maxWidth: "400px"
        })}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isReady ? <CheckCircle2 color="#22c55e" /> : <Loader2 css={css({ animation: `${spinAnimation} 2s linear infinite` })} color="var(--primary)" />}
            <span style={{ fontWeight: 700, fontSize: '16px' }}>{status}</span>
        </div>

        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: 'var(--primary)', 
                transition: 'width 0.5s ease-out' 
            }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, fontSize: '13px' }}>
            <Info size={14} />
            <span>Map will activate once background sync completes.</span>
        </div>
      </div>
    </div>
  );
}
