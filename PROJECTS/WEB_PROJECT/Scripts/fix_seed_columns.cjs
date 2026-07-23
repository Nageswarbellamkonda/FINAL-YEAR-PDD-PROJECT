const fs = require('fs');
let file = fs.readFileSync('c:/PDD WEB PROJECT/supabase/seed.sql', 'utf8');

// Fix cyber_crime_reports
file = file.replace(/case_id,/g, 'case_number,');
file = file.replace(/fraud_type,/g, 'attack_type,');
file = file.replace(/amount_lost,/g, 'financial_loss,');
file = file.replace(/bank_name,/g, 'bank_involved,');
file = file.replace(/account_number,/g, 'fraud_account_number,');
file = file.replace(/utr_transaction_id,/g, 'transaction_id,');
file = file.replace(/recovery_status,/g, 'investigation_status,');
file = file.replace(/created_date,/g, 'victim_district,'); // Replace created_date with victim_district to satisfy NOT NULL constraints if needed, wait, victim_district has a DEFAULT 'Visakhapatnam', so we can just delete created_date.
file = file.replace(/created_date,\r\n            created_at/g, 'created_at');
file = file.replace(/r\.created_at,\r\n            r\.created_at/g, 'r.created_at');

// Wait, investigation_status check constraint uses 'frozen', 'under_investigation', 'charge_sheeted', 'closed'.
// But seed uses 'pending', 'partial_recovery', 'full_recovery', 'untraceable'.
// Let's replace those too.
file = file.replace(/'pending'/g, "'under_investigation'");
file = file.replace(/'partial_recovery'/g, "'under_investigation'");
file = file.replace(/'full_recovery'/g, "'closed'");
file = file.replace(/'untraceable'/g, "'frozen'");
file = file.replace(/recovery_status/g, 'investigation_status');
file = file.replace(/amount_lost/g, 'financial_loss');

// Fix patrol_logs
file = file.replace(/zone_id,/g, 'patrol_unit, vehicle_number, district, route_name, officer_in_charge,');
file = file.replace(/v_zone_id,/g, "'Unit ' || i, 'AP-01-P-' || LPAD(i::text, 4, '0'), 'Visakhapatnam', 'Route ' || i, 'Officer ' || i,");
file = file.replace(/distance_covered_km,/g, 'km_covered,');
file = file.replace(/incidents_reported/g, 'incidents_checked');

fs.writeFileSync('c:/PDD WEB PROJECT/supabase/seed.sql', file);
console.log('Seed SQL schema column names fixed.');
