# 🌍 Map3D: Professional 3D GIS Visualization & Simulation

Map3D is a high-performance, professional-grade 3D GIS simulation platform built with **React-Three-Fiber**. It transforms raw OpenStreetMap data into immersive, interactive 3D environments with autonomous navigation and precise geospatial export capabilities.

![Demo Video](https://github.com/user-attachments/assets/1b61c2f8-dcf9-40bb-9804-59f6a74594dc)

## 🚀 Key Features

- **⚡ Atomic "Big Bang" Rendering**: Synchronized loading pipeline that reveals the entire city (buildings, roads, water, parks) only once all assets are perfectly orchestrated.
- **🛡️ Resilient Data Pipeline**: Advanced Multi-Mirror Fallback system utilizing 6 global Overpass API servers (DE, FR, TW, RU, HK) to ensure 99.9% uptime and bypass rate limits.
- **🚗 Autonomous Navigation**: Integrated vehicle physics with "Auto-Drive" mode that precisely tracks road geometry for realistic city simulations.
- **🌲 High-Performance Vegetation**: Specialized InstancedMesh rendering engine capable of displaying thousands of trees and forest areas with zero frame drops.
- **📡 Real-time Radar**: Professional MiniMap UI for tactical 2D city tracking and vehicle localization.
- **📥 Professional Exports**:
    *   **Clean GLB**: Export production-ready 3D models containing only city assets (optimized for Blender/Unity/Unreal).
    *   **GIS GeoJSON**: Download comprehensive geospatial data (Buildings, Roads, Water, Parks) with integrated height attributes for QGIS/ArcGIS extrusion.

## 🛠️ Technology Stack

- **Core**: React, TypeScript, Vite
- **3D Engine**: Three.js, React-Three-Fiber, Drei
- **Spatial Indexing**: `three-mesh-bvh` for ultra-fast raycasting and interaction.
- **Data Source**: OpenStreetMap (via Overpass API)
- **State Management**: Zustand (Atomic State Architecture)

## 📦 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cartesiancs/map3d.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🗺️ Roadmap

- [x] Create 3D Buildings
- [x] Create Roads
- [x] Export GLB
- [ ] Building Texture
- [ ] Height Customization
- [ ] Material
- [ ] Heightmap

## 👥 Contributors

- **Hyeong Jun Huh** ([GitHub](https://github.com/cartesiancs))

## ⚖️ Disclaimer

> [!IMPORTANT]
> 📢 **This project cannot guarantee the accuracy of the data.** Since it uses OpenStreetMap data, some height values may be missing or incorrectly recorded. To address this issue, an option will be added in the future to allow users to manually correct the data.

---
Built with ❤️ by [CartesianCS](https://github.com/cartesiancs)
