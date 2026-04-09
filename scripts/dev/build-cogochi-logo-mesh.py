#!/usr/bin/env python3
"""Build a GLB mesh from a transparent logo silhouette.

This turns a 2D alpha mask into a lightly beveled 3D solid using marching cubes
and writes a minimal glTF binary (GLB) that can be used by model-viewer.
"""

from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from skimage import measure, transform


def load_mask(image_path: Path, target_size: int, pad: int) -> np.ndarray:
    image = Image.open(image_path).convert("RGBA")
    alpha = np.asarray(image.getchannel("A"), dtype=np.float32) / 255.0

    ys, xs = np.nonzero(alpha > 0.02)
    if len(xs) == 0 or len(ys) == 0:
        raise SystemExit(f"No alpha content found in {image_path}")

    x0 = max(0, int(xs.min()) - pad)
    y0 = max(0, int(ys.min()) - pad)
    x1 = min(alpha.shape[1], int(xs.max()) + pad + 1)
    y1 = min(alpha.shape[0], int(ys.max()) + pad + 1)
    cropped = alpha[y0:y1, x0:x1]

    resized = transform.resize(
        cropped,
        (target_size, target_size),
        order=1,
        mode="constant",
        anti_aliasing=True,
        preserve_range=True,
    ).astype(np.float32)

    return np.clip(resized, 0.0, 1.0)


def marching_solid(mask: np.ndarray, depth: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    volume = np.repeat(mask[None, :, :], depth, axis=0)
    volume = gaussian_filter(volume, sigma=(1.0, 0.85, 0.85))

    verts, faces, _normals, _values = measure.marching_cubes(volume, level=0.5, allow_degenerate=False)

    # marching_cubes returns vertices as z, y, x. Convert to x, y, z and flip y so the
    # symbol keeps the same visual orientation as the reference.
    verts = verts[:, [2, 1, 0]].astype(np.float32)
    verts[:, 1] = -verts[:, 1]

    mins = verts.min(axis=0)
    maxs = verts.max(axis=0)
    center = (mins + maxs) * 0.5
    span = max(maxs[0] - mins[0], maxs[1] - mins[1], 1e-6)

    verts = verts - center
    verts[:, 0] /= span
    verts[:, 1] /= span
    verts[:, 2] /= span
    verts[:, 2] *= 0.28

    normals = np.zeros_like(verts, dtype=np.float32)
    tri = verts[faces]
    face_normals = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    lengths = np.linalg.norm(face_normals, axis=1, keepdims=True)
    face_normals = np.divide(face_normals, np.maximum(lengths, 1e-8), out=np.zeros_like(face_normals), where=lengths > 0)

    np.add.at(normals, faces[:, 0], face_normals)
    np.add.at(normals, faces[:, 1], face_normals)
    np.add.at(normals, faces[:, 2], face_normals)

    normal_lengths = np.linalg.norm(normals, axis=1, keepdims=True)
    normals = np.divide(normals, np.maximum(normal_lengths, 1e-8), out=np.zeros_like(normals), where=normal_lengths > 0)

    return verts.astype(np.float32), normals.astype(np.float32), faces.astype(np.uint32)


def pad4(data: bytes) -> bytes:
    pad = (-len(data)) % 4
    if pad:
        data += b"\x20" * pad
    return data


def align4(length: int) -> int:
    return (length + 3) & ~3


def write_glb(output_path: Path, positions: np.ndarray, normals: np.ndarray, indices: np.ndarray) -> None:
    pos_bytes = positions.astype(np.float32).tobytes()
    norm_bytes = normals.astype(np.float32).tobytes()
    idx_bytes = indices.astype(np.uint32).tobytes()

    offset0 = 0
    offset1 = align4(offset0 + len(pos_bytes))
    offset2 = align4(offset1 + len(norm_bytes))
    total_length = align4(offset2 + len(idx_bytes))

    buffer = bytearray(total_length)
    buffer[offset0:offset0 + len(pos_bytes)] = pos_bytes
    buffer[offset1:offset1 + len(norm_bytes)] = norm_bytes
    buffer[offset2:offset2 + len(idx_bytes)] = idx_bytes

    mins = positions.min(axis=0).tolist()
    maxs = positions.max(axis=0).tolist()

    gltf = {
        "asset": {"version": "2.0", "generator": "cogochi-logo-mesh-builder"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "LogoMesh"}],
        "meshes": [
            {
                "name": "LogoMesh",
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "NORMAL": 1},
                        "indices": 2,
                        "material": 0,
                        "mode": 4,
                    }
                ],
            }
        ],
        "materials": [
            {
                "name": "ChromeLogo",
                "doubleSided": True,
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.82, 0.86, 0.9, 1.0],
                    "metallicFactor": 1.0,
                    "roughnessFactor": 0.18,
                },
                "emissiveFactor": [0.01, 0.01, 0.015],
            }
        ],
        "buffers": [{"byteLength": len(buffer)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": offset0, "byteLength": len(pos_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": offset1, "byteLength": len(norm_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": offset2, "byteLength": len(idx_bytes), "target": 34963},
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": int(positions.shape[0]),
                "type": "VEC3",
                "min": mins,
                "max": maxs,
            },
            {
                "bufferView": 1,
                "componentType": 5126,
                "count": int(normals.shape[0]),
                "type": "VEC3",
            },
            {
                "bufferView": 2,
                "componentType": 5125,
                "count": int(indices.size),
                "type": "SCALAR",
            },
        ],
    }

    json_bytes = pad4(json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
    bin_bytes = pad4(bytes(buffer))

    header = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(json_bytes) + 8 + len(bin_bytes))
    json_chunk = struct.pack("<I4s", len(json_bytes), b"JSON") + json_bytes
    bin_chunk = struct.pack("<I4s", len(bin_bytes), b"BIN\x00") + bin_bytes

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(header + json_chunk + bin_chunk)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        default="/Users/ej/Downloads/ChatGPT Image Apr 9, 2026, 08_45_55 PM.png",
        type=Path,
        help="Transparent silhouette PNG to trace.",
    )
    parser.add_argument(
        "--output",
        default="/Users/ej/Projects/cogochi_2/static/cogochi/logo.glb",
        type=Path,
        help="GLB output path.",
    )
    parser.add_argument("--size", type=int, default=128, help="2D resampling size.")
    parser.add_argument("--depth", type=int, default=16, help="Extrusion depth slices.")
    parser.add_argument("--pad", type=int, default=10, help="Crop padding around the silhouette.")
    args = parser.parse_args()

    mask = load_mask(args.input, args.size, args.pad)
    positions, normals, faces = marching_solid(mask, args.depth)
    write_glb(args.output, positions, normals, faces.reshape(-1))
    print(f"Wrote {args.output} with {positions.shape[0]} verts and {faces.shape[0]} faces")


if __name__ == "__main__":
    main()
