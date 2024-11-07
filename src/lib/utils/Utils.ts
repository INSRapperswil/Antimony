import {FetchState} from '@sb/types/Types';

export function matchesSearch(value: string, search: string) {
  return value.toLowerCase().includes(search.toLowerCase());
}

export function combinedFetchState(...fetchStates: FetchState[]): FetchState {
  const states = new Set(fetchStates);
  if (states.has(FetchState.Error)) return FetchState.Error;
  if (states.has(FetchState.Pending)) return FetchState.Pending;

  return FetchState.Done;
}

export function filterSchemaEnum(values: string[] | undefined) {
  if (values === undefined) return undefined;

  const unqiueIndices = [];
  const filteredValues = new Set<string>();

  for (let i = 0; i < values.length; i++) {
    if (filteredValues.has(values[i].toLowerCase())) continue;

    filteredValues.add(values[i].toLowerCase());
    unqiueIndices.push(i);
  }

  return unqiueIndices.map(index => values[index]);
}

export function arrayOf(value: string, length: number) {
  return [...Array(length)].map(() => value);
}

export function drawGrid(ctx: CanvasRenderingContext2D) {
  const width = window.outerWidth;
  const height = window.outerHeight;
  const gridSpacing = 30;
  const gridExtent = 4;

  // ctx.globalCompositeOperation = 'destination-over';
  ctx.strokeStyle = 'rgba(34, 51, 56, 1)';
  ctx.beginPath();

  for (let x = -width * gridExtent; x <= width * gridExtent; x += gridSpacing) {
    ctx.beginPath();
    if (x % 4 === 0) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(41,61,67)';
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgb(39,58,64)';
    }
    ctx.moveTo(x, height * gridExtent);
    ctx.lineTo(x, -height * gridExtent);
    ctx.stroke();
  }
  for (
    let y = -height * gridExtent;
    y <= height * gridExtent;
    y += gridSpacing
  ) {
    ctx.beginPath();
    if (y % 4 === 0) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(41,61,67)';
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgb(39,58,64)';
    }
    ctx.moveTo(width * gridExtent, y);
    ctx.lineTo(-width * gridExtent, y);
    ctx.stroke();
  }
}
