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
  },
  physics: {
    barnesHut: {
      damping: 0.12,
      springConstant: 0.08,
    },
  },
};
