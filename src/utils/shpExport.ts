import * as shpwrite from 'shp-write';

export const downloadSHP = (buildings: any[]) => {
  if (!buildings || buildings.length === 0) return;

  const geojson: any = {
    type: 'FeatureCollection',
    features: buildings.map((b) => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          b.geometry.map((pt: any) => [pt.lng, pt.lat])
        ],
      },
      properties: {
        id: b.id,
        ...b.tags,
      },
    })),
  };

  const options = {
    folder: 'myshp',
    types: {
      polygon: 'buildings'
    }
  };

  shpwrite.download(geojson, options);
};
