-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: master_data.sql
-- Description: Core lookup values (AP Districts, Stations, Categories)
-- ============================================================================

-- 1. Districts (Andhra Pradesh)
INSERT INTO public.md_districts (id, code, name, region) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'VSP', 'Visakhapatnam', 'North Coastal'),
    ('d1000000-0000-0000-0000-000000000002', 'AKP', 'Anakapalli', 'North Coastal'),
    ('d1000000-0000-0000-0000-000000000003', 'VZM', 'Vizianagaram', 'North Coastal'),
    ('d1000000-0000-0000-0000-000000000004', 'SKLM', 'Srikakulam', 'North Coastal'),
    ('d1000000-0000-0000-0000-000000000005', 'KKD', 'Kakinada', 'Godavari'),
    ('d1000000-0000-0000-0000-000000000006', 'RJY', 'Rajahmundry', 'Godavari'),
    ('d1000000-0000-0000-0000-000000000007', 'ELR', 'Eluru', 'Godavari'),
    ('d1000000-0000-0000-0000-000000000008', 'VJA', 'Vijayawada', 'Central Coastal'),
    ('d1000000-0000-0000-0000-000000000009', 'GNT', 'Guntur', 'Central Coastal'),
    ('d1000000-0000-0000-0000-000000000010', 'PLN', 'Palnadu', 'Central Coastal'),
    ('d1000000-0000-0000-0000-000000000011', 'BPT', 'Bapatla', 'Central Coastal'),
    ('d1000000-0000-0000-0000-000000000012', 'NLR', 'Nellore', 'South Coastal'),
    ('d1000000-0000-0000-0000-000000000013', 'TPT', 'Tirupati', 'Rayalaseema'),
    ('d1000000-0000-0000-0000-000000000014', 'KDP', 'Kadapa', 'Rayalaseema'),
    ('d1000000-0000-0000-0000-000000000015', 'ATP', 'Anantapur', 'Rayalaseema'),
    ('d1000000-0000-0000-0000-000000000016', 'KNL', 'Kurnool', 'Rayalaseema'),
    ('d1000000-0000-0000-0000-000000000017', 'NDL', 'Nandyal', 'Rayalaseema')
ON CONFLICT (code) DO NOTHING;

-- 2. Police Stations
INSERT INTO public.md_police_stations (id, district_id, code, name, contact_phone, latitude, longitude) VALUES
    ('s2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'VSP-I-TOWN', 'Visakhapatnam I Town', '0891-2562709', 17.6868, 83.2185),
    ('s2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'VSP-MVP', 'MVP Colony PS', '0891-2562710', 17.7441, 83.3361),
    ('s2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008', 'VJA-ONE-TOWN', 'Vijayawada One Town', '0866-2424100', 16.5062, 80.6480),
    ('s2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000008', 'VJA-BHAVANIPURAM', 'Bhavanipuram PS', '0866-2424101', 16.5165, 80.6120),
    ('s2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000013', 'TPT-ALIPIRI', 'Alipiri PS', '0877-2289001', 13.6288, 79.4192)
ON CONFLICT (code) DO NOTHING;

-- 3. Departments
INSERT INTO public.md_departments (id, code, name, description) VALUES
    ('dep00000-0000-0000-0000-000000000001', 'L_AND_O', 'Law and Order', 'General policing and maintaining peace'),
    ('dep00000-0000-0000-0000-000000000002', 'CRIME', 'Crime Branch', 'Investigation of serious crimes'),
    ('dep00000-0000-0000-0000-000000000003', 'TRAFFIC', 'Traffic Police', 'Managing traffic and enforcement of traffic laws'),
    ('dep00000-0000-0000-0000-000000000004', 'CYBER', 'Cyber Crime', 'Investigation of digital and internet crimes'),
    ('dep00000-0000-0000-0000-000000000005', 'WOMEN', 'Women Protection Cell', 'Crimes against women and children')
ON CONFLICT (code) DO NOTHING;

-- 4. Police Ranks
INSERT INTO public.md_police_ranks (id, code, title, hierarchy_level) VALUES
    ('rnk00000-0000-0000-0000-000000000001', 'PC', 'Police Constable', 1),
    ('rnk00000-0000-0000-0000-000000000002', 'HC', 'Head Constable', 2),
    ('rnk00000-0000-0000-0000-000000000003', 'ASI', 'Assistant Sub-Inspector', 3),
    ('rnk00000-0000-0000-0000-000000000004', 'SI', 'Sub-Inspector', 4),
    ('rnk00000-0000-0000-0000-000000000005', 'CI', 'Circle Inspector', 5),
    ('rnk00000-0000-0000-0000-000000000006', 'DSP', 'Deputy Superintendent of Police', 6),
    ('rnk00000-0000-0000-0000-000000000007', 'SP', 'Superintendent of Police', 7),
    ('rnk00000-0000-0000-0000-000000000008', 'DIG', 'Deputy Inspector General', 8),
    ('rnk00000-0000-0000-0000-000000000009', 'IGP', 'Inspector General of Police', 9),
    ('rnk00000-0000-0000-0000-000000000010', 'DGP', 'Director General of Police', 10)
ON CONFLICT (code) DO NOTHING;

-- 5. Crime Categories
INSERT INTO public.md_crime_categories (id, code, name, default_priority) VALUES
    ('cat00000-0000-0000-0000-000000000001', 'THEFT', 'Theft / Burglary', 'normal'),
    ('cat00000-0000-0000-0000-000000000002', 'ASSAULT', 'Physical Assault', 'high'),
    ('cat00000-0000-0000-0000-000000000003', 'CYBER', 'Cyber Fraud', 'high'),
    ('cat00000-0000-0000-0000-000000000004', 'WOMEN_HARRASS', 'Harassment Against Women', 'urgent'),
    ('cat00000-0000-0000-0000-000000000005', 'MISSING', 'Missing Person', 'urgent'),
    ('cat00000-0000-0000-0000-000000000006', 'MURDER', 'Homicide', 'urgent'),
    ('cat00000-0000-0000-0000-000000000007', 'NARCOTICS', 'Drug / Narcotics', 'high'),
    ('cat00000-0000-0000-0000-000000000008', 'TRAFFIC_ACC', 'Traffic Accident', 'normal')
ON CONFLICT (code) DO NOTHING;

-- 6. Complaint Status
INSERT INTO public.md_complaint_status (id, code, status_name, is_terminal) VALUES
    ('sta00000-0000-0000-0000-000000000001', 'FILED', 'Filed Online', false),
    ('sta00000-0000-0000-0000-000000000002', 'ACKNOWLEDGED', 'Acknowledged by Station', false),
    ('sta00000-0000-0000-0000-000000000003', 'FIR_REG', 'FIR Registered', false),
    ('sta00000-0000-0000-0000-000000000004', 'UNDER_INV', 'Under Investigation', false),
    ('sta00000-0000-0000-0000-000000000005', 'CHARGE_SHEET', 'Charge Sheet Filed', false),
    ('sta00000-0000-0000-0000-000000000006', 'RESOLVED', 'Resolved / Closed', true),
    ('sta00000-0000-0000-0000-000000000007', 'REJECTED', 'Rejected / Invalid', true)
ON CONFLICT (code) DO NOTHING;

-- 7. Patrol Zones
INSERT INTO public.md_patrol_zones (id, district_id, code, name, severity_level) VALUES
    ('zon00000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'VSP-BEACH', 'RK Beach Road Sector', 'medium'),
    ('zon00000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000008', 'VJA-BUS-STAND', 'Vijayawada PNBS Sector', 'high'),
    ('zon00000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000013', 'TPT-TEMPLE', 'Tirumala Ghat Sector', 'medium')
ON CONFLICT (code) DO NOTHING;

-- 8. Emergency Types
INSERT INTO public.md_emergency_types (id, code, type_name, response_protocol) VALUES
    ('emg00000-0000-0000-0000-000000000001', 'SOS_APP', 'Citizen SOS Alert', 'Immediate dispatch to GPS coordinates'),
    ('emg00000-0000-0000-0000-000000000002', 'RIOT', 'Riot / Mob Violence', 'Deploy Quick Response Team (QRT)'),
    ('emg00000-0000-0000-0000-000000000003', 'ACCIDENT_MAJOR', 'Major Highway Accident', 'Dispatch Highway Patrol & Ambulance')
ON CONFLICT (code) DO NOTHING;

-- 9. Evidence Types
INSERT INTO public.md_evidence_types (id, code, name, requires_secure_storage) VALUES
    ('evd00000-0000-0000-0000-000000000001', 'DOC_ID', 'ID Proof Document', false),
    ('evd00000-0000-0000-0000-000000000002', 'PHOTO', 'Incident Photograph', false),
    ('evd00000-0000-0000-0000-000000000003', 'VIDEO', 'CCTV / Video Footage', false),
    ('evd00000-0000-0000-0000-000000000004', 'PHYSICAL_WEAPON', 'Weapon recovered', true),
    ('evd00000-0000-0000-0000-000000000005', 'DIGITAL_BANK', 'Bank Statement / UTR', false)
ON CONFLICT (code) DO NOTHING;

-- 10. Case Transfer Reasons
INSERT INTO public.md_case_transfer_reasons (id, code, reason) VALUES
    ('ctr00000-0000-0000-0000-000000000001', 'JURISDICTION', 'Outside of current jurisdiction limits'),
    ('ctr00000-0000-0000-0000-000000000002', 'SPECIAL_UNIT', 'Requires specialized investigation (e.g. Cyber, CID)'),
    ('ctr00000-0000-0000-0000-000000000003', 'OFFICER_REASSIGN', 'Officer transferred or on leave')
ON CONFLICT (code) DO NOTHING;
