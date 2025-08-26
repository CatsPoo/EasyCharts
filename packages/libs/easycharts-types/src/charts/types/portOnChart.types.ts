export const PortSideValues = ["left", "right", "top", "bottom"] as const;
export type PortSide = (typeof PortSideValues)[number];

export const DirectionsValues = ["source", "target"] as const;
export type ConnectionDirection = (typeof DirectionsValues)[number];