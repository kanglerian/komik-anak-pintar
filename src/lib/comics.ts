import fs from 'node:fs';
import path from 'node:path';

// Daftarkan glob pada Vite agar penambahan/perubahan folder & gambar di public/comics otomatis memicu hot-reload
import.meta.glob('/public/comics/**/*');

export interface ComicMeta {
	title?: string;
	description?: string;
	author?: string;
	badge?: string;
	color?: 'amber' | 'sky' | 'emerald' | 'rose' | 'violet';
	width?: number;
	height?: number;
}

export interface Comic {
	slug: string;
	title: string;
	description: string;
	author: string;
	badge: string;
	color: 'amber' | 'sky' | 'emerald' | 'rose' | 'violet';
	coverUrl: string;
	pages: string[];
	pageCount: number;
	width: number;
	height: number;
}

const DEFAULT_COLORS: Array<Comic['color']> = ['emerald', 'amber', 'sky', 'rose', 'violet'];

function formatSlugToTitle(slug: string): string {
	return slug
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getAllComics(): Comic[] {
	const comicsDir = path.join(process.cwd(), 'public', 'comics');

	if (!fs.existsSync(comicsDir)) {
		return [];
	}

	const entries = fs.readdirSync(comicsDir, { withFileTypes: true });
	const folders = entries
		.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));

	const comics: Comic[] = [];

	folders.forEach((folderName, index) => {
		const folderPath = path.join(comicsDir, folderName);
		const files = fs.readdirSync(folderPath);

		// Ambil semua file gambar (.webp, atau fallback .png/.jpg/.avif bila ada)
		const imageFiles = files
			.filter((f) => /\.(webp|png|jpe?g|avif)$/i.test(f))
			.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

		if (imageFiles.length === 0) {
			return;
		}

		// Baca meta.json jika ada
		let meta: ComicMeta = {};
		const metaPath = path.join(folderPath, 'meta.json');
		if (fs.existsSync(metaPath)) {
			try {
				const raw = fs.readFileSync(metaPath, 'utf-8');
				meta = JSON.parse(raw);
			} catch (err) {
				console.warn(`Gagal membaca meta.json pada folder ${folderName}:`, err);
			}
		}

		const pages = imageFiles.map((file) => `/comics/${folderName}/${file}`);

		comics.push({
			slug: folderName,
			title: meta.title || formatSlugToTitle(folderName),
			description:
				meta.description ||
				'Yuk baca keseruan cerita komik bergambar ini! Geser atau tarik ujung halaman seperti membaca buku sungguhan.',
			author: meta.author || 'Komik Anak Pintar',
			badge: meta.badge || 'Semua Umur',
			color: meta.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
			coverUrl: pages[0],
			pages,
			pageCount: pages.length,
			width: meta.width || 1280,
			height: meta.height || 720,
		});
	});

	return comics;
}

export function getComicBySlug(slug: string): Comic | undefined {
	const comics = getAllComics();
	return comics.find((comic) => comic.slug === slug);
}
