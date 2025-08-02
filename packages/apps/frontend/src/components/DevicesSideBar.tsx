export function DevicesSidebar() {
  const deviceTypes = ['router', 'switch', 'server', 'firewall'];

  
  return (
    <aside className="bg-gray-100 p-3 border-r">
      <h2 className="text-sm font-semibold mb-3">Devices</h2>

      <ul className="space-y-2">
        {deviceTypes.map(type => (
          <li
            key={type}
            className="px-3 py-2 rounded bg-white shadow text-center text-sm capitalize"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/reactflow', type);
              event.dataTransfer.effectAllowed = 'move';
            }}
          >
            {type}
          </li>
        ))}
      </ul>
    </aside>
  );
}
