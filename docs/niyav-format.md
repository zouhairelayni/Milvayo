# .niyav backup format, version 1

`.niyav` is the compressed backup file of Niyarvo Projects. It holds exactly the same JSON as a `.json` backup.
Two variants share the extension; the first bytes tell them apart.

## Plain `.niyav`
A standard **gzip** stream of the backup JSON (UTF-8). It starts with the bytes `1F 8B`. `gunzip backup.niyav` opens it.
No password, no encryption: anyone with the file can read it.

## Protected `.niyav`
A 40-byte header followed by `ciphertext || tag`.

| Offset | Bytes | Field |
|---|---|---|
| 0 | 4 | magic `NIYV` (`4E 49 59 56`) |
| 4 | 1 | format version, `1` |
| 5 | 1 | key derivation, `1` = PBKDF2-HMAC-SHA256 |
| 6 | 1 | cipher, `1` = AES-256-GCM |
| 7 | 1 | payload compression, `1` = gzip |
| 8 | 4 | PBKDF2 iterations, big-endian |
| 12 | 16 | random salt |
| 28 | 12 | random nonce |
| 40 | n | AES-256-GCM ciphertext followed by the 16-byte tag |

- Key: `PBKDF2-HMAC-SHA256(password, salt, iterations, 32 bytes)`. Password = Unicode NFKC, then UTF-8.
- Plaintext: the gzip stream of the backup JSON (compress, then encrypt).
- Additional authenticated data: the whole 40-byte header. Changing any header byte makes decryption fail.
- Default iterations: 600,000 (OWASP 2023 minimum for PBKDF2-HMAC-SHA256). Readers accept 100,000 to 10,000,000 and refuse anything else before doing any work.
- Every file uses a fresh random salt and nonce. Nothing in the file names the project, workspace, counts or dates.
- Algorithms are standard and FIPS-approved (AES-256-GCM, PBKDF2-HMAC-SHA256, SHA-256). No custom cryptography.

## What this protects, and what it does not
- Protects the **exported file**: a protected backup in Downloads, e-mail or cloud storage is unreadable without the password.
- Strength is bounded by the password. Minimum 12 characters is enforced on export; a long passphrase is much stronger.
- A forgotten password cannot be recovered by anyone. There is no back door.
- A wrong password and a modified file give the same message, because GCM cannot tell them apart.
- Does **not** protect data inside the running app or its on-device storage, and does not stop someone who already has the unlocked app.
- Unprotected `.json` and plain `.niyav` backups contain everything readable. Treat them as sensitive.
- Recovery snapshots are left out of backups by default: they hold older copies of data, including things deleted on purpose.

## Versioning
The header carries version, KDF, cipher and compression ids, so stronger settings can be added later without breaking old files. A reader that meets a newer version says so instead of guessing.
