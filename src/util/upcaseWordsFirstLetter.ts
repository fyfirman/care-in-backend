export default (str) => {
  const splitStr = str.toLowerCase().split(' ')
  for (let i in splitStr) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1)
  }
  return splitStr.join(' ')
}
