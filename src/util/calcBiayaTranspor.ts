export default (jarak: number) => {
  let biayaTranspor
  let biayaAwalTranspor = parseInt(process.env.TRANSPORT_PER_KM_PRICE)
  let biayaTransporStr = ((jarak / 1000) * biayaAwalTranspor).toFixed(0)
  if (biayaTransporStr.length > 3) {
    biayaTransporStr = biayaTransporStr.slice(0, -3) + '000'
    biayaTranspor = parseInt(biayaTransporStr)
    if (biayaTranspor < biayaAwalTranspor) biayaTranspor = biayaAwalTranspor
  } else biayaTranspor = biayaAwalTranspor
  return biayaTranspor
}
