# Image Download Tool

Downloads motorcycle and scooter images from Pexels/Unsplash for the Suzuki Bike System.

## Quick Start

```bash
# From project root
node tools/download-images.js
```

The script uses built-in Unsplash fallback URLs if you haven't configured your own.

## Using Your Own Images

1. Find royalty-free images on [Pexels](https://www.pexels.com/) or [Unsplash](https://unsplash.com/)
2. Copy the **direct image URL** (right-click → Copy image address, or use the download URL)
3. Edit `tools/download-images.js` and paste URLs into the `URLS` object:

```javascript
const URLS = {
  bikes: [
    'https://images.unsplash.com/photo-xxxxx?w=800',
    'https://www.pexels.com/photo/...',
    // ... 8 total
  ],
  scooters: [
    'https://...',
    // ... 4 total
  ]
};
```

4. Run `node tools/download-images.js`

## Output

Images are saved to:
- `frontend/app/public/assets/images/bikes/` — bike-1.jpg … bike-8.jpg
- `frontend/app/public/assets/images/scooters/` — scooter-1.jpg … scooter-4.jpg

| File        | Seed mapping    |
|------------|-----------------|
| bikes/bike-1.jpg | Gixxer SF 250   |
| bikes/bike-2.jpg | V-Strom SX      |
| bikes/bike-3.jpg | Access 125      |
| scooters/scooter-1.jpg | Burgman Street |
| scooters/scooter-2.jpg | Avenis 125    |

## Optional: Config File

Create a JSON file and pass it as an argument:

```bash
node tools/download-images.js path/to/my-urls.json
```

Example `my-urls.json`:

```json
{
  "bikes": ["url1", "url2", "url3", "url4", "url5", "url6", "url7", "url8"],
  "scooters": ["url1", "url2", "url3", "url4"]
}
```

## Re-seeding

After downloading images, reset and re-seed the database to apply `imageUrl`:

```bash
# If using H2/file DB, delete the DB file and restart the server
# Or run your project's data reset command
```
