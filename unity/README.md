# Unity fork (placeholder)

This folder is a **pointer**, not a Unity project yet.

When you start Path B from [`docs/PATH_B_UNITY_PLAN.md`](../docs/PATH_B_UNITY_PLAN.md) (see also [`docs/VISUAL_TARGET_FF8_UNITY_FORK.md`](../docs/VISUAL_TARGET_FF8_UNITY_FORK.md)):

1. Create a **new repository** (recommended) e.g. `3body-unity` or open Unity Hub → New URP/HDRP project here.  
2. Copy or submodule shared design: `docs/GDD.md`, `docs/ORBITAL_SIM.md`, narrative export.  
3. Do **not** commit `Library/`, `Temp/`, or large `.fbx`/`.psd` without Git LFS.
4. Copy [`MILESTONES.md`](./MILESTONES.md) into the Unity repo root.
5. From the **web repo**, run `npm run export:unity` and import — [`IMPORT_CONTENT_SNAPSHOT.md`](./IMPORT_CONTENT_SNAPSHOT.md).

The web demo in the repo root remains the gameplay reference until Unity reaches vertical-slice parity.
