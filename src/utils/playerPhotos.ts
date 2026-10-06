export const FIELD_PHOTOS_KEY = 'playerPhotos';
export const SUB_PHOTOS_KEY = 'substitutePhotos';

const PHOTO_SIZE = 256;

export type PhotoMap = Record<number, string>;

export const loadPhotos = (key: string): PhotoMap => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
};

export const savePhotos = (key: string, photos: PhotoMap) => {
  localStorage.setItem(key, JSON.stringify(photos));
};

// Square-crop and shrink before storing: localStorage holds about 5 MB and a
// phone photo is several times that on its own.
export const readPhotoFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('That file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Could not open that image'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = PHOTO_SIZE;
        canvas.height = PHOTO_SIZE;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not process that image'));
          return;
        }

        const side = Math.min(image.width, image.height);
        context.drawImage(
          image,
          (image.width - side) / 2,
          (image.height - side) / 2,
          side,
          side,
          0,
          0,
          PHOTO_SIZE,
          PHOTO_SIZE
        );

        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

export const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
