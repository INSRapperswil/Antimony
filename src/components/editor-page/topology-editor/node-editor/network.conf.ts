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
  },
  physics: {
    barnesHut: {
      damping: 0.2,
      springConstant: 0.02,
      springLength: 140,
      avoidOverlap: 0.9,
      centralGravity: -0,
    },
    maxVelocity: 40,
    minVelocity: 0.5,
  },
};
