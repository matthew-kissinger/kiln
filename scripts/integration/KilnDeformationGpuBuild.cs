using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

public static class KilnDeformationGpuBuild
{
    public static void Run()
    {
        EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        var files = Directory.GetFiles("Assets/KilnImportFixtures", "*.glb")
            .OrderBy(path => path)
            .ToArray();
        var expected = new[] { "double-sided", "morph", "single-sided", "skin" };
        if (!files.Select(Path.GetFileNameWithoutExtension).SequenceEqual(expected))
        {
            throw new Exception("Requires exactly the four generated deformation fixtures");
        }

        var roots = files
            .Select(path => UnityEngine.Object.Instantiate(AssetDatabase.LoadAssetAtPath<GameObject>(path)))
            .ToArray();
        foreach (var root in roots)
        {
            foreach (var skin in root.GetComponentsInChildren<SkinnedMeshRenderer>())
            {
                skin.updateWhenOffscreen = true;
            }
        }

        var camera = new GameObject("Camera").AddComponent<Camera>();
        camera.tag = "MainCamera";
        camera.orthographic = true;
        camera.orthographicSize = 1.1f;
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = Color.black;

        var smoke = camera.gameObject.AddComponent<KilnDeformationGpuSmoke>();
        smoke.roots = roots;
        smoke.names = files.Select(Path.GetFileNameWithoutExtension).ToArray();
        smoke.clips = files
            .Select(path => AssetDatabase.LoadAllAssetsAtPath(path).OfType<AnimationClip>().FirstOrDefault())
            .ToArray();

        var light = new GameObject("Light").AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1;
        light.transform.rotation = Quaternion.Euler(20, 160, 0);
        RenderSettings.ambientLight = new Color(.4f, .4f, .4f);

        EditorSceneManager.SaveScene(
            EditorSceneManager.GetActiveScene(),
            "Assets/KilnDeformationGpuSmoke.unity"
        );
        var args = Environment.GetCommandLineArgs();
        var output = args[Array.IndexOf(args, "-playerOutput") + 1];
        var result = BuildPipeline.BuildPlayer(new BuildPlayerOptions
        {
            scenes = new[] { "Assets/KilnDeformationGpuSmoke.unity" },
            locationPathName = output,
            target = BuildTarget.StandaloneWindows64,
            options = BuildOptions.Development
        });
        if (result.summary.result != BuildResult.Succeeded)
        {
            throw new Exception("Build failed");
        }
    }
}
