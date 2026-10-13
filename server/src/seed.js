import Article from './models/Article.js';
import User from './models/User.js';

const p = (...paras) => paras.join('\n\n');

const STORIES = [
  {
    title: 'Great Exposition Opens Its Gates to Record Multitudes',
    subtitle: 'Forty thousand citizens pass the turnstiles on the first morning alone',
    byline: 'By Our Special Correspondent',
    dateline: 'THE CITY',
    category: 'World',
    featured: true,
    body: p(
      'Long before the bells of the clock tower had finished their morning peal, a crowd of unprecedented size had gathered at the great iron gates of the Exposition grounds, eager to behold the marvels promised by its organisers.',
      'Within the main hall, visitors found electric lamps in numbers sufficient to turn night into noon, a talking machine of remarkable clarity, and a model of the modern household fitted with every convenience that ingenuity can devise.',
      'The Director declared from the platform that the Exposition would stand as proof that the age of invention is only beginning. "What we show you today," he said, "is but the first page of a very long volume."',
      'Railway companies report that excursion trains from neighbouring counties were filled to the doors, and local hotels have posted notices that no rooms remain for the remainder of the week.',
      'The Exposition will remain open daily from nine in the morning until ten at night. Admission is fifty cents for adults, and a quarter for children under twelve.'
    ),
  },
  {
    title: 'Council Debates Lighting of Outer Boulevards',
    subtitle: 'Aldermen split over cost of extending the electric mains',
    byline: 'By A. Whitcombe',
    dateline: 'CITY HALL',
    category: 'Politics',
    body: p(
      'A lively session of the Municipal Council last evening was devoted almost entirely to the question of whether the outer boulevards ought to be furnished with electric street lamps.',
      'Alderman Hartley, speaking for the measure, argued that a well-lit street is a safe street, and that the city could not call itself modern while half its roads remained in darkness after sundown.',
      'Opponents pointed to the expense, which the Treasurer estimates at some sixty thousand dollars, and urged that the sum be applied instead to the repair of bridges and drains.',
      'A vote was deferred until the next sitting, when the Council expects to receive a full report from the Committee on Public Works.'
    ),
  },
  {
    title: 'Markets Steady as Wheat and Copper Climb',
    subtitle: 'Brokers report cheerful trading on the floor',
    byline: 'By Our Financial Editor',
    dateline: 'THE EXCHANGE',
    category: 'Business',
    body: p(
      'Trading was brisk but orderly at the Exchange yesterday, with industrial shares closing slightly higher and wheat advancing on reports of a smaller harvest in the western provinces.',
      'Copper, in particular, drew the attention of buyers, owing to the growing demand for wire and cable occasioned by the spread of electric service to new districts.',
      'Several brokers of long standing expressed the opinion that the present season would prove one of the most prosperous in recent memory, though prudent men were advised to keep a reserve against unforeseen events.'
    ),
  },
  {
    title: 'Home Eleven Triumph in Thrilling Match at the Fairgrounds',
    subtitle: 'A late goal settles the contest before a crowd of twelve thousand',
    byline: 'By Our Sporting Editor',
    dateline: 'THE FAIRGROUNDS',
    category: 'Sports',
    body: p(
      'Twelve thousand spectators, many of whom had travelled considerable distances, saw the home eleven defeat their rivals by a single goal in the closing minutes of a hard-fought match on Saturday afternoon.',
      'The visitors held the advantage in the early play, but the home defence stood firm, and a swift advance down the left wing in the eighty-sixth minute produced the decisive score.',
      'The captain of the winning side praised the spirit of his men and the generosity of the crowd, which cheered both teams from the field.'
    ),
  },
  {
    title: 'Ladies’ Society Announces Autumn Charity Ball',
    subtitle: 'Proceeds to benefit the new children’s infirmary',
    byline: 'By Miss E. Fairweather',
    dateline: 'SOCIETY PAGES',
    category: 'Society',
    body: p(
      'The Ladies’ Benevolent Society has announced that its annual Autumn Ball will be held at the Grand Assembly Rooms on the last Saturday of the month, with dancing to commence at eight o’clock.',
      'A string orchestra has been engaged for the evening, and refreshments will be supplied by the best caterers in the city. Tickets may be obtained from any member of the committee.',
      'All proceeds will be devoted to the furnishing of the new children’s infirmary, whose doors, it is hoped, will open before the winter.'
    ),
  },
  {
    title: 'Wireless Concert Heard Across Three Counties',
    subtitle: 'Amateur operators describe music “as clear as a drawing room”',
    byline: 'By Our Science Reporter',
    dateline: 'THE LABORATORY',
    category: 'Science',
    body: p(
      'A concert of vocal and instrumental music, transmitted by wireless from a station on the hill above the town, was received with remarkable clearness by amateur operators across three counties on Thursday evening.',
      'Several enthusiasts reported that, with a modest receiving set and a length of wire strung between two trees, they were able to follow the entire programme, including a soprano solo and a march by the town band.',
      'Engineers connected with the station say that regular programmes may soon be offered, and that the day is not distant when a receiving set will be as common in the home as the piano.'
    ),
  },
  {
    title: 'On the Duty of the Press in a Changing Age',
    subtitle: 'An editorial',
    byline: 'The Editor',
    dateline: 'EDITORIAL',
    category: 'Opinion',
    body: p(
      'The world moves faster than it once did. News that formerly took a week to cross a continent now arrives within the hour, and the reader who rises with the sun may know by breakfast what the previous night has brought forth in distant capitals.',
      'It is, therefore, more than ever the duty of a newspaper to be accurate before it is first, to be fair before it is forceful, and to remember that behind every headline there stands a human being who must live with what is printed.',
      'We pledge, to our readers, that The Daily Chronicle shall endeavour to deserve their trust in the days that lie ahead.'
    ),
  },
  {
    title: 'Motor Omnibus Service to Begin on the Northern Road',
    subtitle: 'Fares fixed at five cents the mile',
    byline: 'By Our Transport Correspondent',
    dateline: 'THE NORTHERN ROAD',
    category: 'World',
    body: p(
      'A company of local gentlemen has announced that a regular motor omnibus service will begin next month between the market square and the northern suburbs, running every half hour from six in the morning until nine at night.',
      'The vehicles, each accommodating twenty passengers, are said to be of the most modern construction, with covered seats and a bell by which the traveller may signal the driver to stop.'
    ),
  },
];

export async function seedIfEmpty() {
  // Editor account (created once from env)
  const email = (process.env.ADMIN_EMAIL || 'editor@chronicle.test').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  if (!(await User.exists({ email }))) {
    await User.create({ email, name: 'The Editor', passwordHash: await User.hash(password) });
    console.log(`[seed] Editor account created: ${email}`);
  }

  if ((await Article.countDocuments()) === 0) {
    const now = Date.now();
    for (let i = 0; i < STORIES.length; i++) {
      const doc = new Article({ ...STORIES[i] });
      doc.createdAt = new Date(now - i * 3 * 60 * 60 * 1000);
      doc.views = Math.max(5, 180 - i * 22);
      await doc.save();
    }
    console.log(`[seed] Inserted ${STORIES.length} sample stories`);
  }
}

// `npm run seed` -> force reseed of sample stories
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const { default: dotenv } = await import('dotenv');
  dotenv.config();
  const { connectDB } = await import('./config/db.js');
  await connectDB();
  await Article.deleteMany({});
  await seedIfEmpty();
  process.exit(0);
}
