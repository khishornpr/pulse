import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from scripts/.env.local or fallback to root .env
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
if (!process.env.SUPABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\x1b[31m[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\x1b[0m');
  console.log('Please populate \x1b[33mscripts/.env.local\x1b[0m with:');
  console.log('SUPABASE_URL=https://<your-project-id>.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// KPRIET Campus Reference Location: Arasur, Coimbatore (Lat 11.0827, Lng 77.1420)
const KPRIET_CENTER = { lat: 11.0827, lng: 77.1420 };
const DEMO_PASSWORD = 'Demo@12345';

const SEED_USERS = [
  // 1. Admin account
  {
    email: 'admin@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Dr. S. K. Ramesh (Chief Proctor)',
    department: 'Campus Safety & Admin',
    phone: '+91 98421 00001',
    role: 'admin',
    bloodGroup: 'O+',
    skills: ['first_aid', 'security', 'cpr'],
    isAvailable: true,
    lat: 11.0827,
    lng: 77.1420,
    locationLabel: 'Admin Block',
  },
  // 2. Student demo account
  {
    email: 'student@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Aravind Swaminathan',
    department: 'Computer Science (III Year)',
    phone: '+91 98421 99999',
    role: 'student',
    bloodGroup: 'B+',
    skills: [],
    isAvailable: false,
    lat: 11.0829,
    lng: 77.1418,
    locationLabel: 'CSE Lab 4',
  },
  // 3-14. 12 Diverse Volunteers with various skills & blood groups
  {
    email: 'volunteer1@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Priya Dharshini (First Aid Lead)',
    department: 'Biomedical Engg (IV Year)',
    phone: '+91 98421 11001',
    role: 'volunteer',
    bloodGroup: 'O+',
    skills: ['first_aid', 'cpr'],
    isAvailable: true,
    lat: 11.0834, // ~80m North (Library)
    lng: 77.1422,
    locationLabel: 'Central Library',
  },
  {
    email: 'volunteer2@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Karthik Raja (Vehicle Support)',
    department: 'Mechanical Engg (IV Year)',
    phone: '+91 98421 11002',
    role: 'volunteer',
    bloodGroup: 'A+',
    skills: ['vehicle', 'first_aid'],
    isAvailable: true,
    lat: 11.0820, // ~90m South (Mech Block)
    lng: 77.1415,
    locationLabel: 'Mech Workshop / Parking',
  },
  {
    email: 'volunteer3@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Deepika Murugan (CPR Certified)',
    department: 'Artificial Intelligence & DS',
    phone: '+91 98421 11003',
    role: 'volunteer',
    bloodGroup: 'B+',
    skills: ['cpr', 'first_aid', 'blood_donor'],
    isAvailable: true,
    lat: 11.0831, // ~60m NE (Thanam Hall)
    lng: 77.1426,
    locationLabel: 'Thanam Hall Auditorium',
  },
  {
    email: 'volunteer4@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Vignesh Kumar (Security Lead)',
    department: 'Campus Security Corps',
    phone: '+91 98421 11004',
    role: 'volunteer',
    bloodGroup: 'AB+',
    skills: ['security', 'first_aid'],
    isAvailable: true,
    lat: 11.0818, // ~120m South (Main Gate)
    lng: 77.1425,
    locationLabel: 'Main Gate 1',
  },
  {
    email: 'volunteer5@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Ananya Sharma (Blood Donor O-)',
    department: 'ECE (III Year)',
    phone: '+91 98421 11005',
    role: 'volunteer',
    bloodGroup: 'O-',
    skills: ['blood_donor', 'first_aid'],
    isAvailable: true,
    lat: 11.0838, // ~130m North (Girls Hostel)
    lng: 77.1412,
    locationLabel: 'Girls Hostel Block A',
  },
  {
    email: 'volunteer6@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Siddharth Balaji (Emergency Driver)',
    department: 'Civil Engg (IV Year)',
    phone: '+91 98421 11006',
    role: 'volunteer',
    bloodGroup: 'O+',
    skills: ['vehicle', 'cpr'],
    isAvailable: true,
    lat: 11.0815, // ~150m SW (Sports Ground)
    lng: 77.1408,
    locationLabel: 'Sports Pavilion',
  },
  {
    email: 'volunteer7@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Naveen Prasath (Blood Donor A-)',
    department: 'Information Tech (II Year)',
    phone: '+91 98421 11007',
    role: 'volunteer',
    bloodGroup: 'A-',
    skills: ['blood_donor'],
    isAvailable: true,
    lat: 11.0825, // ~40m West (Food Court)
    lng: 77.1410,
    locationLabel: 'Campus Food Court',
  },
  {
    email: 'volunteer8@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Meenakshi Sundaram (First Responder)',
    department: 'Chemical Engg (III Year)',
    phone: '+91 98421 11008',
    role: 'volunteer',
    bloodGroup: 'B-',
    skills: ['first_aid', 'cpr', 'security'],
    isAvailable: true,
    lat: 11.0842, // ~180m NW (Science Block)
    lng: 77.1416,
    locationLabel: 'Science & Humanities Block',
  },
  {
    email: 'volunteer9@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Raghavan Pillai (Blood Donor AB-)',
    department: 'Mechatronics (IV Year)',
    phone: '+91 98421 11009',
    role: 'volunteer',
    bloodGroup: 'AB-',
    skills: ['blood_donor', 'vehicle'],
    isAvailable: true,
    lat: 11.0822, // ~70m South (Boys Hostel 1)
    lng: 77.1432,
    locationLabel: 'Boys Hostel Block 1',
  },
  {
    email: 'volunteer10@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Kavitha Selvam (Red Cross Volunteer)',
    department: 'CSE - Cybersecurity',
    phone: '+91 98421 11010',
    role: 'volunteer',
    bloodGroup: 'O+',
    skills: ['first_aid', 'cpr', 'blood_donor'],
    isAvailable: true,
    lat: 11.0830, // ~50m East (Innovation Lab)
    lng: 77.1428,
    locationLabel: 'Innovation & Incubation Centre',
  },
  {
    email: 'volunteer11@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Dinesh Karthik (Campus Patrol)',
    department: 'Physical Education & Security',
    phone: '+91 98421 11011',
    role: 'volunteer',
    bloodGroup: 'A+',
    skills: ['security', 'vehicle', 'first_aid'],
    isAvailable: true,
    lat: 11.0812, // ~190m South (Gate 2 / Arch)
    lng: 77.1419,
    locationLabel: 'South Gate 2',
  },
  {
    email: 'volunteer12@pulse.demo',
    password: DEMO_PASSWORD,
    fullName: 'Sneha Varadarajan (Blood Donor B+)',
    department: 'Biotech (III Year)',
    phone: '+91 98421 11012',
    role: 'volunteer',
    bloodGroup: 'B+',
    skills: ['blood_donor', 'first_aid'],
    isAvailable: true,
    lat: 11.0845, // ~210m North (Research Lab)
    lng: 77.1425,
    locationLabel: 'BioTech Research Block',
  },
];

async function seed() {
  console.log('\x1b[36m========================================================\x1b[0m');
  console.log('\x1b[36m  🚀 SEEDING PULSE KPRIET DEMO USERS & VOLUNTEERS\x1b[0m');
  console.log('\x1b[36m========================================================\x1b[0m\n');

  let createdCount = 0;
  let updatedCount = 0;

  for (const user of SEED_USERS) {
    try {
      // 1. Check if user already exists in auth
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const existingAuthUser = listData.users.find((u) => u.email === user.email);
      let userId = existingAuthUser ? existingAuthUser.id : null;

      if (!existingAuthUser) {
        // Create user in Auth
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            department: user.department,
            phone: user.phone,
            role: user.role,
            blood_group: user.bloodGroup,
          },
        });

        if (createError) throw createError;
        userId = createData.user.id;
        console.log(`\x1b[32m[+ Created User]\x1b[0m ${user.email} (${user.role})`);
        createdCount++;
      } else {
        // Update user password and metadata
        await supabase.auth.admin.updateUserById(userId, {
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            department: user.department,
            phone: user.phone,
            role: user.role,
            blood_group: user.bloodGroup,
          },
        });
        console.log(`\x1b[34m[~ Updated User]\x1b[0m ${user.email} (${user.role})`);
        updatedCount++;
      }

      // 2. Upsert profile with PostGIS Point geography
      // PostGIS Point format: POINT(lng lat)
      const wktPoint = `POINT(${user.lng} ${user.lat})`;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: user.fullName,
          department: user.department,
          phone: user.phone,
          role: user.role,
          blood_group: user.bloodGroup,
          skills: user.skills,
          is_available: user.isAvailable,
          location: wktPoint,
          location_updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.warn(`\x1b[33m[Warning]\x1b[0m Profile upsert for ${user.email}:`, profileError.message);
      }
    } catch (err) {
      console.error(`\x1b[31m[Error seeding ${user.email}]:\x1b[0m`, err.message);
    }
  }

  console.log('\n\x1b[32m✔ Seeding Complete!\x1b[0m');
  console.log(`- Created: ${createdCount} accounts`);
  console.log(`- Updated: ${updatedCount} accounts`);
  console.log(`- Total Demo Accounts: ${SEED_USERS.length}`);
  console.log('\n\x1b[33m🔑 Default Passwords for all accounts:\x1b[0m ' + DEMO_PASSWORD);
  console.log('\x1b[35mAdmin Demo:\x1b[0m admin@pulse.demo');
  console.log('\x1b[35mStudent Demo:\x1b[0m student@pulse.demo');
  console.log('\x1b[35mVolunteer Demos:\x1b[0m volunteer1@pulse.demo to volunteer12@pulse.demo\n');
}

seed().catch((err) => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});
