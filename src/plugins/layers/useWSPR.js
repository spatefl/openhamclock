import { useState, useEffect, useRef } from 'react';

/**
 * WSPR Propagation Heatmap Plugin v1.1.0
 * 
 * Visualizes global WSPR (Weak Signal Propagation Reporter) activity as:
 * - Great circle curved path lines between transmitters and receivers
 * - Color-coded by signal strength (SNR)
 * - Animated signal pulses along paths
 * - Statistics display (total stations, spots)
 * - Signal strength legend
 * - Optional band filtering
 * - Real-time propagation visualization
 * 
 * Data source: PSK Reporter API (WSPR mode spots)
 * Update interval: 5 minutes
 */

export const metadata = {
  id: 'wspr',
  name: 'WSPR Propagation',
  description: 'Live WSPR spots showing global HF propagation paths with curved great circle routes',
  icon: '📡',
  category: 'propagation',
  defaultEnabled: false,
  defaultOpacity: 0.7,
  version: '1.1.0'
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

// Calculate great circle path between two points
// Returns array of lat/lon points forming a smooth curve
function getGreatCirclePath(lat1, lon1, lat2, lon2, numPoints = 50) {
  const path = [];
  
  // Convert to radians
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  
  const lat1Rad = toRad(lat1);
  const lon1Rad = toRad(lon1);
  const lat2Rad = toRad(lat2);
  const lon2Rad = toRad(lon2);
  
  // Calculate great circle distance
  const d = Math.acos(
    Math.sin(lat1Rad) * Math.sin(lat2Rad) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad)
  );
  
  // Generate intermediate points along the great circle
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    
    const x = A * Math.cos(lat1Rad) * Math.cos(lon1Rad) + B * Math.cos(lat2Rad) * Math.cos(lon2Rad);
    const y = A * Math.cos(lat1Rad) * Math.sin(lon1Rad) + B * Math.cos(lat2Rad) * Math.sin(lon2Rad);
    const z = A * Math.sin(lat1Rad) + B * Math.sin(lat2Rad);
    
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lon = toDeg(Math.atan2(y, x));
    
    path.push([lat, lon]);
  }
  
  return path;
}

export function useLayer({ enabled = false, opacity = 0.7, map = null }) {
  const [pathLayers, setPathLayers] = useState([]);
  const [markerLayers, setMarkerLayers] = useState([]);
  const [wsprData, setWsprData] = useState([]);
  const [bandFilter] = useState('all');
  const [legendControl, setLegendControl] = useState(null);
  const [statsControl, setStatsControl] = useState(null);

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
      // Calculate great circle path for curved line
      const pathCoords = getGreatCirclePath(
        spot.senderLat,
        spot.senderLon,
        spot.receiverLat,
        spot.receiverLon,
        30 // Number of points for smooth curve
      );
      
      const path = L.polyline(pathCoords, {
        color: getSNRColor(spot.snr),
        weight: getLineWeight(spot.snr),
        opacity: opacity * 0.6,
        smoothFactor: 1
      });

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
    
    // Add signal strength legend
    if (!legendControl && map) {
      const LegendControl = L.Control.extend({
        options: { position: 'bottomright' },
        onAdd: function() {
          const div = L.DomUtil.create('div', 'wspr-legend');
          div.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          `;
          div.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">📡 Signal Strength</div>
            <div><span style="color: #00ff00;">●</span> Excellent (&gt; 5 dB)</div>
            <div><span style="color: #ffff00;">●</span> Good (0 to 5 dB)</div>
            <div><span style="color: #ffaa00;">●</span> Moderate (-10 to 0 dB)</div>
            <div><span style="color: #ff6600;">●</span> Weak (-20 to -10 dB)</div>
            <div><span style="color: #ff0000;">●</span> Very Weak (&lt; -20 dB)</div>
          `;
          return div;
        }
      });
      const legend = new LegendControl();
      map.addControl(legend);
      setLegendControl(legend);
    }
    
    // Add statistics display
    if (!statsControl && map) {
      const StatsControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function() {
          const div = L.DomUtil.create('div', 'wspr-stats');
          div.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          `;
          const totalStations = txStations.size + rxStations.size;
          div.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">📊 WSPR Activity</div>
            <div>Propagation Paths: ${newPaths.length}</div>
            <div>TX Stations: ${txStations.size}</div>
            <div>RX Stations: ${rxStations.size}</div>
            <div>Total Stations: ${totalStations}</div>
            <div style="margin-top: 5px; font-size: 10px; opacity: 0.7;">Last 30 minutes</div>
          `;
          return div;
        }
      });
      const stats = new StatsControl();
      map.addControl(stats);
      setStatsControl(stats);
    }
    
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
      if (legendControl && map) {
        try {
          map.removeControl(legendControl);
        } catch (e) {}
        setLegendControl(null);
      }
      if (statsControl && map) {
        try {
          map.removeControl(statsControl);
        } catch (e) {}
        setStatsControl(null);
      }
    };
  }, [enabled, wsprData, map, opacity, legendControl, statsControl]);

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
    spotCount: wsprData.length,
    legend: legendControl,
    stats: statsControl
  };
}
