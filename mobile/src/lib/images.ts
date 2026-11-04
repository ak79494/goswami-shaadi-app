import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Re-encodes a picked photo as a JPEG of at most 1600px, so an upload is a few hundred KB instead of
 * several MB — much faster on mobile data. Falls back to the original file if it can't be decoded.
 */
export async function shrinkPhoto(uri: string): Promise<string> {
  try {
    const image = await ImageManipulator.manipulate(uri, { maxWidth: 1600, maxHeight: 1600 }).renderAsync();
    const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    return saved.uri;
  } catch {
    return uri;
  }
}
