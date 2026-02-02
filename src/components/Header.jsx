/**
 * Header Component
 * Top bar with callsign, clocks, weather, and controls
 */
import React from 'react';

export const Header = ({
  config,
  utcTime,
  utcDate,
  localTime,
  localDate,
  localWeather,
  spaceWeather,
  use12Hour,
  onTimeFormatToggle,
  onSettingsClick,
  onFullscreenToggle,
  isFullscreen
}) => {
  return (
    <div style={{ 
      gridColumn: '1 / -1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-color)',
      borderRadius: '6px',
      padding: '8px 20px',
      minHeight: '60px',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      {/* Callsign & Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span 
          style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-amber)', cursor: 'pointer', fontFamily: 'Orbitron, monospace' }}
          onClick={onSettingsClick}
          title="Click for settings"
        >
          {config.callsign}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>v3.7.0</span>
      </div>
      
      {/* UTC Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', color: 'var(--accent-cyan)', fontWeight: '600', width: '36px' }}>UTC</span>
        <span style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: 'var(--accent-cyan)', 
          fontFamily: 'JetBrains Mono, Consolas, monospace',
          width: '95px',
          display: 'inline-block',
          textAlign: 'center'
        }}>{utcTime}</span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '115px', display: 'inline-block' }}>{utcDate}</span>
      </div>
      
      {/* Local Clock - Clickable to toggle 12/24 hour format */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={onTimeFormatToggle}
        title={`Click to switch to ${use12Hour ? '24-hour' : '12-hour'} format`}
      >
        <span style={{ fontSize: '14px', color: 'var(--accent-amber)', fontWeight: '600', width: '50px' }}>LOCAL</span>
        <span style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: 'var(--accent-amber)', 
          fontFamily: 'JetBrains Mono, Consolas, monospace',
          width: use12Hour ? '130px' : '95px',
          display: 'inline-block',
          textAlign: 'center'
        }}>{localTime}</span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '115px', display: 'inline-block' }}>{localDate}</span>
      </div>
      
      {/* Weather & Solar Stats */}
      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontFamily: 'JetBrains Mono, Consolas, monospace' }}>
        {localWeather?.data && (
          <div title={`${localWeather.data.description} • Wind: ${localWeather.data.windSpeed} mph`} style={{ width: '120px' }}>
            <span style={{ marginRight: '4px' }}>{localWeather.data.icon}</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
              {localWeather.data.temp}°F / {Math.round((localWeather.data.temp - 32) * 5/9)}°C
            </span>
          </div>
        )}
        <div style={{ width: '65px' }}>
          <span style={{ color: 'var(--text-muted)' }}>SFI </span>
          <span style={{ color: 'var(--accent-amber)', fontWeight: '700', fontSize: '16px' }}>{spaceWeather?.data?.solarFlux || '--'}</span>
        </div>
        <div style={{ width: '40px' }}>
          <span style={{ color: 'var(--text-muted)' }}>K </span>
          <span style={{ color: parseInt(spaceWeather?.data?.kIndex) >= 4 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: '700', fontSize: '16px' }}>
            {spaceWeather?.data?.kIndex ?? '--'}
          </span>
        </div>
        <div style={{ width: '70px' }}>
          <span style={{ color: 'var(--text-muted)' }}>SSN </span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '16px' }}>{spaceWeather?.data?.sunspotNumber || '--'}</span>
        </div>
      </div>
      
      {/* Settings & Fullscreen Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <a
          href="https://buymeacoffee.com/k0cjh"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'linear-gradient(135deg, #ff813f 0%, #ffdd00 100%)', 
            border: 'none',
            padding: '8px 14px', 
            borderRadius: '4px', 
            color: '#000',
            fontSize: '13px', 
            cursor: 'pointer',
            fontWeight: '600', 
            textDecoration: 'none',
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px'
          }}
          title="Buy me a coffee!"
        >
          ☕ Donate
        </a>
        <button
          onClick={onSettingsClick}
          style={{ 
            background: 'var(--bg-tertiary)', 
            border: '1px solid var(--border-color)', 
            padding: '8px 14px', 
            borderRadius: '4px', 
            color: 'var(--text-secondary)', 
            fontSize: '13px', 
            cursor: 'pointer' 
          }}
        >
          ⚙ Settings
        </button>
        <button
          onClick={onFullscreenToggle}
          style={{ 
            background: isFullscreen ? 'rgba(0, 255, 136, 0.15)' : 'var(--bg-tertiary)', 
            border: `1px solid ${isFullscreen ? 'var(--accent-green)' : 'var(--border-color)'}`, 
            padding: '8px 14px', 
            borderRadius: '4px', 
            color: isFullscreen ? 'var(--accent-green)' : 'var(--text-secondary)', 
            fontSize: '13px', 
            cursor: 'pointer' 
          }}
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
        >
          {isFullscreen ? '⛶ Exit' : '⛶ Full'}
        </button>
      </div>
    </div>
  );
};

export default Header;
