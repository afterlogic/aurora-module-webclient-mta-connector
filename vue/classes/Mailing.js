import typesUtils from 'src/utils/types'

class Mailing {
  constructor (data) {
    this.email = typesUtils.pString(data.Email)
    this.id = typesUtils.pInt(data.Id)
    this.name = typesUtils.pString(data.Name)
  }
}

export default Mailing
