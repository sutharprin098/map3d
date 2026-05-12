export const downloadGeoJSON = (data: { buildings: any[], roads: any[], parks: any[], water: any[] }) => {
  const features: any[] = [];

  // Buildings
  data.buildings.forEach((bld: any) => {
    if (!bld.geometry) return;
    const height = parseFloat(bld.tags?.height || bld.tags?.['building:levels'] * 3 || "10") || 10;
    features.push({
      type: "Feature",
      properties: { 
        ...bld.tags, 
        height: height,
        type: "building" 
      },
      geometry: {
        type: "Polygon",
        coordinates: [bld.geometry.map((p: any) => [p.lng, p.lat])]
      }
    });
  });

  // Roads
  data.roads.forEach((road: any) => {
    if (!road.geometry) return;
    features.push({
      type: "Feature",
      properties: { ...road.tags, type: "highway" },
      geometry: {
        type: "LineString",
        coordinates: road.geometry.map((p: any) => [p.lon, p.lat])
      }
    });
  });

  // Parks
  data.parks.forEach((park: any) => {
    if (!park.geometry) return;
    features.push({
      type: "Feature",
      properties: { ...park.tags, type: "park" },
      geometry: {
        type: "Polygon",
        coordinates: [park.geometry.map((p: any) => [p.lon, p.lat])]
      }
    });
  });

  // Water
  data.water.forEach((w: any) => {
    if (!w.geometry) return;
    features.push({
      type: "Feature",
      properties: { ...w.tags, type: "water" },
      geometry: {
        type: "Polygon",
        coordinates: [w.geometry.map((p: any) => [p.lon, p.lat])]
      }
    });
  });

  const geojson = {
    type: "FeatureCollection",
    features: features
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `city_data_${timestamp}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
};
