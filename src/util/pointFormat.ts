export default (pointString) => {
  // initial format pointString = "POINT(lat lng)"
  const point = pointString.replace('POINT(', '').replace(')', '').split(' ')
  return { lat: parseFloat(point[0]), lng: parseFloat(point[1]) }
}
