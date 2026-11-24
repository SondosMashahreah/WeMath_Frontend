import { API_BASE_URL } from '../api/client.js';
import './media.css';
export default function MediaGallery({ items = [] }) {
  return <div className="wm-media-gallery">{items.map(item => <figure key={item.asset_id}>{item.kind === 'video' ? <video controls preload="metadata" src={`${API_BASE_URL}/api/media/${encodeURIComponent(item.asset_id)}`} aria-label={item.caption || 'فيديو المادة'} /> : <img loading="lazy" src={`${API_BASE_URL}/api/media/${encodeURIComponent(item.asset_id)}`} alt={item.alt || ''} />}{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}</div>;
}
