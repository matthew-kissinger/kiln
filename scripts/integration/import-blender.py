"""Headless structural inspection only; does not render or modify source assets."""
import bpy
import json
import os
import sys
import glob

input_dir, output = sys.argv[sys.argv.index('--') + 1:]
report = {'engine': 'blender', 'version': bpy.app.version_string, 'files': []}
def deformed_vertices(obj):
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    try:
        return [v.co.copy() for v in mesh.vertices]
    finally:
        evaluated.to_mesh_clear()

for path in sorted(glob.glob(os.path.join(input_dir, '*.glb'))):
    record = {'file': os.path.basename(path), 'nodes': [], 'materials': [], 'animations': []}
    report['files'].append(record)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
        bpy.context.view_layer.update()
        for obj in bpy.context.scene.objects:
            mesh = obj.data if obj.type == 'MESH' else None
            record['nodes'].append({
                'name': obj.name, 'parent': obj.parent.name if obj.parent else None,
                'localPosition': list(obj.location), 'worldPosition': list(obj.matrix_world.translation),
                'vertices': len(mesh.vertices) if mesh else 0,
                'uvSets': len(mesh.uv_layers) if mesh else 0,
                'colors': len(mesh.color_attributes) if mesh else 0,
                'morphTargets': len(mesh.shape_keys.key_blocks) - 1 if mesh and mesh.shape_keys else 0,
                'bones': len(obj.data.bones) if obj.type == 'ARMATURE' else 0,
                'armatureModifiers': sum(m.type == 'ARMATURE' for m in obj.modifiers),
            })
            factors = []
            for slot in obj.material_slots:
                mat = slot.material
                bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if mat and mat.use_nodes else None
                factors.append((bsdf.inputs['Metallic'].default_value, bsdf.inputs['Roughness'].default_value) if bsdf else (-1, -1))
            record['nodes'][-1].update(materialMetallicFactors=[f[0] for f in factors], materialRoughnessFactors=[f[1] for f in factors])
        for mat in bpy.data.materials:
            bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if mat.use_nodes else None
            material = {'name': mat.name, 'doubleSided': not mat.use_backface_culling}
            if bsdf:
                material.update(metallic=bsdf.inputs['Metallic'].default_value, roughness=bsdf.inputs['Roughness'].default_value)
            material['textures'] = sorted(n.image.name for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image) if mat.use_nodes else []
            record['materials'].append(material)
        record['animations'] = sorted(a.name for a in bpy.data.actions)
        bpy.context.scene.frame_set(0)
        initial = {o.name: o.matrix_basis.copy() for o in bpy.context.scene.objects}
        mesh_objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
        initial_vertices = {o.name: deformed_vertices(o) for o in mesh_objects}
        displacements = {o.name: 0.0 for o in mesh_objects}
        moving = set()
        for action in bpy.data.actions:
            for frame in [int(action.frame_range[1] / 2), int(action.frame_range[1])]:
                bpy.context.scene.frame_set(frame)
                for obj in bpy.context.scene.objects:
                    if max(abs(obj.matrix_basis[r][c] - initial[obj.name][r][c]) for r in range(4) for c in range(4)) > 1e-5:
                        moving.add(obj.name)
                for obj in mesh_objects:
                    current = deformed_vertices(obj)
                    original = initial_vertices[obj.name]
                    if len(current) != len(original):
                        raise ValueError('Animation changed vertex count: ' + obj.name)
                    displacements[obj.name] = max(displacements[obj.name], max(((a - b).length for a, b in zip(current, original)), default=0))
        for node in record['nodes']:
            node['maxVertexDisplacement'] = displacements.get(node['name'], 0)
            node['deformed'] = node['maxVertexDisplacement'] > 1e-5
        record['animatedNodes'] = sorted(moving)
        record['animatedNodeCount'] = len(moving)
    except Exception as error:
        record['error'] = str(error)
with open(output, 'w', encoding='utf-8') as stream:
    json.dump(report, stream, indent=2)
