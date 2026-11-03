#!/usr/bin/env node
// Creates demo members through the public API so Matches, Interests and Chats have data to show.
// Safe to re-run: existing demo accounts are logged into instead of recreated.
//
//   node scripts/seed-demo.mjs                 # backend on http://localhost:8080
//   API_URL=http://192.168.1.20:8080 node scripts/seed-demo.mjs
//
// Every demo account uses the password below. Never run this against production.

const API = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '') + '/api';
const PASSWORD = 'Demo@12345';

const MEMBERS = [
  { first: 'Ananya', last: 'Giri', gender: 'FEMALE', dob: '1998-03-14', city: 'Varanasi', state: 'Uttar Pradesh', height: '5.4', education: 'M.Sc', profession: 'Teacher / Professor', sub: 'Giri', about: 'Family-oriented, love classical music and teaching. Looking for someone kind, ambitious and grounded in our values.', hobbies: ['Music', 'Reading', 'Spirituality'] },
  { first: 'Priya', last: 'Puri', gender: 'FEMALE', dob: '1997-08-02', city: 'Pune', state: 'Maharashtra', height: '5.3', education: 'B.Tech / B.E.', profession: 'Software Professional', sub: 'Puri', about: 'Software engineer who enjoys travelling and cooking for family. Believe in respect, honesty and growing together.', hobbies: ['Travelling', 'Cooking', 'Technology'] },
  { first: 'Kavya', last: 'Bharti', gender: 'FEMALE', dob: '1999-11-21', city: 'Jaipur', state: 'Rajasthan', height: '5.2', education: 'MBBS', profession: 'Doctor', sub: 'Bharti', about: 'Doctor by profession, dancer at heart. My family means the world to me.', hobbies: ['Dancing', 'Yoga', 'Art'] },
  { first: 'Sneha', last: 'Saraswati', gender: 'FEMALE', dob: '1996-05-30', city: 'Delhi', state: 'Delhi', height: '5.6', education: 'MBA', profession: 'Banking / Finance', sub: 'Saraswati', about: 'Finance professional, fitness enthusiast and a weekend baker.', hobbies: ['Fitness', 'Cooking', 'Movies'] },
  { first: 'Rahul', last: 'Goswami', gender: 'MALE', dob: '1995-01-09', city: 'Kolkata', state: 'West Bengal', height: '5.10', education: 'M.Tech / M.E.', profession: 'Engineer', sub: 'Goswami', about: 'Engineer with a love for cricket and long drives. Simple, caring and close to my parents.', hobbies: ['Cricket', 'Travelling', 'Music'] },
  { first: 'Aditya', last: 'Giri', gender: 'MALE', dob: '1994-07-17', city: 'Bhopal', state: 'Madhya Pradesh', height: '5.11', education: 'CA', profession: 'Chartered Accountant', sub: 'Giri', about: 'Chartered accountant, avid reader and believer in traditional values with a modern outlook.', hobbies: ['Reading', 'Photography', 'Fitness'] },
  { first: 'Vikram', last: 'Puri', gender: 'MALE', dob: '1996-12-03', city: 'Bengaluru', state: 'Karnataka', height: '6.0', education: 'B.Tech / B.E.', profession: 'Software Professional', sub: 'Puri', about: 'Product engineer who loves trekking and cooking on weekends. Looking for a life partner and best friend.', hobbies: ['Travelling', 'Cooking', 'Technology'] },
  { first: 'Arjun', last: 'Bharti', gender: 'MALE', dob: '1993-04-25', city: 'Lucknow', state: 'Uttar Pradesh', height: '5.9', education: 'MBA', profession: 'Government Service', sub: 'Bharti', about: 'Government officer, spiritual, and fond of music. Family comes first.', hobbies: ['Spirituality', 'Music', 'Gardening'] },
  // Plans are set by scripts/make-premium.sh; the names say which is which, as a profile only shows a premium badge.
  { first: 'Gold', last: 'Demo', gender: 'FEMALE', dob: '1997-02-11', city: 'Indore', state: 'Madhya Pradesh', height: '5.4', education: 'MBA', profession: 'Marketing Professional', sub: 'Giri', about: 'Test account on the Gold plan.', hobbies: ['Reading', 'Travelling'] },
  { first: 'Diamond', last: 'Demo', gender: 'MALE', dob: '1994-09-05', city: 'Patna', state: 'Bihar', height: '5.9', education: 'B.Tech / B.E.', profession: 'Engineer', sub: 'Puri', about: 'Test account on the Diamond plan.', hobbies: ['Cricket', 'Music'] },
  { first: 'Platinum', last: 'Demo', gender: 'FEMALE', dob: '1996-06-18', city: 'Mumbai', state: 'Maharashtra', height: '5.5', education: 'CA', profession: 'Chartered Accountant', sub: 'Bharti', about: 'Test account on the Platinum Plus plan.', hobbies: ['Yoga', 'Cooking'] },
];

async function call(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = text;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${typeof data === 'object' ? data?.message : data}`);
  return data;
}

async function account(m, i) {
  const email = `${m.first.toLowerCase()}.demo@goswamishaadi.test`;
  try {
    return await call('POST', '/auth/register', { email, password: PASSWORD, phone: `90000000${String(i).padStart(2, '0')}`, gender: m.gender });
  } catch (e) {
    if (!String(e.message).includes('already registered')) throw e;
    return call('POST', '/auth/login', { email, password: PASSWORD });
  }
}

const tokens = [];
for (const [i, m] of MEMBERS.entries()) {
  const auth = await account(m, i);
  await call('PUT', '/profiles/me', {
    firstName: m.first, lastName: m.last, dateOfBirth: m.dob, city: m.city, state: m.state, country: 'India',
    motherTongue: 'Hindi', religion: 'Hindu', community: 'Brahmin-Goswami', subCommunity: m.sub,
    maritalStatus: 'Never Married', height: m.height, education: m.education, profession: m.profession,
    incomeRange: '₹10 – 20 Lakh', aboutMe: m.about, hobbies: m.hobbies, familyType: 'Nuclear',
    familyValues: 'Moderate', foodPreference: 'Vegetarian', smoking: 'No', drinking: 'No', profileVisible: true,
  }, auth.token);
  tokens.push({ ...auth, name: m.first, gender: m.gender });
  console.log(`✓ ${m.first} ${m.last} (${auth.email})`);
}

// A couple of interests so the Interests tab isn't empty for the demo accounts.
const women = tokens.filter((t) => t.gender === 'FEMALE');
const men = tokens.filter((t) => t.gender === 'MALE');
for (const [from, to] of [[men[0], women[0]], [women[1], men[0]]]) {
  try {
    await call('POST', `/requests/${to.userId}`, undefined, from.token);
    console.log(`♥ ${from.name} sent an interest to ${to.name}`);
  } catch (e) {
    console.log(`· interest ${from.name} → ${to.name} skipped (${e.message})`);
  }
}

console.log(`\nDone. Demo accounts use the password ${PASSWORD} — e.g. ${tokens[0].email}`);
