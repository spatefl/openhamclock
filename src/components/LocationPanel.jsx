/**
 * LocationPanel Component
 * Displays DE and DX location info with grid squares and sun times
 */
import React from 'react';
import { calculateGridSquare, calculateBearing, calculateDistance, getMoonPhase, getMoonPhaseEmoji } from '../utils/geo.js';

export const LocationPanel = ({
  config,
  dxLocation,
  deSunTimes,
  dxSunTimes,
  currentTime
}) => {
  const deGrid = calculateGridSquare(config.location.lat, config.location.lon);
  const dxGrid = calculateGridSquare(dxLocation.lat, dxLocation.lon);
  const bearing = calculateBearing(config.location.lat, config.location.lon, dxLocation.lat, dxLocation.lon);
  const distance = calculateDistance(config.location.lat, config.location.lon, dxLocation.lat, dxLocation.lon);
  const moonPhase = getMoonPhase(currentTime);
  const moonEmoji = getMoonPhaseEmoji(moonPhase);

  return (
    <div className="panel" style={{ padding: '12px' }}>
      <div className="panel-header">◎ LOCATIONS</div>
      
      {/* DE Location */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <span style={{ 
            color: 'var(--accent-amber)', 
            fontWeight: '700', 
            fontSize: '14px' 
          }}>
            DE: {config.callsign}
          </span>
          <span style={{ 
            color: 'var(--accent-green)', 
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px'
          }}>
            {deGrid}
          </span>
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          {config.location.lat.toFixed(4)}°, {config.location.lon.toFixed(4)}°
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--text-secondary)',
          marginTop: '4px'
        }}>
          ☀ {deSunTimes.sunrise} / {deSunTimes.sunset} UTC
        </div>
      </div>
      
      {/* DX Location */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <span style={{ 
            color: 'var(--accent-blue)', 
            fontWeight: '700', 
            fontSize: '14px' 
          }}>
            DX Target
          </span>
          <span style={{ 
            color: 'var(--accent-green)', 
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px'
          }}>
            {dxGrid}
          </span>
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          {dxLocation.lat.toFixed(4)}°, {dxLocation.lon.toFixed(4)}°
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--text-secondary)',
          marginTop: '4px'
        }}>
          ☀ {dxSunTimes.sunrise} / {dxSunTimes.sunset} UTC
        </div>
      </div>
      
      {/* Path Info */}
      <div style={{ 
        padding: '10px',
        background: 'var(--bg-tertiary)',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BEARING</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: 'var(--accent-cyan)',
              fontFamily: 'Orbitron, monospace'
            }}>
              {bearing.toFixed(0)}°
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DISTANCE</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: 'var(--accent-cyan)',
              fontFamily: 'Orbitron, monospace'
            }}>
              {distance.toFixed(0)} km
            </div>
          </div>
        </div>
      </div>
      
      {/* Moon Phase */}
      <div style={{ 
        textAlign: 'center',
        padding: '8px',
        background: 'var(--bg-tertiary)',
        borderRadius: '6px'
      }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>{moonEmoji}</span>
        <span style={{ 
          fontSize: '11px', 
          color: 'var(--text-secondary)' 
        }}>
          {moonPhase < 0.25 ? 'Waxing' : moonPhase < 0.5 ? 'Waxing' : moonPhase < 0.75 ? 'Waning' : 'Waning'}
          {' '}
          {Math.round(moonPhase * 100)}%
        </span>
      </div>
    </div>
  );
};

export default LocationPanel;
