import { useCallback, useEffect, useState } from 'react';
import {
  deleteLearningResource,
  downloadLearningResource,
  formatFileSize,
  listLessonResources,
  uploadLessonResource,
  type LearningResourceDto,
} from '../../services/resourceApi';

interface LessonResourcesPanelProps {
  lessonId: string;
  canManage: boolean;
  onError: (msg: string) => void;
}

export function LessonResourcesPanel({ lessonId, canManage, onError }: LessonResourcesPanelProps) {
  const [items, setItems] = useState<LearningResourceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listLessonResources(lessonId));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to load resources');
    } finally {
      setLoading(false);
    }
  }, [lessonId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#1E2531]">Learning resources</h3>
        {canManage ? (
          <label className="cursor-pointer rounded-xl bg-[#B01828] px-3 py-1.5 text-xs font-semibold text-[#F8F8F8]">
            {uploading ? 'Uploading…' : 'Upload file'}
            <input
              type="file"
              className="sr-only"
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.mp4,.webm,application/pdf,image/*,audio/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setUploading(true);
                void uploadLessonResource(lessonId, file)
                  .then(() => load())
                  .catch((err) => onError(err instanceof Error ? err.message : 'Upload failed'))
                  .finally(() => setUploading(false));
              }}
            />
          </label>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-[#758188]">
        PDF, images, audio, or video · max 10 MB · downloads require login
      </p>

      {loading ? <p className="mt-3 text-sm text-[#758188]">Loading…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="mt-3 text-sm text-[#758188]">No files attached to this lesson yet.</p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item._id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-[#1E2531]">{item.originalFilename}</p>
              <p className="text-xs text-[#758188]">
                {item.mimeType} · {formatFileSize(item.sizeBytes)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-[#E4DFE5] px-2 py-1 text-xs font-semibold text-[#B01828]"
                onClick={() =>
                  void downloadLearningResource(item).catch((err) =>
                    onError(err instanceof Error ? err.message : 'Download failed'),
                  )
                }
              >
                Download
              </button>
              {canManage ? (
                <button
                  type="button"
                  className="rounded-lg border border-[#E4DFE5] px-2 py-1 text-xs font-semibold text-[#E03040]"
                  onClick={() =>
                    void deleteLearningResource(item._id)
                      .then(() => load())
                      .catch((err) => onError(err instanceof Error ? err.message : 'Delete failed'))
                  }
                >
                  Delete
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
