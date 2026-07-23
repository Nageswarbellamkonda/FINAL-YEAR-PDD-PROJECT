const fs = require('fs');
let file = fs.readFileSync('c:/PDD WEB PROJECT/supabase/seed.sql', 'utf8');

// Add event_code and event_type to command_center_events
file = file.replace(/event_type_id,/g, 'event_code, event_type, event_type_id,');
file = file.replace(/v_event_type_id,/g, "'CMD-SEED-' || i, (ARRAY['EMERGENCY_SOS', 'CYBER_ALERT', 'VIP_SECURITY', 'HIGHWAY_ACCIDENT'])[floor(random() * 4 + 1)], v_event_type_id,");

fs.writeFileSync('c:/PDD WEB PROJECT/supabase/seed.sql', file);
console.log('Seed SQL command_center_events columns fixed.');
