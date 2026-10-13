import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Article, { CATEGORIES } from '../models/Article.js';

const router = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

const EDITABLE = [
  'title',
  'subtitle',
  'byline',
  'dateline',
  'category',
  'excerpt',
  'body',
  'image',
  'featured',
  'published',
];

// --- Public ---------------------------------------------------------------

// GET /api/articles?category=&q=&sort=latest|views&page=&limit=
router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const filter = { published: true };

  if (req.query.category && CATEGORIES.includes(req.query.category)) {
    filter.category = req.query.category;
  }
  if (req.query.featured === 'true') filter.featured = true;
  if (typeof req.query.q === 'string' && req.query.q.trim()) {
    const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 60)), 'i');
    filter.$or = [{ title: rx }, { excerpt: rx }, { body: rx }, { byline: rx }];
  }

  // Lead (featured) stories first, then newest. `sort=views` powers "Most Read".
  const sort = req.query.sort === 'views' ? { views: -1 } : { featured: -1, createdAt: -1 };
  const [items, total] = await Promise.all([
    Article.find(filter)
      .select('-body')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

router.get('/categories', async (_req, res) => {
  const counts = await Article.aggregate([
    { $match: { published: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  res.json(CATEGORIES.map((name) => ({ name, count: map[name] || 0 })));
});

// --- Editor (protected) ------------------------------------------------------

router.get('/admin/all', requireAuth, async (_req, res) => {
  const items = await Article.find().select('-body').sort({ createdAt: -1 }).lean();
  res.json({ items });
});

router.get('/admin/:id', requireAuth, async (req, res) => {
  const article = await Article.findById(req.params.id).lean();
  if (!article) return res.status(404).json({ message: 'Story not found' });
  res.json(article);
});

router.post('/', requireAuth, async (req, res) => {
  const article = await Article.create(pick(req.body || {}, EDITABLE));
  res.status(201).json(article);
});

router.put('/:id', requireAuth, async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) return res.status(404).json({ message: 'Story not found' });
  article.set(pick(req.body || {}, EDITABLE));
  await article.save();
  res.json(article);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const deleted = await Article.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Story not found' });
  res.json({ ok: true });
});

// --- Public single story (keep last so it doesn't shadow other routes) --------

router.get('/:slug', async (req, res) => {
  const article = await Article.findOneAndUpdate(
    { slug: req.params.slug, published: true },
    { $inc: { views: 1 } },
    { new: true }
  ).lean();
  if (!article) return res.status(404).json({ message: 'Story not found' });
  res.json(article);
});

export default router;
