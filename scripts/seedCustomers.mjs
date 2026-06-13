// seedCustomers.mjs  — run with: node scripts/seedCustomers.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBZeGLqGwnJVaXgpUIzW0P9DCvOlaDRm-A",
  authDomain: "mogdishowater-9edc2.firebaseapp.com",
  projectId: "mogdishowater-9edc2",
  storageBucket: "mogdishowater-9edc2.firebasestorage.app",
  messagingSenderId: "433044619486",
  appId: "1:433044619486:web:ececde02c008362231c24f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const customers = [
  {
    name: 'Axmed Cali Hassan',
    sqn: 'SQN-001',
    tel: '0615001001',
    zone: 'Hodan',
    address: 'Wadada Maka Al-Mukarama, Hodan, Muqdisho',
    lastReading: 1248,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Faadumo Nuur Warsame',
    sqn: 'SQN-002',
    tel: '0617002002',
    zone: 'Heliwaa',
    address: 'Xaafadda Heliwaa, Muqdisho',
    lastReading: 876,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Maxamed Cabdi Jaamac',
    sqn: 'SQN-003',
    tel: '0618003003',
    zone: 'Wadajir',
    address: 'Wadajir District, K4, Muqdisho',
    lastReading: 2105,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Ubax Yusuf Ciise',
    sqn: 'SQN-004',
    tel: '0619004004',
    zone: 'Kaxda',
    address: 'Kaxda, Muqdisho South',
    lastReading: 543,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Cabdilaahi Muuse Farah',
    sqn: 'SQN-005',
    tel: '0610005005',
    zone: 'Hodan',
    address: 'Yaaqshiid, Wadada Afgooye, Muqdisho',
    lastReading: 1890,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Saynab Xasan Warsame',
    sqn: 'SQN-006',
    tel: '0611006006',
    zone: 'Heliwaa',
    address: 'Heliwaa Xaafadda 2aad, Muqdisho',
    lastReading: 320,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Cumar Yuusuf Maxamed',
    sqn: 'SQN-007',
    tel: '0612007007',
    zone: 'Wadajir',
    address: 'Holhol Street, Wadajir, Muqdisho',
    lastReading: 745,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Hodan Abdirahman Bile',
    sqn: 'SQN-008',
    tel: '0613008008',
    zone: 'Kaxda',
    address: 'Kaxda Industrial Zone, Muqdisho',
    lastReading: 980,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Mustafa Dahir Sheikh',
    sqn: 'SQN-009',
    tel: '0614009009',
    zone: 'Hodan',
    address: 'KM4, Mogadishu University Area, Hodan',
    lastReading: 1560,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
  {
    name: 'Asha Warsame Jilaal',
    sqn: 'SQN-010',
    tel: '0616010010',
    zone: 'Heliwaa',
    address: 'Taleex Road, Heliwaa, Muqdisho',
    lastReading: 2300,
    lastReadingDate: '2026-05-01',
    status: 'active',
  },
];

async function seed() {
  console.log('🚀 Bilaabaya seed-ka macaamiisha Firebase...\n');
  const colRef = collection(db, 'customers');
  let added = 0;
  let skipped = 0;

  for (const customer of customers) {
    // Check if SQN already exists
    const existing = await getDocs(query(colRef, where('sqn', '==', customer.sqn)));
    if (!existing.empty) {
      console.log(`⏭  Skip (hore ayuu jiraa): ${customer.name} [${customer.sqn}]`);
      skipped++;
      continue;
    }

    try {
      const docRef = await addDoc(colRef, {
        ...customer,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Added: ${customer.name} [${customer.sqn}] → ID: ${docRef.id}`);
      added++;
    } catch (err) {
      console.error(`❌ Error adding ${customer.name}:`, err.message);
    }
  }

  console.log(`\n📊 Summary: ${added} macmiil la daray, ${skipped} la booday (hore ayey jiraayeen).`);
  console.log('✔  Seed dhammaatay!\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
