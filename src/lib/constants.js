// Pulse KPRIET - Constants & Landmark Coordinates

export const KPRIET_CAMPUS = {
  center: { lat: 11.0827, lng: 77.1420 },
  zoom: 17,
  minZoom: 15,
  maxZoom: 19,
  bounds: [
    [11.0750, 77.1350],
    [11.0900, 77.1500],
  ]
};

export const CAMPUS_BLOCKS = [
  { id: 'main_admin', name: 'Main Admin Block & Reception', lat: 11.0827, lng: 77.1420 },
  { id: 'cse_it', name: 'CSE & IT Block (Labs 4 & 5)', lat: 11.0829, lng: 77.1418 },
  { id: 'ece_block', name: 'ECE & VLSI Block', lat: 11.0833, lng: 77.1414 },
  { id: 'mech_block', name: 'Mechanical Workshop & Labs', lat: 11.0820, lng: 77.1415 },
  { id: 'civil_block', name: 'Civil Engineering Block', lat: 11.0823, lng: 77.1424 },
  { id: 'thanam_hall', name: 'Thanam Hall Auditorium', lat: 11.0831, lng: 77.1426 },
  { id: 'library', name: 'Central Library & Reading Hall', lat: 11.0834, lng: 77.1422 },
  { id: 'food_court', name: 'Campus Food Court / Canteen', lat: 11.0825, lng: 77.1410 },
  { id: 'boys_hostel', name: 'Boys Hostel (Block A/B)', lat: 11.0822, lng: 77.1432 },
  { id: 'girls_hostel', name: 'Girls Hostel (Block A/B)', lat: 11.0838, lng: 77.1412 },
  { id: 'sports_ground', name: 'Sports Pavilion & Athletic Ground', lat: 11.0815, lng: 77.1408 },
  { id: 'main_gate', name: 'Main Arch & Gate 1 (Avinashi Rd)', lat: 11.0818, lng: 77.1425 },
  { id: 'south_gate', name: 'South Gate 2', lat: 11.0812, lng: 77.1419 },
];

export const INCIDENT_TYPES = [
  {
    id: 'medical',
    label: 'Medical Emergency',
    shortLabel: 'Medical',
    description: 'Sudden collapse, seizure, asthma, severe pain, trauma',
    icon: 'HeartPulse',
    color: '#EF4444', // red
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    skills: ['first_aid', 'cpr'],
  },
  {
    id: 'accident',
    label: 'Vehicle / Campus Accident',
    shortLabel: 'Accident',
    description: 'Bike fall, lab injury, heavy machinery hazard',
    icon: 'AlertCircle',
    color: '#F59E0B', // amber
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    skills: ['first_aid', 'vehicle'],
  },
  {
    id: 'fire',
    label: 'Fire & Electrical Hazard',
    shortLabel: 'Fire',
    description: 'Smoke, short circuit, lab chemical fire',
    icon: 'Flame',
    color: '#F97316', // orange
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    skills: ['security'],
  },
  {
    id: 'safety',
    label: 'Campus Safety & Security',
    shortLabel: 'Safety',
    description: 'Harassment, perimeter breach, unauthorized entry, brawl',
    icon: 'ShieldAlert',
    color: '#A855F7', // purple
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    skills: ['security'],
  },
  {
    id: 'blood_needed',
    label: 'Urgent Blood Needed',
    shortLabel: 'Blood Donor',
    description: 'Immediate transfusion request for student/staff in emergency',
    icon: 'Droplets',
    color: '#E11D48', // rose
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    skills: ['blood_donor'],
  },
  {
    id: 'other',
    label: 'Other Campus Crisis',
    shortLabel: 'Other',
    description: 'Structural hazard, power outage trapping people, panic',
    icon: 'AlertTriangle',
    color: '#3B82F6', // blue
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    skills: [],
  },
];

export const VOLUNTEER_SKILLS = [
  { id: 'first_aid', label: 'First Aid Certified', description: 'Bandaging, wound dressing, trauma management' },
  { id: 'cpr', label: 'CPR Trained', description: 'Cardiopulmonary resuscitation certified' },
  { id: 'vehicle', label: 'Vehicle Owner / Driver', description: 'Immediate two-wheeler or four-wheeler transport' },
  { id: 'security', label: 'Security / NSS / NCC', description: 'Crowd control, evacuation, conflict mediation' },
  { id: 'blood_donor', label: 'Registered Blood Donor', description: 'Available for critical emergency donation' },
];

export const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const DEMO_ACCOUNTS = [
  {
    role: 'student',
    email: 'student@pulse.demo',
    label: 'Student (Aravind)',
    desc: 'Can trigger SOS, select location & track response',
    badge: 'Student',
  },
  {
    role: 'volunteer',
    email: 'volunteer1@pulse.demo',
    label: 'Volunteer 1 (Priya - First Aid)',
    desc: 'Receives alerts in realtime & can accept/resolve',
    badge: 'First Aid / CPR',
  },
  {
    role: 'volunteer',
    email: 'volunteer2@pulse.demo',
    label: 'Volunteer 2 (Karthik - Vehicle)',
    desc: 'Tests multi-volunteer race condition (already taken)',
    badge: 'Vehicle Support',
  },
  {
    role: 'admin',
    email: 'admin@pulse.demo',
    label: 'Admin (Chief Proctor)',
    desc: 'Full campus live control room, heatmap, charts, AI summaries',
    badge: 'Campus Admin',
  },
];
