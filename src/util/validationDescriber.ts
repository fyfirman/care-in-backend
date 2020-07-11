export default (errors) => {
  const messages = []

  errors.forEach((error) => {
    messages.push({
      property: error.property,
      errors: Object.values(error.constraints),
    })
  })

  return messages
}
