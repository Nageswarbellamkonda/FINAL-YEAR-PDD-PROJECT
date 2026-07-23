const fs = require('fs');

let patrol = fs.readFileSync('c:/PDD WEB PROJECT/database/patrol_logs.sql', 'utf8');
patrol = patrol.replace(
    /INSERT INTO patrol_logs \(patrol_unit, vehicle_number, district, route_name, status, officer_in_charge, latitude, longitude, incidents_checked, km_covered\) VALUES/g,
    "INSERT INTO patrol_logs (patrol_unit, vehicle_number, district, route_name, start_time, end_time, status, officer_in_charge, latitude, longitude, incidents_checked, km_covered) VALUES"
);
patrol = patrol.replace(
    /\('([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', ([\d\.]+), ([\d\.]+), (\d+), ([\d\.]+)\)/g,
    "('', '', '', '', NOW() - INTERVAL '4 hours', NULL, '', '', , , , )"
);
fs.writeFileSync('c:/PDD WEB PROJECT/database/patrol_logs.sql', patrol);

let cmd = fs.readFileSync('c:/PDD WEB PROJECT/database/command_center.sql', 'utf8');
cmd = cmd.replace(/'contained'/g, "'active'");
fs.writeFileSync('c:/PDD WEB PROJECT/database/command_center.sql', cmd);

console.log('Seeds patched successfully.');
