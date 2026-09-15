using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.Animations;
using UnityEngine.Playables;

public class KilnDeformationGpuSmoke : MonoBehaviour
{
    public GameObject[] roots;
    public AnimationClip[] clips;
    public string[] names;

    [Serializable]
    class Asset
    {
        public string name;
        public int frontPixels, backPixels, changedPixels, unsupportedShaders;
        public float maxVertexDisplacement;
    }

    [Serializable]
    class Report
    {
        public string unity, device, api;
        public bool passed;
        public List<Asset> assets = new();
    }

    Color32[] Capture(Camera camera, string output)
    {
        var target = new RenderTexture(256, 256, 24);
        camera.targetTexture = target;
        camera.Render();
        RenderTexture.active = target;

        var texture = new Texture2D(256, 256, TextureFormat.RGB24, false);
        texture.ReadPixels(new Rect(0, 0, 256, 256), 0, 0);
        texture.Apply();
        var pixels = texture.GetPixels32();
        File.WriteAllBytes(output, texture.EncodeToPNG());

        camera.targetTexture = null;
        RenderTexture.active = null;
        Destroy(target);
        Destroy(texture);
        return pixels;
    }

    int Colored(Color32[] pixels) => pixels.Count(pixel => pixel.r + pixel.g + pixel.b > 30);

    Vector3[] Vertices(GameObject root)
    {
        var skin = root.GetComponentInChildren<SkinnedMeshRenderer>();
        if (!skin)
        {
            return Array.Empty<Vector3>();
        }

        var mesh = new Mesh();
        skin.BakeMesh(mesh);
        var vertices = mesh.vertices;
        Destroy(mesh);
        return vertices;
    }

    IEnumerator Start()
    {
        yield return null;
        var args = Environment.GetCommandLineArgs();
        var output = args[Array.IndexOf(args, "-receiptDirectory") + 1];
        Directory.CreateDirectory(output);
        var report = new Report
        {
            unity = Application.unityVersion,
            device = SystemInfo.graphicsDeviceName,
            api = SystemInfo.graphicsDeviceType.ToString(),
            passed = SystemInfo.graphicsDeviceType != UnityEngine.Rendering.GraphicsDeviceType.Null
        };
        var camera = Camera.main;
        foreach (var root in roots)
        {
            root.SetActive(false);
        }

        for (int i = 0; i < roots.Length; i++)
        {
            var root = roots[i];
            root.SetActive(true);
            var asset = new Asset { name = names[i] };
            report.assets.Add(asset);
            foreach (var renderer in root.GetComponentsInChildren<Renderer>())
            {
                foreach (var material in renderer.sharedMaterials)
                {
                    if (!material || !material.shader.isSupported || material.shader.name == "Hidden/InternalErrorShader")
                    {
                        asset.unsupportedShaders++;
                    }
                }
            }

            var graph = PlayableGraph.Create("Deformation");
            graph.SetTimeUpdateMode(DirectorUpdateMode.Manual);
            AnimationClipPlayable playable = default;
            if (clips[i])
            {
                var animator = root.GetComponent<Animator>();
                if (!animator)
                {
                    animator = root.AddComponent<Animator>();
                }
                animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
                playable = AnimationClipPlayable.Create(graph, clips[i]);
                var animationOutput = AnimationPlayableOutput.Create(graph, "Clip", animator);
                animationOutput.SetSourcePlayable(playable);
                playable.SetTime(0);
                graph.Play();
                graph.Evaluate(0);
            }

            // Unity caches GPU skinning within a frame, so capture poses on separate frames.
            yield return null;
            var start = Vertices(root);
            camera.transform.position = new Vector3(0, .4f, 3);
            camera.transform.LookAt(new Vector3(0, .4f, 0));
            var before = Capture(camera, Path.Combine(output, names[i] + "-start.png"));
            asset.frontPixels = Colored(before);

            if (clips[i])
            {
                // A looping clip wraps at its exact end time; sample just before that point.
                playable.SetTime(clips[i].length * .999);
                graph.Evaluate(0);
                yield return null;
                var end = Vertices(root);
                for (int vertex = 0; vertex < start.Length; vertex++)
                {
                    asset.maxVertexDisplacement = Math.Max(
                        asset.maxVertexDisplacement,
                        Vector3.Distance(start[vertex], end[vertex])
                    );
                }
                var after = Capture(camera, Path.Combine(output, names[i] + "-end.png"));
                asset.changedPixels = before.Where((pixel, index) =>
                    Math.Abs(pixel.r - after[index].r)
                    + Math.Abs(pixel.g - after[index].g)
                    + Math.Abs(pixel.b - after[index].b) > 30
                ).Count();
            }

            camera.transform.position = new Vector3(0, .4f, -3);
            camera.transform.LookAt(new Vector3(0, .4f, 0));
            asset.backPixels = Colored(Capture(camera, Path.Combine(output, names[i] + "-back.png")));
            graph.Destroy();
            root.SetActive(false);

            report.passed &= asset.unsupportedShaders == 0 && asset.frontPixels > 1000;
            if (names[i] == "skin")
            {
                report.passed &= asset.maxVertexDisplacement > .53f && asset.changedPixels > 100;
            }
            if (names[i] == "morph")
            {
                report.passed &= asset.maxVertexDisplacement > .59f && asset.changedPixels > 100;
            }
            if (names[i] == "double-sided")
            {
                report.passed &= asset.backPixels > 1000;
            }
            if (names[i] == "single-sided")
            {
                report.passed &= asset.backPixels == 0;
            }
        }

        File.WriteAllText(Path.Combine(output, "player.json"), JsonUtility.ToJson(report, true));
        Application.Quit(report.passed ? 0 : 1);
    }
}


