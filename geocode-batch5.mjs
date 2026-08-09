import pg from 'pg';
import { setTimeout as sleep } from 'timers/promises';
const { Pool } = pg;
const pool = new Pool({ 
  host: 'helium', user: 'postgres', password: 'password', database: 'heliumdb', max: 2
});
const UA = 'MappingWithMelanin/1.0 (geocoding@mappingwithmelanin.com)';

async function geocode(address, city, state) {
  const q = address.replace(/\s*\([^)]+\)/g, '').trim();
  const params = new URLSearchParams({ q: `${q}, ${city}, ${state}`, format: 'json', limit: '1', countrycodes: 'us' });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  if (!data?.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

const TARGET = ['Washington','Montgomery','New Orleans','Raleigh','Mobile','Houston','Las Vegas','New York City','Nashville','Tuskegee','Atlanta','Kansas City','Portland','San Antonio','Tampa','Phoenix','Orlando','Baltimore','Los Angeles','Denver','Charlotte','Seattle','Boston','Chicago','Detroit','Cleveland','Dallas','Oakland','St. Louis','Newark'];

const { rows } = await pool.query(`
  WITH centroids AS (
    SELECT ROUND(latitude::numeric,4) as lat, ROUND(longitude::numeric,4) as lng, city, state
    FROM businesses WHERE status='active'
    GROUP BY ROUND(latitude::numeric,4), ROUND(longitude::numeric,4), city, state
    HAVING COUNT(*) >= 3
  )
  SELECT b.id, b.name, b.address, b.city, b.state,
    b.latitude::float as clat, b.longitude::float as clng
  FROM businesses b
  JOIN centroids c ON ROUND(b.latitude::numeric,4)=c.lat AND ROUND(b.longitude::numeric,4)=c.lng
    AND b.city=c.city AND b.state=c.state
  WHERE b.status='active' AND b.city=ANY($1)
    AND b.address IS NOT NULL AND b.address ~ '\\d'
    AND b.address NOT LIKE '%Various%' AND b.address NOT LIKE '%pop-up%'
    AND b.address NOT LIKE '%Multiple%'
  ORDER BY b.city, b.name
`, [TARGET]);

console.log('Processing: ' + rows.length + ' businesses in ' + TARGET.length + ' cities');
let ok=0, fail=0;
for (const biz of rows) {
  try {
    await sleep(1100);
    const r = await geocode(biz.address, biz.city, biz.state);
    if (!r || Math.abs(r.lat-biz.clat)>3 || Math.abs(r.lng-biz.clng)>3) { 
      console.log('FAIL: ' + biz.city + ' | ' + biz.name);
      fail++; continue; 
    }
    await pool.query('UPDATE businesses SET latitude=$1, longitude=$2 WHERE id=$3',
      [r.lat.toFixed(7), r.lng.toFixed(7), biz.id]);
    console.log('OK: ' + biz.city + ' | ' + biz.name);
    ok++;
  } catch(e) { 
    console.log('ERR: ' + biz.name + ' | ' + e.message);
    fail++; await sleep(2000); 
  }
}
console.log('DONE: ' + ok + ' ok, ' + fail + ' fail');
await pool.end();
