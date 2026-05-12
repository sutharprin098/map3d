import { css, Global } from "@emotion/react";
import { Space } from "../three/Space";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Globe, Map as MapIcon, Database, Layers, Car as CarIcon, Github } from "lucide-react";
import { useAreaStore } from "@/state/areaStore";
import { useActionStore } from "@/state/exportStore";
import { useCarStore } from "@/state/carStore";
import { MapComponent } from "@/components/map/SelectMap";
import { BuildingHeights } from "@/components/map/Processing";
import { downloadGeoJSON } from "@/utils/geoJsonExport";
import { useCityStore } from "@/state/cityStore";
import MiniMap from './MiniMap';

const App = () => {
  const [step, setStep] = useState(0);
  const isReady = useCityStore((state) => state.isReady);
  const [areaData, setAreaData] = useState([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true);

  const setCenter = useAreaStore((state) => state.setCenter);
  const setAction = useActionStore((state) => state.setAction);
  const thirdMode = useCarStore((state) => state.thirdMode);
  const autoDrive = useCarStore((state) => state.autoDrive);
  const setThirdMode = useCarStore((state) => state.setThirdMode);
  const setAutoDrive = useCarStore((state) => state.setAutoDrive);

  const toggleDriveMode = () => {
    if (!thirdMode) setAutoDrive(false);
    setThirdMode(!thirdMode);
  };

  const toggleAutoDrive = () => {
    if (!autoDrive) setThirdMode(false);
    setAutoDrive(!autoDrive);
  };

  const steps = [
    { title: "Select Area", icon: <MapIcon size={18} />, description: "Select a location on the map" },
    { title: "Process Data", icon: <Database size={18} />, description: "Fetch 3D building data" },
    { title: "View 3D", icon: <Layers size={18} />, description: "Explore the generated map" },
  ];

  const handleDone = (data) => {
    setAreaData(data);
    setCenter(data);
    setIsNextButtonDisabled(false);
  };

  const handleRemove = () => {
    setAreaData([]);
    setIsNextButtonDisabled(true);
  };

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative", background: "#f1f5f9" }}>
      <Global styles={css`
        .panel {
          position: absolute;
          z-index: 100;
          pointer-events: all;
        }
        .btn-premium {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
        }
        .btn-secondary {
          background: white;
          color: #1e293b;
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 12px 24px;
        }
      `} />

      {/* Main Sidebar */}
      {step < 2 && (
        <div className="panel premium-card" style={{ top: '32px', left: '32px', width: '400px', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                        <Globe size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Map3D Premium</h1>
                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Professional Geospatial Generator</p>
                    </div>
                </div>
                <a 
                    href="https://github.com/cartesiancs/map3d" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: '#f8fafc',
                        border: '1px solid rgba(0,0,0,0.05)',
                        color: '#1e293b',
                        transition: '0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
                >
                    <Github size={20} />
                </a>
            </div>

            <div className="step-indicator">
                {steps.map((s, i) => (
                    <div key={i} className={`step-dot ${i === step ? 'active' : ''}`} />
                ))}
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{steps[step].title}</h2>
            <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px' }}>{steps[step].description}</p>

            <div style={{ marginBottom: '32px' }}>
                {step === 0 && <MapComponent onRemove={handleRemove} onDone={handleDone} />}
                {step === 1 && <BuildingHeights area={areaData} />}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                {step > 0 && (
                    <button className="btn-secondary" onClick={prevStep} style={{ flex: 1 }}>
                        <ChevronLeft size={18} /> Back
                    </button>
                )}
                <button 
                    className="btn-premium" 
                    onClick={() => setStep(step + 1)} 
                    disabled={ (step === 0 && areaData.length === 0) || (step === 1 && !isReady) } 
                    style={{ flex: 2, opacity: ((step === 0 && areaData.length === 0) || (step === 1 && !isReady)) ? 0.5 : 1 }}
                >
                    {step === 1 ? "Generate 3D" : "Continue"} <ChevronRight size={18} />
                </button>
            </div>
        </div>
      )}

      {/* 3D View Overlay Controls */}
      {step === 2 && (
        <>
            <div className="panel" style={{ top: '32px', left: '32px' }}>
                <button className="btn-secondary premium-card" onClick={() => setStep(1)} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronLeft size={18} /> Edit Map
                </button>
            </div>

            <div className="panel" style={{ top: '32px', right: '32px' }}>
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className="btn-premium" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}>
                        <Download size={18} /> Export Project
                    </button>
                    
                    {isExportMenuOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            <button className="btn-secondary" onClick={() => setAction(true)} style={{ fontSize: '13px' }}>GLB (3D Model)</button>
                            <button className="btn-secondary" onClick={() => {
                                const state = useAreaStore.getState();
                                downloadGeoJSON({
                                    buildings: state.areas,
                                    roads: state.roadData,
                                    parks: state.parkAreas,
                                    water: state.waterAreas
                                });
                            }} style={{ fontSize: '13px' }}>GeoJSON (GIS Data)</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="panel" style={{ bottom: '32px', left: '50%', transform: 'translateX(-50%)' }}>
                <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '12px 32px' }}>
                    {/* Drive Mode Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRight: '1px solid rgba(0,0,0,0.05)', paddingRight: '24px' }}>
                        <CarIcon size={20} color={thirdMode ? 'var(--primary)' : '#1e293b'} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Drive Mode</span>
                        <div 
                            onClick={toggleDriveMode}
                            style={{ 
                                width: '40px', height: '20px', 
                                background: thirdMode ? 'var(--primary)' : 'rgba(0,0,0,0.1)', 
                                borderRadius: '10px', cursor: 'pointer', position: 'relative', transition: '0.3s'
                            }}
                        >
                            <div style={{ 
                                width: '16px', height: '16px', background: 'white', 
                                borderRadius: '50%', position: 'absolute', top: '2px', 
                                left: thirdMode ? '22px' : '2px', transition: '0.3s'
                            }} />
                        </div>
                    </div>

                    {/* Auto Drive Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Layers size={20} color={autoDrive ? 'var(--primary)' : '#1e293b'} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Auto-Drive</span>
                        <div 
                            onClick={toggleAutoDrive}
                            style={{ 
                                width: '40px', height: '20px', 
                                background: autoDrive ? 'var(--primary)' : 'rgba(0,0,0,0.1)', 
                                borderRadius: '10px', cursor: 'pointer', position: 'relative', transition: '0.3s'
                            }}
                        >
                            <div style={{ 
                                width: '16px', height: '16px', background: 'white', 
                                borderRadius: '50%', position: 'absolute', top: '2px', 
                                left: autoDrive ? '22px' : '2px', transition: '0.3s'
                            }} />
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}

      <Space />
      {step === 2 && <MiniMap />}
    </div>
  );
};

export default App;
