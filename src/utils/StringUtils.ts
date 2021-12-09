export function progressPercentage(remain: number, total: number, format: string, barSize: number = 10, defaultChar: string = '▯', char: string = '▮') {
  if (remain > total) throw ('Invalid input format')

  let bars = ''
  const remainProcent = ((100 * remain) / total) / barSize;
  for (let i = 0; i < barSize; i++) {
    if (remainProcent > i) {
      bars += char;
    } else {
      bars += defaultChar;

    }

  }
  return format.replace('$bars', bars).replace('$remain', (remainProcent * 10).toString());

}