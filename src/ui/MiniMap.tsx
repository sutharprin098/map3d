import React from 'react';
import { useCarStore } from '@/state/carStore';
import { useAreaStore } from '@/state/areaStore';

const MiniMap = () => {
  const carPos = useCarStore((state) => state.carPos);
  const areas = useAreaStore((state) => state.areas);
  const roadData = useAreaStore((state) => state.roadData);
  const center = useAreaStore((state) => state.center);
  
  if (!center || center.length < 2) return null;

  const size = 180;
  const zoom = 0.2;
  const scale = 51000;

  const refLat = (center[1].lat + center[0].lat) / 2;
  const refLng = (center[1].lng + center[0].lng) / 2;

  function project(lat: number, lng: number) {
    const x = (lng - refLng) * scale * Math.cos((refLat * Math.PI) / 180);
    const y = (lat - refLat) * scale;
    return { x, z: -y };
  }

  return (
    <div className="glass premium-card" style={{
      position: 'absolute',
      bottom: '100px',
      right: '32px',
      width: `${size}px`,
      height: `${size}px`,
      padding: '0',
      overflow: 'hidden',
      borderRadius: '24px',
      border: '2px solid rgba(0,0,0,0.1)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
      pointerEvents: 'none',
      background: '#ffffff',
      zIndex: 1000
    }}>
      <svg width={size} height={size}>
        <g transform={`translate(${size/2}, ${size/2}) scale(${zoom}) translate(${-carPos.x}, ${-carPos.z})`}>
          {/* Roads */}
          {roadData.map((road: any, i: number) => {
            if (!road.geometry) return null;
            const pts = road.geometry.map((p: any) => {
                const pos = project(p.lat, p.lon);
                return `${pos.x},${pos.z}`;
            }).join(' ');
            return (
              <polyline
                key={`road-${i}`}
                points={pts}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="12"
                strokeLinecap="round"
              />
            );
          })}

          {/* Buildings */}
          {areas.map((bld: any, i: number) => {
              if (!bld.geometry) return null;
              const pts = bld.geometry.map((p: any) => {
                  const pos = project(p.lat, p.lng);
                  return `${pos.x},${pos.z}`;
              }).join(' ');
              return <polygon key={`bld-${i}`} points={pts} fill="#64748b" opacity={0.4} />;
          })}
        </g>
        
        {/* Car Indicator */}
        <circle cx={size/2} cy={size/2} r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
      </svg>

      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        fontSize: '10px',
        fontWeight: 800,
        color: '#94a3b8',
        letterSpacing: '1px'
      }}>
        RADAR
      </div>
    </div>
  );
};

export default MiniMap;
