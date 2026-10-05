# Import web content snapshot (Unity Editor)

## 1. Generate snapshot (web repo)

```bash
cd /path/to/3body
npm run export:unity
```

Output: `export/unity-snapshot/`

## 2. Copy into Unity

```bash
mkdir -p Assets/StreamingAssets/WebReference
cp -r /path/to/3body/export/unity-snapshot/* Assets/StreamingAssets/WebReference/
```

On Windows, use Explorer or `xcopy`. Commit `StreamingAssets/WebReference/*.json` (small); keep large meshes in `Assets/_Game/Art/`.

## 3. Runtime loader (U0/U1)

Create `Assets/_Game/Scripts/Data/WebReferenceLoader.cs`:

```csharp
using System.IO;
using UnityEngine;

public static class WebReferenceLoader
{
    static string BasePath => Path.Combine(Application.streamingAssetsPath, "WebReference");

    public static string ReadText(string relativePath)
    {
        var path = Path.Combine(BasePath, relativePath);
        return File.ReadAllText(path);
    }

    public static T ReadJson<T>(string relativePath)
    {
        return JsonUtility.FromJson<T>(ReadText(relativePath));
        // Note: JsonUtility needs [Serializable] wrappers for nested objects.
        // For full fidelity use Newtonsoft.Json or Unity 6 JsonSerializer in U1.
    }
}
```

For **U1**, prefer **Newtonsoft.Json** (`com.unity.nuget.newtonsoft-json`) to deserialize `sky_palettes.json` and `logs/en.json` dictionaries as-is.

## 4. Menu item (optional)

```csharp
#if UNITY_EDITOR
using UnityEditor;
using System.IO;

public static class ImportWebSnapshotMenu
{
    [MenuItem("Trisolaris/Import Web Snapshot…")]
    static void Import()
    {
        var src = EditorUtility.OpenFolderPanel("Select export/unity-snapshot", "", "");
        if (string.IsNullOrEmpty(src)) return;
        var dst = Path.Combine(Application.dataPath, "StreamingAssets/WebReference");
        Directory.CreateDirectory(dst);
        foreach (var file in Directory.GetFiles(src, "*", SearchOption.AllDirectories))
        {
            var rel = Path.GetRelativePath(src, file);
            var target = Path.Combine(dst, rel);
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, true);
        }
        AssetDatabase.Refresh();
        Debug.Log("Web snapshot imported to StreamingAssets/WebReference");
    }
}
#endif
```

Paste into `Assets/_Game/Editor/ImportWebSnapshotMenu.cs`.

## 5. Parity check

Compare Unity-loaded `orbital_config.json` values to web `src/orbital/config.ts` after each export. Tag Unity `sync-orbital-v1` when they match and phase durations feel the same in playtest.
