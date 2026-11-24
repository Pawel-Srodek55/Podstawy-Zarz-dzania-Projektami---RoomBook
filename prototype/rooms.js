const demoDate = '2026-12-15';
const openingTime = '08:00';
const closingTime = '18:00';

const equipment = {
  projector: { label: 'Projektor', icon: 'projector' },
  board: { label: 'Tablica', icon: 'board' },
  video: { label: 'Wideokonferencja', icon: 'video' },
  wifi: { label: 'Wi-Fi', icon: 'wifi' },
};

const rooms = [
  {
    id: '2-14', number: '2.14', location: 'Budynek B · Biblioteka', capacity: 12,
    equipment: ['projector', 'board', 'wifi'],
    schedule: [
      { date: demoDate, start: '08:00', end: '09:30' },
      { date: demoDate, start: '13:00', end: '14:30' },
      { date: '2026-12-16', start: '11:00', end: '12:00' },
    ],
  },
  {
    id: '1-08', number: '1.08', location: 'Budynek A · Centrum Nauki', capacity: 8,
    equipment: ['board', 'wifi'],
    schedule: [{ date: demoDate, start: '09:00', end: '10:00' }],
  },
  {
    id: '0-12', number: '0.12', location: 'Budynek C · Laboratorium', capacity: 16,
    equipment: ['projector', 'video', 'wifi'],
    schedule: [{ date: demoDate, start: '11:30', end: '13:30' }],
  },
  {
    id: '3-06', number: '3.06', location: 'Budynek A · Centrum Nauki', capacity: 20,
    equipment: ['projector', 'board', 'wifi'],
    schedule: [{ date: demoDate, start: '10:00', end: '12:00' }],
  },
  {
    id: '1-03', number: '1.03', location: 'Budynek B · Biblioteka', capacity: 4,
    equipment: ['board', 'wifi'], schedule: [],
  },
];
