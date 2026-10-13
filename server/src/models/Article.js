import crypto from 'node:crypto';
import mongoose from 'mongoose';

export const CATEGORIES = [
  'World',
  'Politics',
  'Business',
  'Sports',
  'Society',
  'Science',
  'Opinion',
];

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true },
    subtitle: { type: String, trim: true, maxlength: 240, default: '' },
    byline: { type: String, trim: true, maxlength: 80, default: 'Staff Correspondent' },
    dateline: { type: String, trim: true, maxlength: 60, default: '' },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 320, default: '' },
    body: { type: String, required: true },
    image: { type: String, trim: true, default: '' },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

articleSchema.index({ title: 'text', excerpt: 'text', body: 'text' });

articleSchema.pre('validate', async function (next) {
  if (!this.slug) {
    const base = slugify(this.title) || 'story';
    let slug = base;
    // Ensure uniqueness
    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${crypto.randomBytes(2).toString('hex')}`;
    }
    this.slug = slug;
  }
  if (!this.excerpt && this.body) {
    this.excerpt = this.body.replace(/\s+/g, ' ').slice(0, 200).trim() + '…';
  }
  next();
});

export default mongoose.model('Article', articleSchema);
