import React from 'react';
import { api } from '../../lib/api.js';
import { ZoneMap } from '../components/ZoneMap.jsx';

const intervals = {
  I0800_1200: '08:00–12:00',
  I1200_1600: '12:00–16:00',
  I1600_2000: '16:00–20:00'
};

export function EmployeeDashboard() {
  const [duties, setDuties] = React.useState([]);
  const [zones, setZones] = React.useState([]);
  const [selectedDutyId, setSelectedDutyId] = React.useState('');

  const [species, setSpecies] = React.useState('');
  const [type, setType] = React.useState('GRASS');
  const [endangered, setEndangered] = React.useState(false);
  const [detectionTime, setDetectionTime] = React.useState(new Date().toISOString().slice(0, 16));
  const [gpsLat, setGpsLat] = React.useState(55.751244);
  const [gpsLng, setGpsLng] = React.useState(37.618423);
  const [err, setErr] = React.useState('');

  const load = React.useCallback(async () => {
    const [d, z] = await Promise.all([api.get('/employee/duties'), api.get('/employee/zones')]);
    setDuties(d.data.duties || []);
    setZones(z.data.zones || []);
    if (!selectedDutyId && d.data.duties?.[0]?.id) setSelectedDutyId(d.data.duties[0].id);
  }, [selectedDutyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/employee/plant-records', {
        dutyId: selectedDutyId,
        species,
        type,
        endangered,
        detectionTime: new Date(detectionTime).toISOString(),
        gpsLat: Number(gpsLat),
        gpsLng: Number(gpsLng)
      });
      setSpecies('');
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Failed to submit');
    }
  };

  const selectedDuty = duties.find((d) => d.id === selectedDutyId) || null;

  return (
    <div className="grid">
      <div className="card">
        <h2>My duties</h2>
        <div className="row">
          <select value={selectedDutyId} onChange={(e) => setSelectedDutyId(e.target.value)}>
            {duties.map((d) => (
              <option key={d.id} value={d.id}>
                {new Date(d.date).toISOString().slice(0, 10)} {intervals[d.interval] || d.interval} — {d.zone?.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 12 }} className="muted">
          {selectedDuty ? (
            <>
              Zone: <b>{selectedDuty.zone?.name}</b> · Records: <b>{selectedDuty.plantRecords?.length || 0}</b>
            </>
          ) : (
            'No duties assigned.'
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <ZoneMap zones={zones} readOnly />
        </div>
      </div>

      <div className="card">
        <h2>Submit plant record</h2>
        <form onSubmit={submit} className="row">
          <input placeholder="species" value={species} onChange={(e) => setSpecies(e.target.value)} />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="GRASS">grass</option>
            <option value="SHRUB">shrub</option>
            <option value="TREE">tree</option>
          </select>
          <label className="pill">
            <input type="checkbox" checked={endangered} onChange={(e) => setEndangered(e.target.checked)} /> endangered
          </label>
          <input type="datetime-local" value={detectionTime} onChange={(e) => setDetectionTime(e.target.value)} />
          <input type="number" step="0.000001" value={gpsLat} onChange={(e) => setGpsLat(e.target.value)} placeholder="lat" />
          <input type="number" step="0.000001" value={gpsLng} onChange={(e) => setGpsLng(e.target.value)} placeholder="lng" />
          <button className="primary" type="submit" disabled={!selectedDutyId || !species}>
            Submit
          </button>
        </form>
        {err ? <div style={{ marginTop: 10, color: 'var(--danger)' }}>{err}</div> : null}
      </div>
    </div>
  );
}

