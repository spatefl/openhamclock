/**
 * POTAPanel Component
 * Displays Parks on the Air activations with ON/OFF toggle (compact version)
 */
import React from 'react';

export const POTAPanel = ({ data, loading, showOnMap, onToggleMap }) => {
  return (
    <div className="panel" style={{ padding: '8px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '6px',
        fontSize: '11px'
      }}>
        <span>△ POTA ACTIVATORS</span>
        <button
          onClick={onToggleMap}
          title={showOnMap ? 'Hide POTA activators on map' : 'Show POTA activators on map'}
          style={{
            background: showOnMap ? 'rgba(170, 102, 255, 0.3)' : 'rgba(100, 100, 100, 0.3)',
            border: `1px solid ${showOnMap ? '#aa66ff' : '#666'}`,
            color: showOnMap ? '#aa66ff' : '#888',
            padding: '1px 6px',
            borderRadius: '3px',
            fontSize: '9px',
            fontFamily: 'JetBrains Mono',
            cursor: 'pointer'
          }}
        >
          ⊞ Map {showOnMap ? 'ON' : 'OFF'}
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
            <div className="loading-spinner" />
          </div>
        ) : data && data.length > 0 ? (
          <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
            {data.slice(0, 5).map((spot, i) => (
              <div 
                key={`${spot.call}-${i}`}
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: '60px 60px 1fr',
                  gap: '6px',
                  padding: '3px 0',
                  borderBottom: i < Math.min(data.length, 5) - 1 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>
                  {spot.call}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {spot.ref}
                </span>
                <span style={{ color: 'var(--accent-cyan)', textAlign: 'right' }}>
                  {spot.freq}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '10px', fontSize: '11px' }}>
            No POTA spots
          </div>
        )}
      </div>
    </div>
  );
};

export default POTAPanel;
