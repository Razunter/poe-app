export const convertVersionToInt = (versionString: string) => {
  const vArray = versionString.split('.')
  for (const [index, vArrayItem] of vArray.entries()) {
    if (vArrayItem.length < 2) {
      vArray[index] = '0' + vArrayItem
    }
  }

  return Number.parseInt(vArray.join(''), 10)
}
