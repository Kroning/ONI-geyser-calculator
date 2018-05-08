const axios = require('axios')
const qs = require('querystring')

/**
 * Baidu AI OCR API
 * http://ai.baidu.com/docs#/OCR-API/top
 */
class API {
  static async getAccessToken () {
    const params = {
      'grant_type': 'client_credentials',
      'client_id': process.env.CLIENT_ID,
      'client_secret': process.env.CLIENT_SECRET,
    }
    return axios.get('https://aip.baidubce.com/oauth/2.0/token', { params })
      .then(res => res.data.access_token)
      .catch(err => { throw new Error(err) })
  }

  static async ocr (token, image) {
    const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`
    const data = {
      image,
      language_type: 'CHN_ENG',
    }
    return axios.post(url, qs.stringify(data))
      .then(res => res.data.words_result)
      .catch(err => err)
  }

  static analyze (ocrResult) {
    const ret = {
      type: '',
      temp: 0,
      output: 0,
      ep: [],
      ap: [],
      origin_data: ocrResult,
    }
    for (let i of ocrResult) {
      let word = i.words
      if (word.length < 6) continue
      let match
      // 识别温泉种类和喷发量
      if ((match = word.match(/^(\S+)[;:]\S*?([.\d]+)(千?)克\/秒\S*/))) {
        const tempMatch = match[0].match(/(-?[.\d]+?)摄氏度/)
        if (!tempMatch) continue
        ret.temp = Number(tempMatch[1]) + 273.15 // 摄氏度转化为K
        ret.type = match[1]
        ret.output = match[2] * (match[3] ? 1000 : 1) // 识别到千克时进行单位换算
        continue
      }
      // 识别喷发期
      if ((match = word.match(/喷发\S+?[;:]\S*?(\d+)秒\S+?(\d+)秒/))) {
        ret.ep = [Number(match[1]), Number(match[2])]
        continue
      }
      // 识别活跃期
      if ((match = word.match(/活(?:跃期|动周期)[;:]\S*?([.\d]+)(?:个周期|天)\S*?([.\d]+)(?:个周期|天)/))) {
        ret.ap = [Number(match[1]), Number(match[2])]
        continue
      }
    }
    return ret
  }
}

module.exports = API
