/**
 * Helper to copy real image binary (PNG Blob) directly to the system clipboard
 * so users can paste (Ctrl+V) the actual picture into WhatsApp, Live Chat, Telegram, etc.
 */
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;

  try {
    let pngBlob: Blob | null = null;

    if (imageUrl.startsWith('data:image/png')) {
      // Direct PNG data URI
      const res = await fetch(imageUrl);
      pngBlob = await res.blob();
    } else {
      // Convert SVG, JPEG, GIF, SVG data URIs, or URLs into PNG Blob via Canvas
      pngBlob = await new Promise<Blob | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 400;
            canvas.height = img.naturalHeight || img.height || 400;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(null);
              return;
            }
            // Draw background if SVG/transparent
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => resolve(blob), 'image/png');
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = imageUrl;
      });
    }

    if (pngBlob && navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ 'image/png': pngBlob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('ClipboardItem write failed, falling back to writeText:', err);
  }

  // Fallback to text copy if ClipboardItem fails
  try {
    await navigator.clipboard.writeText(imageUrl);
    return false;
  } catch {
    return false;
  }
}
