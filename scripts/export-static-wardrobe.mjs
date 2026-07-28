import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "data");
const destination = path.join(root, "public", "wardrobe");

const rewriteLibraryAsset = (url) => url?.replace("/api/import/library/", "/wardrobe/imported/") || url;
const rewriteOutfitAsset = (url) => url ? `/wardrobe/outfit-images/${path.basename(url)}` : url;

try {
  await access(path.join(source, "library.json"));
} catch {
  // Production deployments use the checked-in static snapshot in public/wardrobe.
  await access(path.join(destination, "library.json"));
  process.exit(0);
}

const library = JSON.parse(await readFile(path.join(source, "library.json"), "utf8"));
const outfits = JSON.parse(await readFile(path.join(source, "outfits.json"), "utf8"));

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(path.join(source, "imported"), path.join(destination, "imported"), { recursive: true });
await cp(path.join(source, "outfit-images"), path.join(destination, "outfit-images"), { recursive: true });

await writeFile(
  path.join(destination, "library.json"),
  `${JSON.stringify(library.map((item) => ({
    ...item,
    image: rewriteLibraryAsset(item.image),
    thumbnail: rewriteLibraryAsset(item.thumbnail),
    modeledImage: rewriteLibraryAsset(item.modeledImage),
  })), null, 2)}\n`,
);
await writeFile(
  path.join(destination, "outfits.json"),
  `${JSON.stringify({
    ...outfits,
    outfits: (outfits.outfits || []).map((outfit) => ({ ...outfit, image: rewriteOutfitAsset(outfit.image) })),
  }, null, 2)}\n`,
);
