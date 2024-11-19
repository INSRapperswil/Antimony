export const NetworkOptions = {
  layout: {
    hierarchical: false,
  },
  nodes: {
    shape: 'image',
    color: '#42b5ac',
    font: {
      face: 'Figtree',
      color: '#42b5ac',
    },
    size: 30,
  },
  edges: {
    color: '#42b5ac',
    chosen: false,
    arrows: {
      from: {
        enabled: false,
      },
      middle: {
        enabled: false,
      },
      to: {
        enabled: false,
      },
    },
    width: 2,
    smooth: {
      enabled: true,
      type: 'dynamic',
      roundness: 0,
    },
  },
  physics: {
    solver: 'forceAtlas2Based',
    forceAtlas2Based: {
      theta: 0.5,
      damping: 0.7,
      springConstant: 0.2,
      avoidOverlap: 0,
    },
    stabilization: {
      enabled: true,
      iterations: 800,
      updateInterval: 8,
      fit: true,
    },
    maxVelocity: 40,
    minVelocity: 0.5,
  },
};
