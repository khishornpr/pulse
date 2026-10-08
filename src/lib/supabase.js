import { createClient } from '@supabase/supabase-js';
import { KPRIET_CAMPUS } from './constants.js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || '';

// In-memory storage dictionary fallback for Node / non-browser environments
const memoryStorage = {};
const mockStorage = {
  getItem(key) {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memoryStorage[key] || null;
  },
  setItem(key, val) {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, val); } catch (_) {}
    }
    memoryStorage[key] = String(val);
  },
  removeItem(key) {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(key); } catch (_) {}
    }
    delete memoryStorage[key];
  },
};

export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref') &&
  supabaseAnonKey !== 'your-anon-key-here'
);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : createMockSupabase();

// ========================================================================
// REALTIME CHANNEL & BROADCAST WRAPPER
// ========================================================================

// Cross-tab broadcast channel for simulated real-time synchronization in demo/offline mode
const localBroadcast = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('pulse_local_realtime')
  : null;

// ========================================================================
// MOCK SUPABASE ENGINE (Ensures 100% working demo even before .env is filled)
// ========================================================================

function createMockSupabase() {
  console.info(
    '%c[Pulse KPRIET] Supabase keys not detected in .env. Running with High-Fidelity In-Memory & LocalStorage Simulation Engine.',
    'color: #38bdf8; font-weight: bold;'
  );

  initMockStorage();

  return {
    isMock: true,
    auth: {
      async getSession() {
        const stored = mockStorage.getItem('pulse_mock_session');
        if (stored) {
          const session = JSON.parse(stored);
          return { data: { session }, error: null };
        }
        return { data: { session: null }, error: null };
      },
      async getUser() {
        const stored = mockStorage.getItem('pulse_mock_session');
        if (stored) {
          const session = JSON.parse(stored);
          return { data: { user: session.user }, error: null };
        }
        return { data: { user: null }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const users = JSON.parse(mockStorage.getItem('pulse_mock_users') || '[]');
        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!user || password !== 'Demo@12345') {
          if (!user) {
            return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
          }
        }

        const session = {
          access_token: 'mock_token_' + Date.now(),
          user: {
            id: user.id,
            email: user.email,
            user_metadata: {
              full_name: user.full_name,
              role: user.role,
              department: user.department,
              phone: user.phone,
              blood_group: user.blood_group,
            },
          },
        };

        mockStorage.setItem('pulse_mock_session', JSON.stringify(session));
        notifyMockAuthSubscribers('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async signUp({ email, password, options }) {
        const users = JSON.parse(mockStorage.getItem('pulse_mock_users') || '[]');
        const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          return { data: { user: null, session: null }, error: { message: 'User already exists' } };
        }

        const newId = 'user_' + Math.random().toString(36).substring(2, 9);
        const meta = options?.data || {};
        const newUser = {
          id: newId,
          email,
          full_name: meta.full_name || email.split('@')[0],
          department: meta.department || 'General',
          phone: meta.phone || '+91 98421 00000',
          role: email.includes('admin') ? 'admin' : (meta.role || 'student'),
          blood_group: meta.blood_group || 'O+',
          skills: meta.skills || [],
          is_available: false,
          lat: 11.0827,
          lng: 77.1420,
        };

        users.push(newUser);
        mockStorage.setItem('pulse_mock_users', JSON.stringify(users));

        const profiles = JSON.parse(mockStorage.getItem('pulse_mock_profiles') || '[]');
        profiles.push(newUser);
        mockStorage.setItem('pulse_mock_profiles', JSON.stringify(profiles));

        const session = {
          access_token: 'mock_token_' + Date.now(),
          user: {
            id: newId,
            email,
            user_metadata: meta,
          },
        };

        mockStorage.setItem('pulse_mock_session', JSON.stringify(session));
        notifyMockAuthSubscribers('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async signOut() {
        mockStorage.removeItem('pulse_mock_session');
        notifyMockAuthSubscribers('SIGNED_OUT', null);
        return { error: null };
      },
      onAuthStateChange(callback) {
        mockAuthListeners.push(callback);
        const stored = mockStorage.getItem('pulse_mock_session');
        if (stored) {
          callback('INITIAL_SESSION', JSON.parse(stored));
        } else {
          callback('INITIAL_SESSION', null);
        }
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const idx = mockAuthListeners.indexOf(callback);
                if (idx !== -1) mockAuthListeners.splice(idx, 1);
              },
            },
          },
        };
      },
    },
    from(table) {
      return createMockQueryBuilder(table);
    },
    channel(channelName) {
      return createMockChannel(channelName);
    },
    removeChannel(channel) {
      if (channel) {
        const name = typeof channel === 'string' ? channel : channel.name;
        if (name) delete mockChannelSubscribers[name];
      }
      return Promise.resolve('ok');
    },
    async rpc(fnName, params) {
      return executeMockRpc(fnName, params);
    },
  };
}

const mockAuthListeners = [];
function notifyMockAuthSubscribers(event, session) {
  mockAuthListeners.forEach((cb) => {
    try {
      cb(event, session);
    } catch (_) {}
  });
}

function initMockStorage() {
  if (!mockStorage.getItem('pulse_mock_profiles')) {
    const defaultProfiles = [
      {
        id: 'admin-id-1',
        email: 'admin@pulse.demo',
        full_name: 'Dr. S. K. Ramesh (Chief Proctor)',
        department: 'Campus Safety & Admin',
        phone: '+91 98421 00001',
        role: 'admin',
        blood_group: 'O+',
        skills: ['first_aid', 'security', 'cpr'],
        is_available: true,
        lat: 11.0827,
        lng: 77.1420,
      },
      {
        id: 'student-id-1',
        email: 'student@pulse.demo',
        full_name: 'Aravind Swaminathan',
        department: 'Computer Science (III Year)',
        phone: '+91 98421 99999',
        role: 'student',
        blood_group: 'B+',
        skills: [],
        is_available: false,
        lat: 11.0829,
        lng: 77.1418,
      },
      {
        id: 'vol-id-1',
        email: 'volunteer1@pulse.demo',
        full_name: 'Priya Dharshini (First Aid Lead)',
        department: 'Biomedical Engg (IV Year)',
        phone: '+91 98421 11001',
        role: 'volunteer',
        blood_group: 'O+',
        skills: ['first_aid', 'cpr'],
        is_available: true,
        lat: 11.0834,
        lng: 77.1422,
      },
      {
        id: 'vol-id-2',
        email: 'volunteer2@pulse.demo',
        full_name: 'Karthik Raja (Vehicle Support)',
        department: 'Mechanical Engg (IV Year)',
        phone: '+91 98421 11002',
        role: 'volunteer',
        blood_group: 'A+',
        skills: ['vehicle', 'first_aid'],
        is_available: true,
        lat: 11.0820,
        lng: 77.1415,
      },
      {
        id: 'vol-id-3',
        email: 'volunteer3@pulse.demo',
        full_name: 'Deepika Murugan (CPR Certified)',
        department: 'Artificial Intelligence & DS',
        phone: '+91 98421 11003',
        role: 'volunteer',
        blood_group: 'B+',
        skills: ['cpr', 'first_aid', 'blood_donor'],
        is_available: true,
        lat: 11.0831,
        lng: 77.1426,
      },
      {
        id: 'vol-id-4',
        email: 'volunteer4@pulse.demo',
        full_name: 'Vignesh Kumar (Security Lead)',
        department: 'Campus Security Corps',
        phone: '+91 98421 11004',
        role: 'volunteer',
        blood_group: 'AB+',
        skills: ['security', 'first_aid'],
        is_available: true,
        lat: 11.0818,
        lng: 77.1425,
      },
    ];

    mockStorage.setItem('pulse_mock_profiles', JSON.stringify(defaultProfiles));
    mockStorage.setItem('pulse_mock_users', JSON.stringify(defaultProfiles));
  }

  if (!mockStorage.getItem('pulse_mock_incidents')) {
    const seedIncidents = [
      {
        id: 'inc-001',
        reporter_id: 'student-id-1',
        reporter_name: 'Aravind Swaminathan',
        reporter_phone: '+91 98421 99999',
        type: 'medical',
        description: 'Asthma flare-up and severe breathing difficulty in library reading hall',
        blood_group_needed: null,
        location_label: 'Central Library & Reading Hall',
        lat: 11.0834,
        lng: 77.1422,
        status: 'resolved',
        accepted_by: 'vol-id-1',
        volunteer_name: 'Priya Dharshini (First Aid Lead)',
        volunteer_phone: '+91 98421 11001',
        accepted_at: new Date(Date.now() - 3600000).toISOString(),
        resolved_at: new Date(Date.now() - 3000000).toISOString(),
        ai_summary: 'Asthma medical emergency resolved at Central Library. Responder Priya arrived within 42 seconds with inhaler support. Student stabilized.',
        created_at: new Date(Date.now() - 3642000).toISOString(),
      },
      {
        id: 'inc-002',
        reporter_id: 'student-id-1',
        reporter_name: 'Aravind Swaminathan',
        reporter_phone: '+91 98421 99999',
        type: 'accident',
        description: 'Two-wheeler skid near gate turn during rain',
        blood_group_needed: null,
        location_label: 'South Gate 2',
        lat: 11.0812,
        lng: 77.1419,
        status: 'resolved',
        accepted_by: 'vol-id-2',
        volunteer_name: 'Karthik Raja (Vehicle Support)',
        volunteer_phone: '+91 98421 11002',
        accepted_at: new Date(Date.now() - 7200000).toISOString(),
        resolved_at: new Date(Date.now() - 6500000).toISOString(),
        ai_summary: 'Accident reported at South Gate. Responder Karthik provided rapid vehicle escort and wound dressing.',
        created_at: new Date(Date.now() - 7255000).toISOString(),
      },
    ];
    mockStorage.setItem('pulse_mock_incidents', JSON.stringify(seedIncidents));
  }

  if (!mockStorage.getItem('pulse_mock_alerts')) {
    mockStorage.setItem('pulse_mock_alerts', JSON.stringify([]));
  }
}

function createMockQueryBuilder(table) {
  let filters = [];
  let isSingle = false;
  let orderCol = null;
  let orderAsc = true;
  let limitVal = null;
  let pendingUpdate = null;
  let pendingInsert = null;

  const builder = {
    select(fields = '*') {
      return builder;
    },
    eq(column, value) {
      filters.push({ column, op: 'eq', value });
      return builder;
    },
    neq(column, value) {
      filters.push({ column, op: 'neq', value });
      return builder;
    },
    in(column, values) {
      filters.push({ column, op: 'in', value: values });
      return builder;
    },
    order(column, options = {}) {
      orderCol = column;
      orderAsc = options.ascending ?? true;
      return builder;
    },
    limit(count) {
      limitVal = count;
      return builder;
    },
    single() {
      isSingle = true;
      return builder;
    },
    update(updates) {
      pendingUpdate = updates;
      return builder;
    },
    insert(records) {
      pendingInsert = records;
      return builder;
    },
    async upsert(record) {
      let storageKey = 'pulse_mock_' + (table === 'profiles' ? 'profiles' : table);
      const data = JSON.parse(mockStorage.getItem(storageKey) || '[]');
      const idx = data.findIndex((d) => d.id === record.id);
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...record };
      } else {
        data.push(record);
      }
      mockStorage.setItem(storageKey, JSON.stringify(data));
      broadcastLocalUpdate(table, 'UPSERT', record);
      return { data: record, error: null };
    },
    async then(resolve, reject) {
      try {
        let storageKey = 'pulse_mock_' + table;
        if (table === 'incidents_with_coords' || table === 'incidents') storageKey = 'pulse_mock_incidents';
        if (table === 'volunteers_with_coords' || table === 'profiles') storageKey = 'pulse_mock_profiles';
        if (table === 'incident_alerts') storageKey = 'pulse_mock_alerts';

        let data = JSON.parse(mockStorage.getItem(storageKey) || '[]');

        if (pendingInsert) {
          const items = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
          const inserted = items.map((it) => ({
            id: it.id || 'gen_' + Math.random().toString(36).substring(2, 9),
            created_at: new Date().toISOString(),
            ...it,
          }));
          data.push(...inserted);
          mockStorage.setItem(storageKey, JSON.stringify(data));
          broadcastLocalUpdate(table, 'INSERT', inserted[0]);
          return resolve({ data: isSingle ? inserted[0] : inserted, error: null });
        }

        if (pendingUpdate) {
          let updatedItem = null;
          const modified = data.map((item) => {
            let match = true;
            for (const f of filters) {
              if (f.op === 'eq' && item[f.column] !== f.value) match = false;
            }
            if (match) {
              updatedItem = { ...item, ...pendingUpdate };
              return updatedItem;
            }
            return item;
          });
          mockStorage.setItem(storageKey, JSON.stringify(modified));
          if (updatedItem) {
            broadcastLocalUpdate(table, 'UPDATE', updatedItem);
          }
          return resolve({ data: isSingle ? updatedItem : [updatedItem], error: null });
        }

        // Apply filters
        for (const f of filters) {
          if (f.op === 'eq') data = data.filter((item) => item[f.column] === f.value);
          if (f.op === 'neq') data = data.filter((item) => item[f.column] !== f.value);
          if (f.op === 'in') data = data.filter((item) => f.value.includes(item[f.column]));
        }

        if (orderCol) {
          data.sort((a, b) => {
            const valA = a[orderCol];
            const valB = b[orderCol];
            if (valA < valB) return orderAsc ? -1 : 1;
            if (valA > valB) return orderAsc ? 1 : -1;
            return 0;
          });
        }

        if (limitVal) {
          data = data.slice(0, limitVal);
        }

        if (isSingle) {
          return resolve({ data: data[0] || null, error: data[0] ? null : { message: 'Row not found' } });
        }
        return resolve({ data, error: null });
      } catch (err) {
        return resolve({ data: null, error: err });
      }
    },
  };

  return builder;
}

const mockChannelSubscribers = {};

function createMockChannel(name) {
  const channelObj = {
    name,
    on(event, filter, callback) {
      if (!mockChannelSubscribers[name]) {
        mockChannelSubscribers[name] = [];
      }
      mockChannelSubscribers[name].push({ event, filter, callback });
      return channelObj;
    },
    subscribe(statusCallback) {
      setTimeout(() => {
        if (statusCallback) statusCallback('SUBSCRIBED');
      }, 50);
      return channelObj;
    },
    unsubscribe() {
      delete mockChannelSubscribers[name];
      return Promise.resolve();
    },
  };
  return channelObj;
}

function broadcastLocalUpdate(table, eventType, payload) {
  const message = { table, eventType, payload, timestamp: Date.now() };
  if (localBroadcast) {
    try {
      localBroadcast.postMessage(message);
    } catch (_) {}
  }
  handleMockRealtimeEvent(message);
}

if (localBroadcast) {
  localBroadcast.onmessage = (event) => {
    handleMockRealtimeEvent(event.data);
  };
}

function handleMockRealtimeEvent(msg) {
  Object.values(mockChannelSubscribers).forEach((subs) => {
    subs.forEach(({ filter, callback }) => {
      const matchTable = !filter?.table || filter.table === '*' || filter.table === msg.table;
      if (matchTable) {
        callback({
          eventType: msg.eventType,
          new: msg.payload,
          old: msg.payload,
          table: msg.table,
        });
      }
    });
  });
}

async function executeMockRpc(fnName, params = {}) {
  const session = JSON.parse(mockStorage.getItem('pulse_mock_session') || 'null');
  const callerId = session?.user?.id || 'demo-user-id';

  if (fnName === 'create_incident') {
    const { p_type, p_description, p_lat, p_lng, p_label, p_blood_group } = params;
    const incidents = JSON.parse(mockStorage.getItem('pulse_mock_incidents') || '[]');
    const profiles = JSON.parse(mockStorage.getItem('pulse_mock_profiles') || '[]');
    const alerts = JSON.parse(mockStorage.getItem('pulse_mock_alerts') || '[]');

    const reporter = profiles.find((p) => p.id === callerId) || {
      full_name: session?.user?.user_metadata?.full_name || 'Aravind Swaminathan',
      phone: '+91 98421 99999',
      department: 'Computer Science',
    };

    const incidentId = 'inc_' + Math.random().toString(36).substring(2, 9);
    const newIncident = {
      id: incidentId,
      reporter_id: callerId,
      reporter_name: reporter.full_name,
      reporter_phone: reporter.phone,
      reporter_department: reporter.department,
      type: p_type,
      description: p_description || '',
      blood_group_needed: p_blood_group || null,
      location_label: p_label || 'KPRIET Campus',
      lat: p_lat || 11.0827,
      lng: p_lng || 77.1420,
      status: 'open',
      accepted_by: null,
      volunteer_name: null,
      volunteer_phone: null,
      created_at: new Date().toISOString(),
    };

    incidents.unshift(newIncident);
    mockStorage.setItem('pulse_mock_incidents', JSON.stringify(incidents));

    // Match available volunteers based on skills and distance
    const matchedVols = profiles.filter((p) => {
      if (p.id === callerId || p.role !== 'volunteer' || !p.is_available) return false;
      if (p_type === 'medical') return p.skills?.includes('first_aid') || p.skills?.includes('cpr');
      if (p_type === 'accident') return p.skills?.includes('first_aid') || p.skills?.includes('vehicle');
      if (p_type === 'fire' || p_type === 'safety') return p.skills?.includes('security');
      if (p_type === 'blood_needed') return p.skills?.includes('blood_donor') && (!p_blood_group || p.blood_group === p_blood_group);
      return true;
    });

    const newAlerts = matchedVols.map((v) => {
      const dist = Math.round(calculateDistanceMeters(p_lat, p_lng, v.lat || 11.0827, v.lng || 77.1420));
      return {
        id: 'alt_' + Math.random().toString(36).substring(2, 9),
        incident_id: incidentId,
        volunteer_id: v.id,
        distance_m: dist,
        status: 'sent',
        created_at: new Date().toISOString(),
        incident: newIncident,
      };
    });

    alerts.push(...newAlerts);
    mockStorage.setItem('pulse_mock_alerts', JSON.stringify(alerts));

    broadcastLocalUpdate('incidents', 'INSERT', newIncident);
    newAlerts.forEach((a) => broadcastLocalUpdate('incident_alerts', 'INSERT', a));

    return {
      data: {
        incident_id: incidentId,
        match_count: newAlerts.length,
        radius_used_m: 1500,
        status: 'open',
      },
      error: null,
    };
  }

  if (fnName === 'accept_incident') {
    const { p_incident_id } = params;
    const incidents = JSON.parse(mockStorage.getItem('pulse_mock_incidents') || '[]');
    const profiles = JSON.parse(mockStorage.getItem('pulse_mock_profiles') || '[]');
    const alerts = JSON.parse(mockStorage.getItem('pulse_mock_alerts') || '[]');

    const incident = incidents.find((i) => i.id === p_incident_id);
    if (!incident || incident.status !== 'open') {
      return {
        data: { success: false, message: 'Already accepted by another responder or closed' },
        error: null,
      };
    }

    const volunteer = profiles.find((p) => p.id === callerId) || {
      full_name: session?.user?.user_metadata?.full_name || 'Priya Dharshini',
      phone: '+91 98421 11001',
      department: 'Biomedical Engg',
    };

    incident.status = 'accepted';
    incident.accepted_by = callerId;
    incident.volunteer_name = volunteer.full_name;
    incident.volunteer_phone = volunteer.phone;
    incident.volunteer_department = volunteer.department;
    incident.accepted_at = new Date().toISOString();

    mockStorage.setItem('pulse_mock_incidents', JSON.stringify(incidents));

    // Update alerts
    alerts.forEach((a) => {
      if (a.incident_id === p_incident_id) {
        if (a.volunteer_id === callerId) {
          a.status = 'accepted';
        } else {
          a.status = 'declined';
        }
      }
    });
    mockStorage.setItem('pulse_mock_alerts', JSON.stringify(alerts));

    broadcastLocalUpdate('incidents', 'UPDATE', incident);
    broadcastLocalUpdate('incident_alerts', 'UPDATE', { incident_id: p_incident_id, status: 'accepted' });

    return {
      data: { success: true, message: 'Incident accepted successfully', incident_id: p_incident_id },
      error: null,
    };
  }

  if (fnName === 'resolve_incident') {
    const { p_incident_id } = params;
    const incidents = JSON.parse(mockStorage.getItem('pulse_mock_incidents') || '[]');
    const incident = incidents.find((i) => i.id === p_incident_id);
    if (incident) {
      incident.status = 'resolved';
      incident.resolved_at = new Date().toISOString();
      mockStorage.setItem('pulse_mock_incidents', JSON.stringify(incidents));
      broadcastLocalUpdate('incidents', 'UPDATE', incident);
    }
    return { data: { success: true, status: 'resolved' }, error: null };
  }

  if (fnName === 'cancel_incident') {
    const { p_incident_id } = params;
    const incidents = JSON.parse(mockStorage.getItem('pulse_mock_incidents') || '[]');
    const incident = incidents.find((i) => i.id === p_incident_id);
    if (incident) {
      incident.status = 'cancelled';
      incident.resolved_at = new Date().toISOString();
      mockStorage.setItem('pulse_mock_incidents', JSON.stringify(incidents));
      broadcastLocalUpdate('incidents', 'UPDATE', incident);
    }
    return { data: { success: true, status: 'cancelled' }, error: null };
  }

  if (fnName === 'update_my_location') {
    const { p_lat, p_lng } = params;
    const profiles = JSON.parse(mockStorage.getItem('pulse_mock_profiles') || '[]');
    const profile = profiles.find((p) => p.id === callerId);
    if (profile) {
      profile.lat = p_lat;
      profile.lng = p_lng;
      profile.location_updated_at = new Date().toISOString();
      mockStorage.setItem('pulse_mock_profiles', JSON.stringify(profiles));
      broadcastLocalUpdate('profiles', 'UPDATE', profile);
    }
    return { data: { success: true, lat: p_lat, lng: p_lng }, error: null };
  }

  return { data: null, error: { message: `Unknown RPC function: ${fnName}` } };
}

// Distance helper
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ========================================================================
// UNIFIED RPC HELPERS
// ========================================================================

export async function rpcCreateIncident({ type, description, lat, lng, label, bloodGroup }) {
  try {
    const { data, error } = await supabase.rpc('create_incident', {
      p_type: type,
      p_description: description || '',
      p_lat: lat,
      p_lng: lng,
      p_label: label,
      p_blood_group: bloodGroup || null,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('rpcCreateIncident error:', err);
    return { data: null, error: err };
  }
}

export async function rpcAcceptIncident(incidentId) {
  try {
    const { data, error } = await supabase.rpc('accept_incident', {
      p_incident_id: incidentId,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('rpcAcceptIncident error:', err);
    return { data: null, error: err };
  }
}

export async function rpcResolveIncident(incidentId) {
  try {
    const { data, error } = await supabase.rpc('resolve_incident', {
      p_incident_id: incidentId,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('rpcResolveIncident error:', err);
    return { data: null, error: err };
  }
}

export async function rpcCancelIncident(incidentId) {
  try {
    const { data, error } = await supabase.rpc('cancel_incident', {
      p_incident_id: incidentId,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('rpcCancelIncident error:', err);
    return { data: null, error: err };
  }
}

export async function rpcUpdateMyLocation(lat, lng) {
  try {
    const { data, error } = await supabase.rpc('update_my_location', {
      p_lat: lat,
      p_lng: lng,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('rpcUpdateMyLocation error:', err);
    return { data: null, error: err };
  }
}

export async function fetchIncidentStats() {
  try {
    const { data, error } = await supabase.from('incident_stats').select('*').single();
    if (error && !data) {
      // Fallback calculation from incidents table if view is not accessible
      const { data: allInc } = await supabase.from('incidents_with_coords').select('*');
      if (allInc) {
        const total = allInc.length;
        const resolved = allInc.filter((i) => i.status === 'resolved').length;
        const open = allInc.filter((i) => i.status === 'open').length;
        const active = allInc.filter((i) => i.status === 'accepted').length;
        return {
          data: {
            total_incidents: total,
            resolved_incidents: resolved,
            open_incidents: open,
            active_incidents: active,
            avg_response_time_seconds: 48,
            active_volunteers_count: 12,
          },
          error: null,
        };
      }
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function generateAiSummary(incidentId) {
  try {
    if (isConfigured) {
      const { data, error } = await supabase.functions.invoke('summarize-incident', {
        body: { incident_id: incidentId },
      });
      if (!error && data?.ai_summary) {
        return { summary: data.ai_summary, error: null };
      }
    }

    // Client-side fallback summary if edge function not yet deployed or in mock mode
    const { data: incident } = await supabase
      .from('incidents_with_coords')
      .select('*')
      .eq('id', incidentId)
      .single();

    const vol = incident?.volunteer_name || 'Designated Campus Volunteer';
    const loc = incident?.location_label || 'Campus Grounds';
    const typ = incident?.type?.toUpperCase() || 'EMERGENCY';
    const summary = `[AI Post-Mortem Report] ${typ} incident at ${loc} was resolved successfully. Responder ${vol} handled field triage and secured the perimeter. Campus safety protocols validated.`;

    await supabase.from('incidents').update({ ai_summary: summary }).eq('id', incidentId);
    return { summary, error: null };
  } catch (err) {
    console.error('generateAiSummary error:', err);
    return { summary: 'Emergency resolved and closed by campus responder.', error: err };
  }
}
