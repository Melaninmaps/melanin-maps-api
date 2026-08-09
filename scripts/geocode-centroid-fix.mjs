#!/usr/bin/env node
/**
 * Fix businesses geocoded to city centroids using Nominatim (OpenStreetMap).
 * Nominatim is free, no API key, but requires ≥1s delay between requests.
 */

import pg from 'pg';
import { setTimeout as sleep } from 'timers/promises';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('.internal') ? false : { rejectUnauthorized: false },
  max: 2,
});

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MappingWithMelanin/1.0 (geocoding@mappingwithmelanin.com)';

/** Returns true if the address has a street number — worth geocoding precisely */
function hasStreetAddress(address) {
  if (!address) return false;
  const vague = ['various', 'pop-up', 'multiple locations', ', al\n', 'area\n',
    'downtown,', 'midtown,', 'uptown,', 'westview,', 'district,', 'corridor,',
    'neighborhood', 'westside,', 'east side,', 'central district'];
  const lower = address.toLowerCase();
  if (vague.some(v => lower.includes(v))) return false;
  // Must contain a digit (likely street number)
  if (!/\d/.test(address)) return false;
  return true;
}

/** Clean address — strip parenthetical extras */
function cleanAddress(address) {
  return address
    .replace(/\s*\(also[^)]+\)/gi, '')
    .replace(/\s*\([^)]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function geocode(address, city, state) {
  const cleaned = cleanAddress(address);
  const params = new URLSearchParams({
    q: `${cleaned}, ${city}, ${state}`,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
    addressdetails: '0',
  });
  
  const res = await fetch(`${NOMINATIM}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.length) return null;
  
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

async function main() {
  console.log('🗺️  Geocoding centroid-pinned businesses (Nominatim)...\n');

  const { rows: businesses } = await pool.query(`
    WITH centroids AS (
      SELECT ROUND(latitude::numeric,4) as lat, ROUND(longitude::numeric,4) as lng, city, state
      FROM businesses WHERE status='active'
      GROUP BY ROUND(latitude::numeric,4), ROUND(longitude::numeric,4), city, state
      HAVING COUNT(*) >= 5
    )
    SELECT b.id, b.name, b.address, b.city, b.state,
           b.latitude::float as centroid_lat, b.longitude::float as centroid_lng
    FROM businesses b
    JOIN centroids c ON ROUND(b.latitude::numeric,4)=c.lat AND ROUND(b.longitude::numeric,4)=c.lng
      AND b.city=c.city AND b.state=c.state
    WHERE b.status='active'
    ORDER BY b.city, b.name
  `);

  console.log(`Found ${businesses.length} businesses in centroid clusters\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let noStreet = 0;

  for (const biz of businesses) {
    if (!hasStreetAddress(biz.address)) {
      noStreet++;
      continue;
    }

    try {
      await sleep(1100); // Nominatim requires ≥1s between requests
      
      const result = await geocode(biz.address, biz.city, biz.state);
      
      if (!result) {
        console.log(`❌ FAIL: ${biz.name} — "${biz.address}"`);
        failed++;
        continue;
      }

      // Safety: ensure result is near original centroid (within ~2 degrees ≈ 200km)
      const latDiff = Math.abs(result.lat - biz.centroid_lat);
      const lngDiff = Math.abs(result.lng - biz.centroid_lng);
      if (latDiff > 2 || lngDiff > 2) {
        console.log(`⚠️  FAR: ${biz.name} diff=(${latDiff.toFixed(2)},${lngDiff.toFixed(2)})`);
        skipped++;
        continue;
      }

      await pool.query(
        `UPDATE businesses SET latitude=$1::numeric, longitude=$2::numeric WHERE id=$3`,
        [result.lat.toFixed(7), result.lng.toFixed(7), biz.id]
      );

      console.log(`✅ ${biz.name} | ${biz.address}`);
      console.log(`   ${biz.centroid_lat.toFixed(6)},${biz.centroid_lng.toFixed(6)} → ${result.lat.toFixed(6)},${result.lng.toFixed(6)}\n`);
      updated++;
    } catch (err) {
      console.error(`❌ ERROR: ${biz.name} — ${err.message}`);
      failed++;
      await sleep(2000);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Updated:        ${updated}`);
  console.log(`⏭️  No street addr: ${noStreet}`);
  console.log(`⚠️  Skipped (far):  ${skipped}`);
  console.log(`❌ Failed:          ${failed}`);
  console.log(`   Total:           ${businesses.length}`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
