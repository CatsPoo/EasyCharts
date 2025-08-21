import type { Device } from "@easy-charts/easycharts-types";

interface DevicesSideListProps{
  devicesList:Device[]
}
export function DevicesSidebar(
  {
    devicesList
  }:DevicesSideListProps
) {
  
  return (
    <aside className="bg-gray-100 p-3 border-r">
      <h2 className="text-sm font-semibold mb-3">Devices</h2>

      <ul className="space-y-2">
        {devicesList.map((device) => (
          <li
            key={device.id}
            className="px-3 py-2 rounded bg-white shadow text-center text-sm capitalize"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/reactflow", device.id);
              event.dataTransfer.effectAllowed = "move";
            }}
          >
            {device.name}
            {device.model.name}
            {device.vendor.name}
          </li>
        ))}
      </ul>
    </aside>
  );
}
