# Database & Upload Backups

## MongoDB

### Managed (Atlas / cloud)

1. Enable continuous or snapshot backups in the provider console.
2. Document retention (e.g. 7 daily + 4 weekly).
3. Quarterly: perform a **restore drill** into a scratch cluster and verify login + one course read.

### Self-hosted

```bash
# Backup
mongodump --uri="$MONGODB_URI" --out="./backups/$(date +%Y%m%d-%H%M)"

# Restore (destructive — target empty/scratch DB first)
mongorestore --uri="$MONGODB_URI_SCRATCH" ./backups/YYYYMMDD-HHMM
```

Store dumps encrypted off-box (S3, encrypted volume). Never commit dumps to git.

## Uploads

| Storage | Backup |
|---------|--------|
| Local `UPLOAD_ROOT` | Include directory in filesystem snapshots; single-node only |
| Object storage (recommended prod) | Use bucket versioning + lifecycle; see `UPLOADS.md` |

`LearningResource` metadata in Mongo must stay consistent with blobs — restore DB and storage from the **same point in time** when possible.

## Restore checklist

1. Announce maintenance.
2. Stop writers (API scale to 0) if doing a hard restore.
3. Restore Mongo to target URI.
4. Restore upload blobs / bucket.
5. Start API; confirm `/api/v1/health` ready.
6. Smoke: admin login, open a course, download one resource if used.
7. Record drill date in the ops log.
