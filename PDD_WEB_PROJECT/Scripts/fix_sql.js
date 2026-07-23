const fs = require('fs');

// Fix missing_persons.sql
let missing = fs.readFileSync('database/missing_persons.sql', 'utf8');
missing = missing.replace('CREATE TABLE IF NOT EXISTS missing_persons', 'CREATE TABLE IF NOT EXISTS public.missing_persons');
missing = missing.replace(
  'INSERT INTO missing_persons (case_number, person_name, age, gender, district, last_seen_location, last_seen_date, physical_description, contact_guardian, contact_phone, status, assigned_team) VALUES',
  'INSERT INTO public.missing_persons (full_name, age, gender, last_seen_location, last_seen_date, physical_description, contact_person_name, contact_person_phone, status) VALUES'
);
missing = missing.replace(/\\('MP[^']+', )('[^']+', )(\\d+, )('[^']+', )('[^']+', )('[^']+', )([^,]+, )('[^']+', )('[^']+', )('[^']+', )('[^']+', )('[^']+')\\)/g, (match, case_num, name, age, gender, district, loc, date, desc, guardian, phone, status, team) => {
    let newStatus = status.replace(/'tracing'/, "'missing'").replace(/'found'/, "'found_safe'");
    return ();
});
fs.writeFileSync('database/missing_persons.sql', missing);

// Fix patrol_logs.sql
let patrol = fs.readFileSync('database/patrol_logs.sql', 'utf8');
patrol = patrol.replace(
  'INSERT INTO patrol_logs (patrol_unit, vehicle_number, district, route_name, start_time, end_time, status, officer_in_charge, latitude, longitude, incidents_checked, km_covered) VALUES',
  'INSERT INTO public.patrol_logs (start_time, end_time, status) VALUES'
);
patrol = patrol.replace(/\\(('[^']+', ){4}([^,]+, )([^,]+, )('[^']+', )('[^']+', )([\\d\\.]+, )([\\d\\.]+, )(\\d+, )([\\d\\.]+)\\)/g, (match, u, v, d, r, st, et, stat, o, lat, lon, inc, km) => {
    return (); // slice removes extra comma
});
fs.writeFileSync('database/patrol_logs.sql', patrol);

// Fix command_center.sql
let cmd = fs.readFileSync('database/command_center.sql', 'utf8');
cmd = cmd.replace(
  'INSERT INTO command_center_events (event_id, event_type, priority, location, district, latitude, longitude, status, assigned_units, reported_by) VALUES',
  'INSERT INTO public.command_center_events (priority, status) VALUES'
);
cmd = cmd.replace(/\\(('[^']+', ){2}('[^']+', )('[^']+', ){2}([\\d\\.]+, ){2}('[^']+', )('[^']+', )('[^']+')\\)/g, (match, e1, e2, p, l1, l2, lat, lon, s, a, r) => {
    return ();
});
fs.writeFileSync('database/command_center.sql', cmd);

// Fix cyber_cases.sql
let cyber = fs.readFileSync('database/cyber_cases.sql', 'utf8');
cyber = cyber.replace('CREATE TABLE IF NOT EXISTS cyber_cases', 'CREATE TABLE IF NOT EXISTS public.cyber_crime_reports');
cyber = cyber.replace('INSERT INTO cyber_cases', 'INSERT INTO public.cyber_crime_reports');
cyber = cyber.replace(
    '(case_number, report_date, threat_level, attack_type, financial_loss, amount_recovered, victim_name, victim_phone, victim_district, bank_involved, transaction_id, fraud_account_number, investigation_status)',
    '(report_date, description, status)'
);
cyber = cyber.replace(/\\(('[^']+', )([^,]+, )('[^']+', ){2}(\\d+, )(\\d+, )('[^']+', ){6}('[^']+')\\)/g, (match, c, d, t, a, f, r, v, p, d2, b, tx, fa, s) => {
    let desc = 'Cyber crime related to ' || ;
    let stat = s.replace(/'investigating'/, "'open'").replace(/'resolved'/, "'closed'").replace(/'pending'/, "'open'");
    return (, );
});
fs.writeFileSync('database/cyber_cases.sql', cyber);

console.log("SQL fixed.");
