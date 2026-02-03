import { useState, useEffect } from 'react';

/**
 * WSPR Propagation Heatmap Plugin
 * 
 * Visualizes global WSPR (Weak Signal Propagation Reporter) activity as:
 * - Path lines between transmitters and receivers
 * - Color-coded by signal strength (SNR)
 * - Optional band filtering
 * - Real-time propagation visualization
 * 
 * Data source: PSK Reporter API (WSPR mode spots)
 * Update interval: 5 minutes
 */

export const metadata = {
  id: 'wspr',
  name: 'WSPR Propagation',
  description: 'Live WSPR spots showing global HF propagation paths (last 30 min)',
  icon: '📡',
  category: 'propagation',
  defaultEnabled: false,
  defaultOpacity: 0.7,
  version: '1.0.0'
};

// Convert grid square to lat/lon
function gridToLatLon(grid) {
  if (!grid || grid.length < 4) return null;
  
  grid = grid.toUpperCase();
  const lon = (grid.charCodeAt(0) - 65) * 20 - 180;
  const lat = (grid.charCodeAt(1) - 65) * 10 - 90;
  const lon2 = parseInt(grid[2]) * 2;
  const lat2 = parseInt(grid[3]);
  
  let longitude = lon + lon2 + 1;
  let latitude = lat + lat2 + 0.5;
  
  if (grid.length >= 6) {
    const lon3 = (grid.charCodeAt(4) - 65) * (2/24);
    const lat3 = (grid.charCodeAt(5) - 65) * (1/24);
    longitude = lon + lon2 + lon3 + (1/24);
    latitude = lat + lat2 + lat3 + (0.5/24);
  }
  
  return { lat: latitude, lon: longitude };
}

// Get color based on SNR
function getSNRColor(snr) {
  if (snr === null || snr === undefined) return '#888888';
  if (snr < -20) return '#ff0000';
  if (snr < -10) return '#ff6600';
  if (snr < 0) return '#ffaa00';
  if (snr < 5) return '#ffff00';
  return '#00ff00';
}

// Get line weight based on SNR
function getLineWeight(snr) {
  if (snr === null || snr === undefined) return 1;
  if (snr < -20) return 1;
  if (snr < -10) return 1.5;
  if (snr < 0) return 2;
  if (snr < 5) return 2.5;
  return 3;
}

export function useLayer({ enabled = false, opacity = 0.7, map = null }) {
  const [pathLayers, setPathLayers] = useState([]);
  const [markerLayers, setMarkerLayers] = useState([]);
  const [wsprData, setWsprData] = useState([]);
  const [bandFilter] = useState('all');

  // Fetch WSPR data
  useEffect(() => {
    if (!enabled) return;

    const fetchWSPR = async () => {
      try {
        const response = await fetch(`/api/wspr/heatmap?minutes=30&band=${bandFilter}`);
        if (response.ok) {
          const data = await response.json();
          setWsprData(data.spots || []);
          console.log(`[WSPR Plugin] Loaded ${data.spots?.length || 0} spots`);
        }
      } catch (err) {
        console.error('WSPR data fetch error:', err);
      }
    };

    fetchWSPR();
    const interval = setInterval(fetchWSPR, 300000);

    return () => clearInterval(interval);
  }, [enabled, bandFilter]);

  // Render WSPR paths on map
  useEffect(() => {
    if (!map || typeof L === 'undefined') return;

    pathLayers.forEach(layer => {
      try {
        map.removeLayer(layer);
      } catch (e) {}
    });
    markerLayers.forEach(layer => {
      try {
        map.removeLayer(layer);
      } catch (e) {}
    });
    setPathLayers([]);
    setMarkerLayers([]);

    if (!enabled || wsprData.length === 0) return;

    const newPaths = [];
    const newMarkers = [];
    
    const txStations = new Set();
    const rxStations = new Set();

    const limitedData = wsprData.slice(0, 500);

    limitedData.forEach(spot => {
      const path = L.polyline(
        [
          [spot.senderLat, spot.senderLon],
          [spot.receiverLat, spot.receiverLon]
        ],
        {
          color: getSNRColor(spot.snr),
          weight: getLineWeight(spot.snr),
          opacity: opacity * 0.6,
          dashArray: '5, 5'
        }
      );

      const snrStr = spot.snr !== null ? `${spot.snr} dB` : 'N/A';
      const ageStr = spot.age < 60 ? `${spot.age} min ago` : `${Math.floor(spot.age / 60)}h ago`;
      
      path.bindPopup(`
        <div style="font-family: 'JetBrains Mono', monospace; min-width: 220px;">
          <div style="font-size: 14px; font-weight: bold; color: ${getSNRColor(spot.snr)}; margin-bottom: 6px;">
            📡 WSPR Spot
          </div>
          <table style="font-size: 11px; width: 100%;">
            <tr><td><b>TX:</b></td><td>${spot.sender} (${spot.senderGrid})</td></tr>
            <tr><td><b>RX:</b></td><td>${spot.receiver} (${spot.receiverGrid})</td></tr>
            <tr><td><b>Freq:</b></td><td>${spot.freqMHz} MHz (${spot.band})</td></tr>
            <tr><td><b>SNR:</b></td><td style="color: ${getSNRColor(spot.snr)}; font-weight: bold;">${snrStr}</td></tr>
            <tr><td><b>Time:</b></td><td>${ageStr}</td></tr>
          </table>
        </div>
      `);

      path.addTo(map);
      newPaths.push(path);

      const txKey = `${spot.sender}-${spot.senderGrid}`;
      if (!txStations.has(txKey)) {
        txStations.add(txKey);
        
        const txMarker = L.circleMarker([spot.senderLat, spot.senderLon], {
          radius: 4,
          fillColor: '#ff6600',
          color: '#ffffff',
          weight: 1,
          fillOpacity: opacity * 0.8,
          opacity: opacity
        });

        txMarker.bindTooltip(`TX: ${spot.sender}`, { permanent: false, direction: 'top' });
        txMarker.addTo(map);
        newMarkers.push(txMarker);
      }

      const rxKey = `${spot.receiver}-${spot.receiverGrid}`;
      if (!rxStations.has(rxKey)) {
        rxStations.add(rxKey);
        
        const rxMarker = L.circleMarker([spot.receiverLat, spot.receiverLon], {
          radius: 4,
          fillColor: '#0088ff',
          color: '#ffffff',
          weight: 1,
          fillOpacity: opacity * 0.8,
          opacity: opacity
        });

        rxMarker.bindTooltip(`RX: ${spot.receiver}`, { permanent: false, direction: 'top' });
        rxMarker.addTo(map);
        newMarkers.push(rxMarker);
      }
    });

    setPathLayers(newPaths);
    setMarkerLayers(newMarkers);
    
    console.log(`[WSPR Plugin] Rendered ${newPaths.length} paths, ${newMarkers.length} markers`);

    return () => {
      newPaths.forEach(layer => {
        try {
          map.removeLayer(layer);
        } catch (e) {}
      });
      newMarkers.forEach(layer => {
        try {
          map.removeLayer(layer);
        } catch (e) {}
      });
    };
  }, [enabled, wsprData, map, opacity]);

  useEffect(() => {
    pathLayers.forEach(layer => {
      if (layer.setStyle) {
        layer.setStyle({ opacity: opacity * 0.6 });
      }
    });
    markerLayers.forEach(layer => {
      if (layer.setStyle) {
        layer.setStyle({ 
          fillOpacity: opacity * 0.8,
          opacity: opacity
        });
      }
    });
  }, [opacity, pathLayers, markerLayers]);

  return {
    paths: pathLayers,
    markers: markerLayers,
    spotCount: wsprData.length
  };
}
