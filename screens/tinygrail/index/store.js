/*
 * @Author: czy0729
 * @Date: 2019-03-22 08:49:20
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-12-13 12:17:37
 */
import { Alert } from 'react-native'
import cheerio from 'cheerio-without-node-native'
import { observable, computed } from 'mobx'
import { userStore, tinygrailStore } from '@stores'
import { urlStringify, getTimestamp, formatNumber } from '@utils'
import store from '@utils/store'
import { info } from '@utils/ui'
import axios from '@utils/thirdParty/axios'
import {
  HOST,
  TINYGRAIL_APP_ID,
  TINYGRAIL_OAUTH_REDIRECT_URL
} from '@constants'
import { API_TINYGRAIL_TEST, API_TINYGRAIL_LOGOUT } from '@constants/api'

const namespace = 'ScreenTinygrail'
const errorStr = '/false'
const maxErrorCount = 3

export default class ScreenTinygrail extends store {
  state = observable({
    loading: false,
    loadingAssets: false,
    loadingBonus: false,
    currentBalance: 0,
    currentTotal: 0,
    lastBalance: 0,
    lastTotal: 0,
    _loaded: false
  })

  formhash = ''
  errorCount = 0

  init = async () => {
    // 初始化state
    const state = await this.getStorage(undefined, namespace)
    this.setState({
      ...state,
      loading: false
    })

    // 没有资产就自动授权
    let res = tinygrailStore.fetchAssets()
    const { _loaded } = await res
    if (!_loaded) {
      await this.doAuth()
    }

    // 获取资产和用户唯一标识
    await Promise.all([
      tinygrailStore.fetchAssets(),
      tinygrailStore.fetchHash()
    ])
    res = this.fetchCharaAssets()
    await res

    // 资产金额UI变动
    this.caculateChange()

    // 获取买单卖单数量
    if (!this.list('bid')._loaded) {
      tinygrailStore.fetchBid()
    }
    if (!this.list('asks')._loaded) {
      tinygrailStore.fetchAsks()
    }
    if (!this.list('auction')._loaded) {
      tinygrailStore.fetchAuction()
    }

    return res
  }

  // -------------------- fetch --------------------
  fetchCharaAssets = async () => {
    this.setState({
      loadingAssets: true
    })
    const res = tinygrailStore.fetchCharaAssets(this.hash)
    await res
    this.setState({
      loadingAssets: false
    })

    return res
  }

  refresh = async () => {
    const res = Promise.all([
      tinygrailStore.fetchAssets(),
      this.fetchCharaAssets()
    ])
    await res
    this.caculateChange()

    setTimeout(() => {
      tinygrailStore.fetchBid()
      tinygrailStore.fetchAsks()
      tinygrailStore.fetchAuction()
    }, 400)

    return res
  }

  // -------------------- get --------------------
  @computed get userCookie() {
    return userStore.userCookie
  }

  @computed get userInfo() {
    return userStore.userInfo
  }

  @computed get hash() {
    return tinygrailStore.hash
  }

  @computed get assets() {
    return tinygrailStore.assets
  }

  @computed get charaAssets() {
    return tinygrailStore.charaAssets(this.hash)
  }

  @computed get total() {
    const { balance } = this.assets
    const { characters, initials } = this.charaAssets
    return (
      characters.reduce((prev, cur) => prev + cur.state * cur.current, 0) +
      initials.reduce((prev, cur) => prev + cur.state, 0) +
      balance
    )
  }

  list(key = 'bid') {
    return computed(() => tinygrailStore.list(key)).get()
  }

  // -------------------- action --------------------
  /**
   * 小圣杯授权
   */
  doAuth = async () => {
    let res
    this.setState({
      loading: true
    })

    try {
      await this.logout()
      await this.oauth()
      res = this.authorize()

      // res = this.getAccessCookie()
      await res

      info('已更新授权')
      this.setState({
        loading: false,
        _loaded: getTimestamp()
      })
      this.setStorage(undefined, undefined, namespace)
    } catch (error) {
      info('授权失败请重试, 或检查登陆状态')
      this.setState({
        loading: false
      })
    }

    return res
  }

  /**
   * 预测股息
   */
  doTest = async () => {
    if (!tinygrailStore.cookie) {
      info('请先授权')
      return
    }

    try {
      axios.defaults.withCredentials = false
      const res = axios({
        method: 'get',
        url: API_TINYGRAIL_TEST(),
        headers: {
          Cookie: tinygrailStore.cookie
        }
      })

      const data = await res
      const { Total, Share } = data.data.Value
      Alert.alert(
        '股息预测',
        `本期计息股份共${formatNumber(Total, 0)}股, 预期股息₵${formatNumber(
          Share
        )}`,
        [
          {
            text: '确定'
          }
        ]
      )
    } catch (error) {
      info('获取股息预测失败')
    }
  }

  /**
   * 刮刮乐
   */
  doLottery = async navigation => {
    if (!tinygrailStore.cookie) {
      info('请先授权')
      return
    }

    try {
      this.setState({
        loadingBonus: true
      })
      const { State, Value, Message } = await tinygrailStore.doLottery()
      this.setState({
        loadingBonus: false
      })

      if (State === 0) {
        Alert.alert('操作成功', `${Value}，前往持仓查看吗`, [
          {
            text: '取消',
            style: 'cancel'
          },
          {
            text: '确定',
            onPress: () => {
              navigation.push('TinygrailCharaAssets', {
                form: 'lottery',
                message: Value
              })
            }
          }
        ])
      } else {
        info(Message)
      }
    } catch (error) {
      this.setState({
        loadingBonus: false
      })
      info('操作失败，可能授权过期了')
    }
  }

  /**
   * 每周分红
   */
  doGetBonusWeek = async () => {
    if (!tinygrailStore.cookie) {
      info('请先授权')
      return
    }

    try {
      this.setState({
        loadingBonus: true
      })
      const { State, Value, Message } = await tinygrailStore.doBonus()
      this.setState({
        loadingBonus: false
      })

      if (State === 0) {
        info(Value)
        await tinygrailStore.fetchAssets()
        this.caculateChange()
      } else {
        info(Message)
      }
    } catch (error) {
      this.setState({
        loadingBonus: false
      })
      info('操作失败，可能授权过期了')
    }
  }

  /**
   * 每周分红
   */
  doGetBonusDaily = async () => {
    if (!tinygrailStore.cookie) {
      info('请先授权')
      return
    }

    try {
      this.setState({
        loadingBonus: true
      })
      const { State, Value, Message } = await tinygrailStore.doBonusDaily()
      this.setState({
        loadingBonus: false
      })

      if (State === 0) {
        info(Value)
        await tinygrailStore.fetchAssets()
        this.caculateChange()
      } else {
        info(Message)
      }
    } catch (error) {
      this.setState({
        loadingBonus: false
      })
      info('操作失败，可能授权过期了')
    }
  }

  /**
   * 登出
   */
  logout = async () =>
    axios({
      method: 'post',
      url: API_TINYGRAIL_LOGOUT()
    })

  /**
   * 获取授权表单码
   */
  oauth = async () => {
    const { cookie, userAgent } = this.userCookie

    axios.defaults.withCredentials = false
    const res = axios({
      method: 'get',
      url: `${HOST}/oauth/authorize?client_id=${TINYGRAIL_APP_ID}&response_type=code&redirect_uri=${TINYGRAIL_OAUTH_REDIRECT_URL}`,
      headers: {
        Cookie: `chii_cookietime=2592000; ${cookie}`,
        'User-Agent': userAgent
      }
    })

    const data = await res
    const { request } = data
    const { _response } = request
    this.formhash = cheerio
      .load(_response)('input[name=formhash]')
      .attr('value')

    return res
  }

  /**
   * 授权
   */
  authorize = async () => {
    const { cookie, userAgent } = this.userCookie

    axios.defaults.withCredentials = false
    const res = axios({
      method: 'post',
      maxRedirects: 0,
      validateStatus: null,
      url: `${HOST}/oauth/authorize?client_id=${TINYGRAIL_APP_ID}&response_type=code&redirect_uri=${TINYGRAIL_OAUTH_REDIRECT_URL}${errorStr}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: `chii_cookietime=2592000; ${cookie}`,
        'User-Agent': userAgent
      },
      data: urlStringify({
        formhash: this.formhash,
        redirect_uri: '',
        client_id: TINYGRAIL_APP_ID,
        submit: '授权'
      })
    })
    const data = await res
    const { request } = data
    const { responseURL } = request

    // tinygrail服务器那边获取access_token也会失败, 需要重试
    if (!responseURL.includes('code=')) {
      this.errorCount += 1

      if (this.errorCount < maxErrorCount) {
        return this.authorize()
      }
      return false
    }

    tinygrailStore.updateCookie(
      `${data.headers['set-cookie'][0].split(';')[0]};`
    )

    return res
  }

  /**
   * 计算资金变动
   */
  caculateChange = () => {
    const { currentBalance, currentTotal } = this.state
    const { balance } = this.assets

    this.setState({
      currentBalance: balance,
      currentTotal: this.total,
      lastBalance: currentBalance,
      lastTotal: currentTotal
    })
    this.setStorage(undefined, undefined, namespace)
  }
}
