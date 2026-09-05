# Tool reference

Generated from the public registry with `bun run docs:tools`. Change the registry to update names, descriptions or schemas; use `bun run docs:tools --check` to check for drift.

Use these tools through your connected agent. Supply `code` once, then pass the returned `programRef` to later calls. References identify exact source revisions. [Source workflow](programs.md) · [Camera recipes](cameras.md) · [Geometry guide](geometry.md).

Call `kiln_list_primitives({capabilities:true})` for the current host limits and export/camera support. The schema below describes inputs; actual image replies include fidelity and capture metadata. Source reads return exact text, edits return a new revision, and failed builds return their errors.

## kiln_list_primitives

Discover Kiln helpers and capabilities. No arguments returns a compact overview. Use names for up to six exact signatures/examples together, name for one, query for a modeling operation, or category to browse; detailed results are paged. Custom THREE.BufferGeometry and ordinary functions are available inside the retained program.

<details>
<summary>Input JSON Schema</summary>


```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "names": {
      "description": "Get up to six exact helper signatures together, in this order. Use without other selectors.",
      "minItems": 1,
      "maxItems": 6,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 80
      }
    },
    "category": {
      "description": "Category from the overview.",
      "type": "string",
      "minLength": 1,
      "maxLength": 80
    },
    "name": {
      "description": "Exact helper name; returns its signature and example.",
      "type": "string",
      "minLength": 1,
      "maxLength": 80
    },
    "query": {
      "description": "Words to find in helper names, descriptions and examples.",
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "overview": {
      "description": "Compact names by category. Default when no search or category is supplied.",
      "type": "boolean"
    },
    "capabilities": {
      "description": "Return only runtime, source, geometry export and camera capabilities.",
      "type": "boolean"
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 10000
    },
    "limit": {
      "description": "Detailed results per page; default 6, maximum 12.",
      "type": "integer",
      "minimum": 1,
      "maximum": 12
    }
  },
  "additionalProperties": false
}
```

</details>

## kiln_validate

Check program syntax and sandbox rules before building. Returns validation findings; use kiln_render to evaluate geometry and see the asset. Supply code once or reuse programRef from an earlier result. Returns programRef even for an invalid draft. kiln_source reads that revision.

<details>
<summary>Input JSON Schema</summary>


```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "description": "Inline source, for a new draft or legacy caller. Supply code OR programRef.",
      "type": "string"
    },
    "programRef": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Full immutable source revision returned by Kiln."
    }
  },
  "additionalProperties": false
}
```

</details>

## kiln_render

Build a program and return geometry metrics, exact part paths and images. Omit capture for six views; choose preset/cells for orbit grids or version kiln.capture.v1 plus shots for part-local framing, perspective and separate images. Check viewFidelity before judging materials. Failed builds return errors without an image. Supply code once or reuse programRef from an earlier result. Returns programRef even for an invalid draft. kiln_source reads that revision.

<details>
<summary>Input JSON Schema</summary>


```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "description": "Inline source, for a new draft or legacy caller. Supply code OR programRef.",
      "type": "string"
    },
    "capture": {
      "description": "Use legacy preset/cells for an orbit sheet, or version kiln.capture.v1 with 1..9 shots for exact part framing, local axes, perspective and separate images. Omit for six default views.",
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "version": {
              "type": "string",
              "const": "kiln.capture.v1"
            },
            "shots": {
              "minItems": 1,
              "maxItems": 9,
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "subject": {
                    "type": "object",
                    "properties": {
                      "path": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string"
                      }
                    },
                    "additionalProperties": false
                  },
                  "visibility": {
                    "type": "string",
                    "enum": [
                      "context",
                      "isolate"
                    ]
                  },
                  "camera": {
                    "oneOf": [
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "const": "orbit"
                          },
                          "azimuthDeg": {
                            "type": "number"
                          },
                          "elevationDeg": {
                            "type": "number"
                          },
                          "relativeTo": {
                            "type": "string",
                            "enum": [
                              "world",
                              "asset",
                              "part"
                            ]
                          },
                          "padding": {
                            "type": "number",
                            "exclusiveMinimum": 0,
                            "maximum": 100
                          }
                        },
                        "required": [
                          "type"
                        ],
                        "additionalProperties": false
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "const": "explicit"
                          },
                          "projection": {
                            "type": "string",
                            "enum": [
                              "orthographic",
                              "perspective"
                            ]
                          },
                          "position": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "target": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "relativeTo": {
                            "type": "string",
                            "enum": [
                              "world",
                              "asset",
                              "part",
                              "local"
                            ]
                          },
                          "frame": {
                            "type": "object",
                            "properties": {
                              "origin": {
                                "type": "array",
                                "prefixItems": [
                                  {
                                    "type": "number"
                                  },
                                  {
                                    "type": "number"
                                  },
                                  {
                                    "type": "number"
                                  }
                                ]
                              },
                              "rotation": {
                                "type": "array",
                                "prefixItems": [
                                  {
                                    "type": "number"
                                  },
                                  {
                                    "type": "number"
                                  },
                                  {
                                    "type": "number"
                                  }
                                ]
                              }
                            },
                            "additionalProperties": false
                          },
                          "framing": {
                            "type": "string",
                            "enum": [
                              "explicit",
                              "bounds"
                            ]
                          },
                          "padding": {
                            "type": "number",
                            "exclusiveMinimum": 0,
                            "maximum": 100
                          },
                          "targetOffset": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "up": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "halfHeight": {
                            "type": "number",
                            "exclusiveMinimum": 0
                          },
                          "fovDeg": {
                            "type": "number",
                            "exclusiveMinimum": 0,
                            "exclusiveMaximum": 180
                          },
                          "near": {
                            "type": "number",
                            "exclusiveMinimum": 0
                          },
                          "far": {
                            "type": "number",
                            "exclusiveMinimum": 0
                          }
                        },
                        "required": [
                          "type",
                          "projection",
                          "position"
                        ],
                        "additionalProperties": false
                      }
                    ]
                  }
                },
                "additionalProperties": false
              }
            },
            "cols": {
              "type": "integer",
              "minimum": 1,
              "maximum": 3
            },
            "size": {
              "type": "integer",
              "minimum": 128,
              "maximum": 1024
            },
            "output": {
              "type": "string",
              "enum": [
                "grid",
                "separate"
              ]
            }
          },
          "required": [
            "version",
            "shots"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "preset": {
              "description": "Grid shape as COLSxROWS. Default 3x2. Choose fewer views for simple shapes, up to 3x3 for more angles.",
              "type": "string",
              "enum": [
                "1x1",
                "1x2",
                "2x1",
                "3x1",
                "2x2",
                "3x2",
                "3x3"
              ]
            },
            "cells": {
              "description": "One camera per cell, in row-major order. Omit to use the preset default cameras. Must not exceed the preset capacity (max 9 overall).",
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "azimuthDeg": {
                    "type": "number",
                    "description": "0 = front, 90 = right, 180 = back, 270 = left. Wraps."
                  },
                  "elevationDeg": {
                    "type": "number",
                    "description": "0 = eye level, positive looks down, negative from below. Clamped to -89..89."
                  },
                  "zoom": {
                    "description": "Padding multiplier around the asset bounds for this cell only. Omit for the default framing; below 1 crops in, above 1 pulls back.",
                    "type": "number"
                  },
                  "name": {
                    "description": "Cell label. Auto-derived from the angles if omitted.",
                    "type": "string"
                  }
                },
                "required": [
                  "azimuthDeg",
                  "elevationDeg"
                ],
                "additionalProperties": false
              }
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "programRef": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Full immutable source revision returned by Kiln."
    }
  },
  "additionalProperties": false
}
```

</details>

## kiln_screenshot_animation

Render sampled animation frames to check motion and attachments. Use shot for the shared camera controls, frameTimes for selected phases, and framing locked (default) or follow. The program must define animate(). Check viewFidelity before judging materials. Supply code once or reuse programRef from an earlier result. Returns programRef even for an invalid draft. kiln_source reads that revision.

<details>
<summary>Input JSON Schema</summary>


```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "shot": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "subject": {
          "type": "object",
          "properties": {
            "path": {
              "type": "string"
            },
            "name": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "visibility": {
          "type": "string",
          "enum": [
            "context",
            "isolate"
          ]
        },
        "camera": {
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "const": "orbit"
                },
                "azimuthDeg": {
                  "type": "number"
                },
                "elevationDeg": {
                  "type": "number"
                },
                "relativeTo": {
                  "type": "string",
                  "enum": [
                    "world",
                    "asset",
                    "part"
                  ]
                },
                "padding": {
                  "type": "number",
                  "exclusiveMinimum": 0,
                  "maximum": 100
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "const": "explicit"
                },
                "projection": {
                  "type": "string",
                  "enum": [
                    "orthographic",
                    "perspective"
                  ]
                },
                "position": {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    }
                  ]
                },
                "target": {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    }
                  ]
                },
                "relativeTo": {
                  "type": "string",
                  "enum": [
                    "world",
                    "asset",
                    "part",
                    "local"
                  ]
                },
                "frame": {
                  "type": "object",
                  "properties": {
                    "origin": {
                      "type": "array",
                      "prefixItems": [
                        {
                          "type": "number"
                        },
                        {
                          "type": "number"
                        },
                        {
                          "type": "number"
                        }
                      ]
                    },
                    "rotation": {
                      "type": "array",
                      "prefixItems": [
                        {
                          "type": "number"
                        },
                        {
                          "type": "number"
                        },
                        {
                          "type": "number"
                        }
                      ]
                    }
                  },
                  "additionalProperties": false
                },
                "framing": {
                  "type": "string",
                  "enum": [
                    "explicit",
                    "bounds"
                  ]
                },
                "padding": {
                  "type": "number",
                  "exclusiveMinimum": 0,
                  "maximum": 100
                },
                "targetOffset": {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    }
                  ]
                },
                "up": {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    }
                  ]
                },
                "halfHeight": {
                  "type": "number",
                  "exclusiveMinimum": 0
                },
                "fovDeg": {
                  "type": "number",
                  "exclusiveMinimum": 0,
                  "exclusiveMaximum": 180
                },
                "near": {
                  "type": "number",
                  "exclusiveMinimum": 0
                },
                "far": {
                  "type": "number",
                  "exclusiveMinimum": 0
                }
              },
              "required": [
                "type",
                "projection",
                "position"
              ],
              "additionalProperties": false
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "frames": {
      "type": "integer",
      "minimum": 2,
      "maximum": 6
    },
    "frameTimes": {
      "description": "Ordered phase fractions 0..1; mutually exclusive with frames.",
      "minItems": 1,
      "maxItems": 9,
      "type": "array",
      "items": {
        "type": "number",
        "minimum": 0,
        "maximum": 1
      }
    },
    "framing": {
      "type": "string",
      "enum": [
        "locked",
        "follow"
      ]
    },
    "code": {
      "description": "Inline source, for a new draft or legacy caller. Supply code OR programRef.",
      "type": "string"
    },
    "clip": {
      "type": "string",
      "description": "The animation clip to view, by name (e.g. \"walk\", \"attack\"). Must be one your animate() returns."
    },
    "camera": {
      "description": "Camera angle: right (default — side profile, best for leg swing + knee bend direction), front (reveals sideways/lateral motion), back, left, top, or three-quarter.",
      "type": "string"
    },
    "perFrame": {
      "description": "Return the frames as separate high-res images instead of one composite grid. Default false.",
      "type": "boolean"
    },
    "programRef": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Full immutable source revision returned by Kiln."
    }
  },
  "required": [
    "clip"
  ],
  "additionalProperties": false
}
```

</details>

## kiln_view_interior

Render roof-off floor-plan, dollhouse, and eye-level cutaway views. Optional versioned capture selects custom roof-off shots. Select a roof by nodeName or let Kiln resolve its role/name. Review roofsHidden and warnings for unresolved occlusion. Supply code once or reuse programRef from an earlier result. Returns programRef even for an invalid draft. kiln_source reads that revision.

<details>
<summary>Input JSON Schema</summary>


```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "capture": {
      "type": "object",
      "properties": {
        "version": {
          "type": "string",
          "const": "kiln.capture.v1"
        },
        "shots": {
          "minItems": 1,
          "maxItems": 9,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "subject": {
                "type": "object",
                "properties": {
                  "path": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              },
              "visibility": {
                "type": "string",
                "enum": [
                  "context",
                  "isolate"
                ]
              },
              "camera": {
                "oneOf": [
                  {
                    "type": "object",
                    "properties": {
                      "type": {
                        "type": "string",
                        "const": "orbit"
                      },
                      "azimuthDeg": {
                        "type": "number"
                      },
                      "elevationDeg": {
                        "type": "number"
                      },
                      "relativeTo": {
                        "type": "string",
                        "enum": [
                          "world",
                          "asset",
                          "part"
                        ]
                      },
                      "padding": {
                        "type": "number",
                        "exclusiveMinimum": 0,
                        "maximum": 100
                      }
                    },
                    "required": [
                      "type"
                    ],
                    "additionalProperties": false
                  },
                  {
                    "type": "object",
                    "properties": {
                      "type": {
                        "type": "string",
                        "const": "explicit"
                      },
                      "projection": {
                        "type": "string",
                        "enum": [
                          "orthographic",
                          "perspective"
                        ]
                      },
                      "position": {
                        "type": "array",
                        "prefixItems": [
                          {
                            "type": "number"
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "number"
                          }
                        ]
                      },
                      "target": {
                        "type": "array",
                        "prefixItems": [
                          {
                            "type": "number"
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "number"
                          }
                        ]
                      },
                      "relativeTo": {
                        "type": "string",
                        "enum": [
                          "world",
                          "asset",
                          "part",
                          "local"
                        ]
                      },
                      "frame": {
                        "type": "object",
                        "properties": {
                          "origin": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "rotation": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          }
                        },
                        "additionalProperties": false
                      },
                      "framing": {
                        "type": "string",
                        "enum": [
                          "explicit",
                          "bounds"
                        ]
                      },
                      "padding": {
                        "type": "number",
                        "exclusiveMinimum": 0,
                        "maximum": 100
                      },
                      "targetOffset": {
                        "type": "array",
                        "prefixItems": [
                          {
                            "type": "number"
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "number"
                          }
                        ]
                      },
                      "up": {
                        "type": "array",
                        "prefixItems": [
                          {
                            "type": "number"
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "number"
                          }
                        ]
                      },
                      "halfHeight": {
                        "type": "number",
                        "exclusiveMinimum": 0
                      },
                      "fovDeg": {
                        "type": "number",
                        "exclusiveMinimum": 0,
                        "exclusiveMaximum": 180
                      },
                      "near": {
                        "type": "number",
                        "exclusiveMinimum": 0
                      },
                      "far": {
                        "type": "number",
                        "exclusiveMinimum": 0
                      }
                    },
                    "required": [
                      "type",
                      "projection",
                      "position"
                    ],
                    "additionalProperties": false
                  }
                ]
              }
            },
            "additionalProperties": false
          }
        },
        "cols": {
          "type": "integer",
          "minimum": 1,
          "maximum": 3
        },
        "size": {
          "type": "integer",
          "minimum": 128,
          "maximum": 1024
        },
        "output": {
          "type": "string",
          "enum": [
            "grid",
            "separate"
          ]
        }
      },
      "required": [
        "version",
        "shots"
      ],
      "additionalProperties": false
    },
    "code": {
      "description": "Inline source, for a new draft or legacy caller. Supply code OR programRef.",
      "type": "string"
    },
    "nodeName": {
      "description": "Override: lift the roof by exact node name instead of by role. Matches that node and its children. Normally OMIT it — Kiln finds the roof from its semantic role (anything built with createRoofPlanes/createGableRoof), falling back to historical \"Roof\" naming.",
      "type": "string"
    },
    "programRef": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Full immutable source revision returned by Kiln."
    }
  },
  "additionalProperties": false
}
```

</details>

## kiln_inspect

Inspect a part with context or isolation. Use legacy part/orbit controls or shot for exact paths, part-local axes and perspective. Use names from the source or render result; check viewFidelity before judging materials. Supply code once or reuse programRef from an earlier result. Returns programRef even for an invalid draft. kiln_source reads that revision.

<details>
<summary>Input JSON Schema</summary>


```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "measure": {
      "description": "Straight-line distance between exact named node origins or subject-local points; asset units, not surface clearance.",
      "type": "object",
      "properties": {
        "from": {
          "type": "object",
          "properties": {
            "subject": {
              "type": "object",
              "properties": {
                "path": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            },
            "point": {
              "type": "array",
              "prefixItems": [
                {
                  "type": "number"
                },
                {
                  "type": "number"
                },
                {
                  "type": "number"
                }
              ]
            }
          },
          "required": [
            "subject"
          ],
          "additionalProperties": false
        },
        "to": {
          "type": "object",
          "properties": {
            "subject": {
              "type": "object",
              "properties": {
                "path": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            },
            "point": {
              "type": "array",
              "prefixItems": [
                {
                  "type": "number"
                },
                {
                  "type": "number"
                },
                {
                  "type": "number"
                }
              ]
            }
          },
          "required": [
            "subject"
          ],
          "additionalProperties": false
        }
      },
      "required": [
        "from",
        "to"
      ],
      "additionalProperties": false
    },
    "shot": {
      "description": "Exact framed shot; omit legacy part/view/orbit fields when using this.",
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "subject": {
          "type": "object",
          "properties": {
            "path": {
              "type": "string"
            },
            "name": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "visibility": {
          "type": "string",
          "enum": [
            "context",
            "isolate"
          ]
        },
        "camera": {
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "const": "orbit"
                },
                "azimuthDeg": {
                  "type": "number"
                },
                "elevationDeg": {
                  "type": "number"
                },
                "relativeTo": {
                  "type": "string",
                  "enum": [
                    "world",
                    "asset",
                    "part"
                  ]
                },
                "padding": {
                  "type": "number",
                  "exclusiveMinimum": 0,
                  "maximum": 100
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "const": "explicit"
                },
                "projection": {
                  "type": "string",
                  "enum": [
                    "orthographic",
                    "perspective"
                  ]
                },
                "position": {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    }
                  ]
                },
                "target": {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    }
                  ]
                },
                "relativeTo": {
                  "type": "string",
                  "enum": [
                    "world",
                    "asset",
                    "part",
                    "local"
                  ]
                },
                "frame": {
                  "type": "object",
                  "properties": {
                    "origin": {
                      "type": "array",
                      "prefixItems": [
                        {
                          "type": "number"
                        },
                        {
                          "type": "number"
                        },
                        {
                          "type": "number"
                        }
                      ]
                    },
                    "rotation": {
                      "type": "array",
                      "prefixItems": [
                        {
                          "type": "number"
                        },
                        {
                          "type": "number"
                        },
                        {
                          "type": "number"
                        }
                      ]
                    }
                  },
                  "additionalProperties": false
                },
                "framing": {
                  "type": "string",
                  "enum": [
                    "explicit",
                    "bounds"
                  ]
                },
                "padding": {
                  "type": "number",
                  "exclusiveMinimum": 0,
                  "maximum": 100
                },
                "targetOffset": {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    }
                  ]
                },
                "up": {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "number"
                    }
                  ]
                },
                "halfHeight": {
                  "type": "number",
                  "exclusiveMinimum": 0
                },
                "fovDeg": {
                  "type": "number",
                  "exclusiveMinimum": 0,
                  "exclusiveMaximum": 180
                },
                "near": {
                  "type": "number",
                  "exclusiveMinimum": 0
                },
                "far": {
                  "type": "number",
                  "exclusiveMinimum": 0
                }
              },
              "required": [
                "type",
                "projection",
                "position"
              ],
              "additionalProperties": false
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "code": {
      "description": "Inline source, for a new draft or legacy caller. Supply code OR programRef.",
      "type": "string"
    },
    "part": {
      "description": "The part to frame, by node name from your program (case-insensitive; substring match as a fallback). Omit to frame the whole asset.",
      "type": "string"
    },
    "view": {
      "description": "Camera angle: front, right, back, left, top, or three-quarter (default). Ignored when azimuthDeg or elevationDeg is given.",
      "type": "string"
    },
    "azimuthDeg": {
      "description": "Orbit the camera around the asset: 0 = front, 90 = right, 180 = back, 270 = left. Wraps, so 315 and -45 are the same. Use it to look between the named views — at a corner, a seam, or whatever angle the last render left ambiguous.",
      "type": "number"
    },
    "elevationDeg": {
      "description": "Orbit the camera up or down: 0 = eye level, positive looks down from above, negative from below. Clamped to -89..89. Combine with azimuthDeg for any three-quarter angle you want.",
      "type": "number"
    },
    "zoom": {
      "description": "Padding multiplier around the part bounds, clamped to 1-4. Default 1.2; raise it to see more surrounding context.",
      "type": "number"
    },
    "isolate": {
      "description": "Hide everything except the named part (and its descendants) so nothing can block the view. Use it when the part is buried inside or behind other geometry. Needs `part`; without one it does nothing. Default false — surrounding geometry stays visible for context.",
      "type": "boolean"
    },
    "programRef": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Full immutable source revision returned by Kiln."
    }
  },
  "additionalProperties": false
}
```

</details>

## kiln_edit

Apply exact-string replacements to a program revision and render the result (render:false skips images). Edits are ordered and atomic: missing or ambiguous matches fail without changing the base. Returns a new programRef, parentRef and diff; untouched text stays identical. Read anchors with kiln_source. Optional capture chooses the same cameras as kiln_render. Use includeCode only when full source is needed.

<details>
<summary>Input JSON Schema</summary>


```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "description": "Inline source, for a new draft or legacy caller. Supply code OR programRef.",
      "type": "string"
    },
    "edits": {
      "minItems": 1,
      "maxItems": 20,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "oldString": {
            "type": "string",
            "description": "The exact text to replace, copied verbatim from the program (including whitespace and indentation, and with no line-number prefixes). Must be unique unless replaceAll is true."
          },
          "newString": {
            "type": "string",
            "description": "The replacement text. Use an empty string to delete."
          },
          "replaceAll": {
            "description": "Replace every occurrence instead of failing when oldString matches more than once.",
            "type": "boolean"
          }
        },
        "required": [
          "oldString",
          "newString"
        ],
        "additionalProperties": false
      },
      "description": "Edits applied in order against the program. If any one fails to match, none are applied and the reply says which. Batch related changes into a single call."
    },
    "render": {
      "description": "Render the patched program and return the views (default true). false = patch only.",
      "type": "boolean"
    },
    "capture": {
      "description": "Use legacy preset/cells for an orbit sheet, or version kiln.capture.v1 with 1..9 shots for exact part framing, local axes, perspective and separate images. Omit for six default views.",
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "version": {
              "type": "string",
              "const": "kiln.capture.v1"
            },
            "shots": {
              "minItems": 1,
              "maxItems": 9,
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "subject": {
                    "type": "object",
                    "properties": {
                      "path": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string"
                      }
                    },
                    "additionalProperties": false
                  },
                  "visibility": {
                    "type": "string",
                    "enum": [
                      "context",
                      "isolate"
                    ]
                  },
                  "camera": {
                    "oneOf": [
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "const": "orbit"
                          },
                          "azimuthDeg": {
                            "type": "number"
                          },
                          "elevationDeg": {
                            "type": "number"
                          },
                          "relativeTo": {
                            "type": "string",
                            "enum": [
                              "world",
                              "asset",
                              "part"
                            ]
                          },
                          "padding": {
                            "type": "number",
                            "exclusiveMinimum": 0,
                            "maximum": 100
                          }
                        },
                        "required": [
                          "type"
                        ],
                        "additionalProperties": false
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "const": "explicit"
                          },
                          "projection": {
                            "type": "string",
                            "enum": [
                              "orthographic",
                              "perspective"
                            ]
                          },
                          "position": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "target": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "relativeTo": {
                            "type": "string",
                            "enum": [
                              "world",
                              "asset",
                              "part",
                              "local"
                            ]
                          },
                          "frame": {
                            "type": "object",
                            "properties": {
                              "origin": {
                                "type": "array",
                                "prefixItems": [
                                  {
                                    "type": "number"
                                  },
                                  {
                                    "type": "number"
                                  },
                                  {
                                    "type": "number"
                                  }
                                ]
                              },
                              "rotation": {
                                "type": "array",
                                "prefixItems": [
                                  {
                                    "type": "number"
                                  },
                                  {
                                    "type": "number"
                                  },
                                  {
                                    "type": "number"
                                  }
                                ]
                              }
                            },
                            "additionalProperties": false
                          },
                          "framing": {
                            "type": "string",
                            "enum": [
                              "explicit",
                              "bounds"
                            ]
                          },
                          "padding": {
                            "type": "number",
                            "exclusiveMinimum": 0,
                            "maximum": 100
                          },
                          "targetOffset": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "up": {
                            "type": "array",
                            "prefixItems": [
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "number"
                              }
                            ]
                          },
                          "halfHeight": {
                            "type": "number",
                            "exclusiveMinimum": 0
                          },
                          "fovDeg": {
                            "type": "number",
                            "exclusiveMinimum": 0,
                            "exclusiveMaximum": 180
                          },
                          "near": {
                            "type": "number",
                            "exclusiveMinimum": 0
                          },
                          "far": {
                            "type": "number",
                            "exclusiveMinimum": 0
                          }
                        },
                        "required": [
                          "type",
                          "projection",
                          "position"
                        ],
                        "additionalProperties": false
                      }
                    ]
                  }
                },
                "additionalProperties": false
              }
            },
            "cols": {
              "type": "integer",
              "minimum": 1,
              "maximum": 3
            },
            "size": {
              "type": "integer",
              "minimum": 128,
              "maximum": 1024
            },
            "output": {
              "type": "string",
              "enum": [
                "grid",
                "separate"
              ]
            }
          },
          "required": [
            "version",
            "shots"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "preset": {
              "description": "Grid shape as COLSxROWS. Default 3x2. Choose fewer views for simple shapes, up to 3x3 for more angles.",
              "type": "string",
              "enum": [
                "1x1",
                "1x2",
                "2x1",
                "3x1",
                "2x2",
                "3x2",
                "3x3"
              ]
            },
            "cells": {
              "description": "One camera per cell, in row-major order. Omit to use the preset default cameras. Must not exceed the preset capacity (max 9 overall).",
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "azimuthDeg": {
                    "type": "number",
                    "description": "0 = front, 90 = right, 180 = back, 270 = left. Wraps."
                  },
                  "elevationDeg": {
                    "type": "number",
                    "description": "0 = eye level, positive looks down, negative from below. Clamped to -89..89."
                  },
                  "zoom": {
                    "description": "Padding multiplier around the asset bounds for this cell only. Omit for the default framing; below 1 crops in, above 1 pulls back.",
                    "type": "number"
                  },
                  "name": {
                    "description": "Cell label. Auto-derived from the angles if omitted.",
                    "type": "string"
                  }
                },
                "required": [
                  "azimuthDeg",
                  "elevationDeg"
                ],
                "additionalProperties": false
              }
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "programRef": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Full immutable source revision returned by Kiln."
    },
    "includeCode": {
      "description": "Return the full updated source. Defaults to false with programRef, true with code.",
      "type": "boolean"
    }
  },
  "required": [
    "edits"
  ],
  "additionalProperties": false
}
```

</details>

## kiln_source

Read a saved program revision without changing it. Returns exact source text in bounded pages, or searches for literal text with surrounding context. Copy edit anchors from code. Follow nextOffset for more; use matchOffset + 1 to find the next match. Offsets count UTF-16 characters, not bytes.

<details>
<summary>Input JSON Schema</summary>


```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "programRef": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Full immutable source revision returned by Kiln."
    },
    "offset": {
      "default": 0,
      "description": "UTF-16 character offset; use nextOffset to continue.",
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "limit": {
      "default": 8000,
      "description": "Maximum characters returned.",
      "type": "integer",
      "minimum": 1,
      "maximum": 16000
    },
    "query": {
      "description": "Find literal text at or after offset; return bounded surrounding source.",
      "type": "string",
      "minLength": 1,
      "maxLength": 1000
    }
  },
  "required": [
    "programRef",
    "offset",
    "limit"
  ],
  "additionalProperties": false
}
```

</details>
