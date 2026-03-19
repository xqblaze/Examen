import React from 'react';
import { api } from '../../lib/api.js';
import { ZoneMap } from '../components/ZoneMap.jsx';

const intervals = [
  { value: 'I0800_1200', label: '08:00–12:00' },
  { value: 'I1200_1600', label: '12:00–16:00' },
  { value: 'I1600_2000', label: '16:00–20:00' }
];

export function ManagerDashboard() {
  const [pending, setPending] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [zones, setZones] = React.useState([]);
  const [duties, setDuties] = React.useState([]);

  const [zoneName, setZoneName] = React.useState('Zone A');
  const [zonePolygon, setZonePolygon] = React.useState(null);

  const [dutyEmployeeId, setDutyEmployeeId] = React.useState('');
  const [dutyZoneId, setDutyZoneId] = React.useState('');
  const [dutyDate, setDutyDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [dutyInterval, setDutyInterval] = React.useState('I0800_1200');

  const [reportStart, setReportStart] = React.useState(new Date().toISOString().slice(0, 10));
  const [reportEnd, setReportEnd] = React.useState(new Date().toISOString().slice(0, 10));
  const [reportRows, setReportRows] = React.useState([]);
  const [reportDoc, setReportDoc] = React.useState(null);

  const load = React.useCallback(async () => {
    const [p, e, z, d] = await Promise.all([
      api.get('/manager/users/pending'),
      api.get('/manager/employees'),
      api.get('/manager/zones'),
      api.get('/manager/duties')
    ]);
    setPending(p.data.users);
    setEmployees(e.data.users);
    setZones(z.data.zones);
    setDuties(d.data.duties);

    if (!dutyEmployeeId && e.data.users?.[0]?.id) setDutyEmployeeId(e.data.users[0].id);
    if (!dutyZoneId && z.data.zones?.[0]?.id) setDutyZoneId(z.data.zones[0].id);
  }, [dutyEmployeeId, dutyZoneId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const approve = async (userId) => {
    await api.post('/manager/users/approve', { userId, role: 'employee' });
    await load();
  };

  const createZone = async () => {
    if (!zonePolygon) return;
    await api.post('/manager/zones', { name: zoneName, polygon: zonePolygon });
    setZonePolygon(null);
    await load();
  };

  const deleteZone = async (id) => {
    await api.delete(`/manager/zones/${id}`);
    await load();
  };

  const createDuty = async () => {
    await api.post('/manager/duties', {
      employeeId: dutyEmployeeId,
      zoneId: dutyZoneId,
      date: dutyDate,
      interval: dutyInterval
    });
    await load();
  };

  const deleteDuty = async (id) => {
    await api.delete(`/manager/duties/${id}`);
    await load();
  };

  const runReport = async (exportToGoogleDoc) => {
    const res = await api.post('/manager/reports', { startDate: reportStart, endDate: reportEnd, exportToGoogleDoc });
    setReportRows(res.data.rows || []);
    setReportDoc(res.data.googleDoc || null);
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Approvals</h2>
        {pending.length === 0 ? (
          <div className="muted">No pending users.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>login</th>
                <th>name</th>
                <th>created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.id}>
                  <td>{u.login}</td>
                  <td className="muted">{u.displayName || '-'}</td>
                  <td className="muted">{new Date(u.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="primary" onClick={() => approve(u.id)}>
                      Approve as employee
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Zones</h2>
        <div className="muted">Draw a polygon on the map, name it, and save.</div>
        <div style={{ marginTop: 10 }} className="row">
          <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="Zone name" />
          <button className="primary" onClick={createZone} disabled={!zonePolygon}>
            Save zone
          </button>
          {!zonePolygon ? <span className="badge warn">Draw polygon first</span> : <span className="badge ok">Polygon ready</span>}
        </div>
        <div style={{ marginTop: 12 }}>
          <ZoneMap zones={zones} onCreatePolygon={setZonePolygon} readOnly={false} />
        </div>
        <div style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>name</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id}>
                  <td>{z.name}</td>
                  <td>
                    <button className="danger" onClick={() => deleteZone(z.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {zones.length === 0 ? (
                <tr>
                  <td className="muted" colSpan={2}>
                    No zones yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Schedule duty</h2>
        <div className="row">
          <select value={dutyEmployeeId} onChange={(e) => setDutyEmployeeId(e.target.value)}>
            {employees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.login}
              </option>
            ))}
          </select>
          <select value={dutyZoneId} onChange={(e) => setDutyZoneId(e.target.value)}>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <input type="date" value={dutyDate} onChange={(e) => setDutyDate(e.target.value)} />
          <select value={dutyInterval} onChange={(e) => setDutyInterval(e.target.value)}>
            {intervals.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
          <button className="primary" onClick={createDuty} disabled={!dutyEmployeeId || !dutyZoneId}>
            Create duty
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>date</th>
                <th>interval</th>
                <th>employee</th>
                <th>zone</th>
                <th>calendar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {duties.map((d) => (
                <tr key={d.id}>
                  <td>{new Date(d.date).toISOString().slice(0, 10)}</td>
                  <td>{intervals.find((i) => i.value === d.interval)?.label || d.interval}</td>
                  <td>{d.employee?.login}</td>
                  <td className="muted">{d.zone?.name}</td>
                  <td className="muted">{d.googleEventId ? <span className="badge ok">saved</span> : <span className="badge">n/a</span>}</td>
                  <td>
                    <button className="danger" onClick={() => deleteDuty(d.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {duties.length === 0 ? (
                <tr>
                  <td className="muted" colSpan={6}>
                    No duties yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Report</h2>
        <div className="row">
          <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
          <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
          <button className="primary" onClick={() => runReport(false)}>
            Generate
          </button>
          <button className="primary" onClick={() => runReport(true)}>
            Generate + Google Doc
          </button>
          {reportDoc?.link ? (
            <a className="pill" href={reportDoc.link} target="_blank" rel="noreferrer">
              Open Google Doc
            </a>
          ) : reportDoc?.skipped ? (
            <span className="badge warn">{reportDoc.reason || 'Google doc skipped'}</span>
          ) : null}
        </div>
        <div style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>date</th>
                <th>interval</th>
                <th>grass</th>
                <th>shrub</th>
                <th>tree</th>
                <th>total</th>
                <th>endangered</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.date}</td>
                  <td>{r.intervalLabel}</td>
                  <td className="muted">
                    {r.grass.total}/{r.grass.endangered}
                  </td>
                  <td className="muted">
                    {r.shrub.total}/{r.shrub.endangered}
                  </td>
                  <td className="muted">
                    {r.tree.total}/{r.tree.endangered}
                  </td>
                  <td>{r.total}</td>
                  <td>{r.endangered}</td>
                </tr>
              ))}
              {reportRows.length === 0 ? (
                <tr>
                  <td className="muted" colSpan={7}>
                    No data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

