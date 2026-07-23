const fs = require('fs');
let file = fs.readFileSync('c:/PDD WEB PROJECT/supabase/seed.sql', 'utf8');

// Replace invalid UUID prefixes with valid hex
file = file.replace(/s2000000/g, 'c2000000');
file = file.replace(/dep00000/g, 'de000000');
file = file.replace(/rnk00000/g, 'fc000000');
file = file.replace(/cat00000/g, 'ca000000');
file = file.replace(/sta00000/g, '5a000000');
file = file.replace(/zon00000/g, '20000000');
file = file.replace(/emg00000/g, 'e0000000');
file = file.replace(/evd00000/g, 'ed000000');
file = file.replace(/ctr00000/g, 'c7000000');
file = file.replace(/o3000000/g, '03000000');

fs.writeFileSync('c:/PDD WEB PROJECT/supabase/seed.sql', file);
console.log('Seed SQL fixed valid UUIDs');
