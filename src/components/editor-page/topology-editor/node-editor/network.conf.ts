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
    solver: 'repulsion',
    repulsion: {
      centralGravity: 0,
      springLength: 250,
      springConstant: 0.001,
      nodeDistance: 100,
      damping: 0.2,
    },
    stabilization: {
      enabled: true,
      iterations: 200,
      updateInterval: 10,
      fit: true,
    },
    maxVelocity: 40,
    minVelocity: 0.5,
  },
};
