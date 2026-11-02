import { PHOTOS } from '@/data/tours';

export const SITE = {
  name: 'Welcome to Travel',
  email: '[EMAIL]',
  // Add each real address here. Until then, the link opens a "coming soon" page.
  links: {
    whatsapp: null as string | null,
    instagram: null as string | null,
    facebook: null as string | null,
    email: null as string | null,
    travelCall: null as string | null,
    community: null as string | null,
    careers: null as string | null,
  },
};

export const PACKING_LIST = [
  'Passport and visa',
  'Travel insurance documents',
  'Bank card and some cash',
  'Phone charger and plug adaptor',
  'Swimwear and a towel',
  'Sunscreen and a hat',
  'Comfortable walking shoes',
  'Any medication you need',
];

export const WHY_TRAVEL = [
  { title: 'Premium, fair price', text: 'Handpicked activities and hostels we would stay in ourselves.' },
  { title: 'Real traveller reviews', text: 'Reviews here only come from people who actually took the trip.' },
  { title: 'Trust & support', text: 'Accredited agency with support from booking to the end of your trip.' },
  { title: 'Genuine service', text: 'Our whole team are backpackers who have done this trip themselves.' },
];

export const BUILD_FACTS = [
  { label: 'Trip length', value: 'You decide' },
  { label: 'Start & end', value: 'Anywhere' },
  { label: 'Transport', value: 'Bus or camper' },
  { label: 'Accommodation', value: 'Budget, premium or mix' },
  { label: 'Support', value: 'Before, during & after' },
  { label: 'Departure', value: 'Any day' },
];

export const BUILD_STEPS = [
  { title: 'See where you want to go', text: 'Browse popular stops and must-do activities.' },
  { title: 'Fill in the build form', text: 'Share your dates, budget and travel style.' },
  { title: 'Get matched with an expert', text: 'Our team turns your answers into a custom itinerary.' },
  { title: 'Book your epic trip', text: 'Happy with it? Pay by link and get one email with everything.' },
];

export const BUILD_PLACES = [
  { title: 'Melbourne', text: 'Laneway coffee, street art and the Great Ocean Road.', photo: PHOTOS.melbourne },
  { title: 'Sydney', text: 'The Harbour, Bondi Beach and Manly sunsets.', photo: PHOTOS.sydney },
  { title: 'Surf towns', text: 'Surf lessons and dolphins by kayak in Byron Bay.', photo: PHOTOS.byron },
  { title: 'Sunshine Coast', text: 'Beaches, national parks and wildlife in Noosa.', photo: PHOTOS.noosa },
  { title: "K'gari", text: 'Freshwater lakes, shipwrecks and sleeping under stars.', photo: PHOTOS.kgari },
  { title: 'The Whitsundays', text: 'A three-day sail or day trips, plus scenic flights.', photo: PHOTOS.whitsundays },
  { title: 'Rainforests', text: 'Cape Tribulation, croc cruises and waterfalls.', photo: PHOTOS.rainforest },
  { title: 'Great Barrier Reef', text: 'Blue seas, colourful coral and fish everywhere.', photo: PHOTOS.reef },
];

export const STAY_OPTIONS = [
  { title: 'Budget', text: '8–10 bed hostel dorms in the middle of the social scene.' },
  { title: 'Premium', text: 'Better facilities, smaller or gender-specific dorms.' },
  { title: 'Private', text: 'Your own room, with an ensuite upgrade available.' },
  { title: 'Campsites', text: 'Stop at hidden beaches on your own schedule.' },
];

export const TRANSPORT_OPTIONS = [
  { title: 'Bus', text: 'The most popular and cost-effective way. Reclining seats and wifi.' },
  { title: 'Campervan', text: 'Freedom to stop anywhere, even better with mates.' },
  { title: 'Fly', text: 'Short on time? Skip days of ground travel.' },
];

export const ACTIVITIES = [
  'Scenic Flight · Whitsundays',
  'Skydive · Mission Beach',
  'Surf Lesson · Byron Bay',
  'Surf Lesson · Rainbow Beach',
  '1 Day Speed Boat · Whitsundays',
  'Intro Scuba Dive · Great Barrier Reef',
  'Bungy Jump · Cairns',
  'Australia Zoo · Queensland',
  'Overnight Sail Boat · Whitsundays',
  'Waterfall Tour · Cairns',
  'Moreton Island · Brisbane',
  'Dolphin Kayak · Byron Bay',
  'White Water Rafting · Cairns',
  'Daintree Rainforest · Cairns',
  'Jetski Safari · Airlie Beach',
  'Fitzroy Island · Cairns',
];

export const INSPIRATION = {
  title: 'Brisbane to Cairns in 3 weeks',
  text: 'The essentials route: surf towns, national parks and the Big 3, K’gari, the Whitsundays and the reef.',
  stops: [
    { place: 'Brisbane', note: 'Queensland’s capital and Australia Zoo' },
    { place: 'Noosa', note: 'Learn to surf and hike the coastal path' },
    { place: "K'gari", note: 'The world’s largest sand island' },
    { place: 'The Whitsundays', note: 'Whitehaven Beach and Heart Reef' },
    { place: 'Cairns', note: 'Skydive, bungy jump or croc spot' },
    { place: 'Great Barrier Reef', note: 'Saved the best til last' },
  ],
  activities: [
    'Australia Zoo · Queensland',
    'Scenic Flight · Whitsundays',
    'Bungy Jump · Cairns',
    'Intro Scuba Dive · Great Barrier Reef',
  ],
};

export const FAQS = [
  { question: 'How do I get a personalised plan?', answer: '[ANSWER]' },
  { question: 'Are there any costs to make a personalised plan?', answer: '[ANSWER]' },
];

export const ABOUT_HIGHLIGHTS = [
  { title: 'The beginning', text: 'Two friends set off on their first big trip together.' },
  { title: 'Our first award', text: 'Best Tour in the state at the Adventure Tourism Awards.' },
  { title: 'Best youth tour operator', text: 'Crowned best youth tour operator in the world.' },
];

export const ABOUT_JOURNEY = [
  { when: '[YEAR]', title: 'The founders meet', text: 'Friends from school who later set off travelling together.' },
  { when: '[YEAR]', title: 'Landed in Australia', text: 'Arrived as backpackers and did farm work to start.' },
  { when: '[YEAR]', title: 'First jobs in travel', text: 'Started working in travel and fell in love with it.' },
  { when: '[YEAR]', title: 'The company begins', text: 'Left their jobs to give arriving travellers a better start.' },
  { when: '[YEAR]', title: 'First ever tour', text: 'The first Welcome-to-the-city tour runs in Melbourne.' },
  { when: '[YEAR]', title: 'Went viral', text: 'A video about backpacker life reaches millions of views.' },
  { when: '[YEAR]', title: 'First big award', text: 'Named Best Tour in the state at the Adventure Tourism Awards.' },
  { when: '[YEAR]', title: 'Sydney launches', text: 'Sydney city tours and road-trip add-ons go live.' },
  { when: '[YEAR]', title: 'East Coast tour', text: 'The semi-guided East Coast tour launches.' },
  { when: '[YEAR]', title: 'Best youth tour operator', text: 'Recognised at the Global Youth Travel awards.' },
  { when: 'Today', title: 'Creating epic experiences', text: 'Giving every traveller the best possible start in Australia.' },
];

export const OFFICES = [
  { city: 'Melbourne', address: '[STREET ADDRESS]', photo: PHOTOS.melbourne },
  { city: 'Sydney', address: '[STREET ADDRESS]', photo: PHOTOS.sydney },
];

export const MORE_LINKS = [
  'Free travel guides',
  'Travel gift cards',
  'Travel insurance',
  'Travel agents',
  'Careers',
  'Become a brand ambassador',
  'Terms & privacy',
];
