export default (phoneNumber) => {
  phoneNumber = phoneNumber
    .replace(/[^\w\s]/gi, '')
    .replace(/[^0-9]/gi, '')
    .replace(/\s/g, '')
  while (phoneNumber.charAt(0) === '0') phoneNumber = phoneNumber.substr(1)
  if (phoneNumber.substr(0, 2) === '62') phoneNumber = phoneNumber.substr(2)

  return '+62' + phoneNumber
}
