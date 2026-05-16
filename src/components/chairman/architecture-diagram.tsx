"use client";

import Link from "next/link";

interface Component {
  id: string;
  componentId: number;
  layer: number;
  name: string;
  status: string;
}

const statusColors: Record<string, string> = {
  pending: "#9CA3AF",
  in_progress: "#3B82F6",
  completed: "#10B981",
  blocked: "#EF4444",
};

export function ArchitectureDiagram({ components }: { components: Component[] }) {
  const layer1 = components.filter((c) => c.layer === 1);
  const layer2 = components.filter((c) => c.layer === 2);
  const layer3 = components.filter((c) => c.layer === 3);

  return (
    <div className="border rounded p-4">
      <h2 className="text-lg font-semibold mb-4">3-Layer Architecture</h2>

      {/* Layer 1: Spearheads */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p className="text-xs font-semibold text-blue-800 mb-2">Layer 1: Spearheads (80% resources)</p>
        <div className="flex flex-wrap gap-2">
          {layer1.map((comp) => (
            <Link
              key={comp.id}
              href={`/chairman/components/${comp.id}`}
              className="px-3 py-2 rounded text-white text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: statusColors[comp.status] ?? "#9CA3AF" }}
            >
              {comp.componentId}. {comp.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Layer 2: Foundations */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-xs font-semibold text-gray-800 mb-2">Layer 2: Foundations</p>
        <div className="flex flex-wrap gap-2">
          {layer2.map((comp) => (
            <Link
              key={comp.id}
              href={`/chairman/components/${comp.id}`}
              className="px-3 py-2 rounded text-white text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: statusColors[comp.status] ?? "#9CA3AF" }}
            >
              {comp.componentId}. {comp.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Layer 3: Future */}
      <div className="p-3 bg-yellow-50 rounded">
        <p className="text-xs font-semibold text-yellow-800 mb-2">Layer 3: Future (Gated)</p>
        <div className="flex flex-wrap gap-2">
          {layer3.map((comp) => (
            <Link
              key={comp.id}
              href={`/chairman/components/${comp.id}`}
              className="px-3 py-2 rounded text-white text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: statusColors[comp.status] ?? "#9CA3AF" }}
            >
              {comp.componentId}. {comp.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400 inline-block" /> Pending</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> In Progress</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Completed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Blocked</span>
      </div>
    </div>
  );
}
