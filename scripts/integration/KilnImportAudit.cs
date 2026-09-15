// Copy only into a disposable Unity project with its chosen glTF importer installed.
using UnityEngine;
using UnityEditor;
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;

public static class KilnImportAudit {
    [Serializable] public class Node {
        public string name, parent;
        public float[] localPosition, worldPosition;
        public float[] materialMetallicFactors, materialRoughnessFactors;
        public int vertices, colors, uvSets, morphTargets, bones;
    }
    [Serializable] public class Mat {
        public string name, shader;
        public string[] properties, textures;
        public float metallicFactor, roughnessFactor, cullMode;
        public bool hasMetallicRoughnessFactors, hasCullMode;
    }
    [Serializable] public class Record {
        public string file, error;
        public List<Node> nodes = new();
        public List<Mat> materials = new();
        public List<string> animations = new();
        public int animatedNodeCount;
        public List<string> animatedNodes = new();
    }
    [Serializable] public class Report {
        public string engine = "unity", version = Application.unityVersion, renderPipeline;
        public string[] packages;
        public List<Record> files = new();
    }
    static float[] Values(Vector3 v) => new[] {v.x, v.y, v.z};
    static string Argument(string key) {
        var args = Environment.GetCommandLineArgs();
        var index = Array.IndexOf(args, key);
        if (index < 0 || index + 1 >= args.Length) throw new ArgumentException(key + " is required");
        return args[index + 1];
    }
    public static void Run() {
        var input = Argument("-kilnInput");
        var output = Argument("-kilnReceipt");
        const string folder = "Assets/KilnImportFixtures";
        if (Directory.Exists(folder)) throw new InvalidOperationException("Use a fresh project: " + folder + " already exists");
        Directory.CreateDirectory(folder);
        var pipeline = UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline;
        var report = new Report {
            renderPipeline = pipeline ? pipeline.GetType().FullName : "Built-in",
            packages = UnityEditor.PackageManager.PackageInfo.GetAllRegisteredPackages().Select(p => p.name + "@" + p.version).OrderBy(p => p).ToArray()
        };
        foreach (var source in Directory.GetFiles(input, "*.glb").OrderBy(p => p)) {
            var record = new Record {file = Path.GetFileName(source)};
            report.files.Add(record);
            GameObject instance = null;
            try {
                var path = folder + "/" + record.file;
                File.Copy(source, path, false);
                AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceSynchronousImport);
                var asset = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (!asset) throw new InvalidOperationException("No imported GameObject");
                instance = UnityEngine.Object.Instantiate(asset);
                instance.name = asset.name;
                foreach (var transform in instance.GetComponentsInChildren<Transform>(true)) {
                    var filter = transform.GetComponent<MeshFilter>();
                    var skin = transform.GetComponent<SkinnedMeshRenderer>();
                    var mesh = skin ? skin.sharedMesh : filter ? filter.sharedMesh : null;
                    var renderer = transform.GetComponent<Renderer>();
                    var materials = renderer ? renderer.sharedMaterials : new Material[0];
                    int uvSets = 0;
                    if (mesh) for (int channel = 0; channel < 8; channel++) {
                        var uv = new List<Vector4>(); mesh.GetUVs(channel, uv); if (uv.Count > 0) uvSets++;
                    }
                    record.nodes.Add(new Node {
                        name = transform.name, parent = transform.parent ? transform.parent.name : null,
                        localPosition = Values(transform.localPosition), worldPosition = Values(transform.position),
                        materialMetallicFactors = materials.Select(m => m && m.HasProperty("metallicFactor") ? m.GetFloat("metallicFactor") : -1).ToArray(),
                        materialRoughnessFactors = materials.Select(m => m && m.HasProperty("roughnessFactor") ? m.GetFloat("roughnessFactor") : -1).ToArray(),
                        vertices = mesh ? mesh.vertexCount : 0, colors = mesh && mesh.colors.Length > 0 ? 1 : 0,
                        uvSets = uvSets, morphTargets = mesh ? mesh.blendShapeCount : 0, bones = skin ? skin.bones.Length : 0
                    });
                }
                foreach (var material in instance.GetComponentsInChildren<Renderer>(true).SelectMany(r => r.sharedMaterials).Where(m => m).Distinct()) {
                    record.materials.Add(new Mat {
                        name = material.name, shader = material.shader.name,
                        hasMetallicRoughnessFactors = material.HasProperty("metallicFactor") && material.HasProperty("roughnessFactor"),
                        metallicFactor = material.HasProperty("metallicFactor") ? material.GetFloat("metallicFactor") : 0,
                        roughnessFactor = material.HasProperty("roughnessFactor") ? material.GetFloat("roughnessFactor") : 0,
                        hasCullMode = material.HasProperty("_CullMode"),
                        cullMode = material.HasProperty("_CullMode") ? material.GetFloat("_CullMode") : 0,
                        properties = Enumerable.Range(0, material.shader.GetPropertyCount()).Select(i => material.shader.GetPropertyName(i)).ToArray(),
                        textures = material.GetTexturePropertyNames().Where(p => material.GetTexture(p)).OrderBy(p => p).ToArray()
                    });
                }
                var clips = AssetDatabase.LoadAllAssetsAtPath(path).OfType<AnimationClip>().ToArray();
                record.animations.AddRange(clips.Select(c => c.name).OrderBy(n => n));
                var moving = new HashSet<string>();
                foreach (var clip in clips) {
                    clip.SampleAnimation(instance, 0);
                    var transforms = instance.GetComponentsInChildren<Transform>(true);
                    var initialPositions = transforms.Select(t => t.localPosition).ToArray();
                    var initialRotations = transforms.Select(t => t.localRotation).ToArray();
                    foreach (var time in new[] {clip.length * .5f, clip.length}) {
                        clip.SampleAnimation(instance, time);
                        for (int i = 0; i < transforms.Length; i++)
                            if (Vector3.Distance(transforms[i].localPosition, initialPositions[i]) > 1e-5f || Quaternion.Angle(transforms[i].localRotation, initialRotations[i]) > .01f) moving.Add(transforms[i].name);
                    }
                }
                record.animatedNodes = moving.OrderBy(n => n).ToList(); record.animatedNodeCount = moving.Count;
            } catch (Exception error) { record.error = error.ToString(); }
            finally { if (instance) UnityEngine.Object.DestroyImmediate(instance); }
        }
        File.WriteAllText(output, JsonUtility.ToJson(report, true));
    }
}
