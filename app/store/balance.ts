import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import moment from 'moment'
import { ChartDataSets } from 'chart.js'
import { XrplClient } from 'xrpl-client'
import { $axios } from '../utils/api'

const client = new XrplClient()

const apiBaseUrl = 'https://data.ripple.com/'
export const strict = false
export enum ChartDataType {
  BALANCE,
  CHANGE,
}

export type balanceChangeDataType = {
  date: moment.Moment
  balance: number
  change: number
}

export type balanceDataType = {
  name: string
  address: string
  data: Array<balanceChangeDataType>
}

interface balanceType {
  currency: string
  value: string
}

interface responseBalancesType {
  result: string
  // eslint-disable-next-line camelcase
  ledger_index: number
  // eslint-disable-next-line camelcase
  close_time: string
  limit: number
  balances: Array<balanceType>
}

interface balanceChangeDescriptorType {
  // eslint-disable-next-line camelcase
  amount_change: string
  // eslint-disable-next-line camelcase
  final_balance: string
  // eslint-disable-next-line camelcase
  node_index: number | undefined
  // eslint-disable-next-line camelcase
  tx_index: number
  // eslint-disable-next-line camelcase
  change_type: string
  currency: string
  // eslint-disable-next-line camelcase
  executed_time: string
  counterparty: string
  // eslint-disable-next-line camelcase
  ledger_index: number
  // eslint-disable-next-line camelcase
  tx_hash: string
}

interface responseBalanceChangeType {
  result: string
  count: number
  marker?: string
  // eslint-disable-next-line camelcase
  balance_changes: balanceChangeDescriptorType[]
}
// https://xrpscan.com/account/rEhKZcz5Ndjm9BzZmmKrtvhXPnSWByssDv
// https://xrpscan.com/account/rDbWJ9C7uExThZYAwV8m6LsZ5YSX3sa6US

const TARGET_ADDRESS: Array<{ name: string; address: string }> = [
  { name: 'Jed(tacostand)', address: 'rEhKZcz5Ndjm9BzZmmKrtvhXPnSWByssDv' },
  { name: 'Ripple(JedAccount)', address: 'rDbWJ9C7uExThZYAwV8m6LsZ5YSX3sa6US' },
  {
    name: 'Ripple(JedAccount)2',
    address: 'r4LxkCUXYTCUgwquN3BnsUxFacoVLjGFyF',
  },
  {
    name: 'Ripple(JedAccount)3',
    address: 'r9kkWNia8PmpR44L7mWZn33Hpff3CCzLjA',
  },
]
const startDate = moment()
  .subtract(1, 'days')
  .subtract(24, 'months')
  .utc()
  .startOf('days')
const endDate = moment().subtract(1, 'days').utc().endOf('days')

const fetchInitialBalance = async (address: {
  name: string
  address: string
}) => {
  console.log('fetchInitialBalance start : ' + address.name)
  const responseBalances: Promise<responseBalancesType> = $axios.$get(
    apiBaseUrl + 'v2/accounts/' + address.address + /balances/,
    { params: { date: startDate.toISOString(), currency: 'XRP' } }
  )
  console.log('fetchInitialBalance end : ' + address.name)
  try {
    return parseFloat((await responseBalances).balances[0].value)
  } catch {
    return 0
  }
}

const fetchData = async (address: { name: string; address: string }) => {
  console.log('fetchData start :' + address.name)
  const processData: Array<balanceChangeDataType> = []
  let marker: string | undefined = ''
  let nextFinalBalanceData: {
    // eslint-disable-next-line camelcase
    final_balance?: number
    date?: moment.Moment
    change?: number
  }
  while (marker !== undefined) {
    const resData: responseBalanceChangeType = await $axios.$get(
      apiBaseUrl + 'v2/accounts/' + address.address + /balance_changes/,
      {
        params: {
          limit: 1000,
          descending: true,
          marker,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      }
    )
    console.log(startDate.toISOString())
    console.log(endDate.toISOString())
    console.log(resData)
    resData.balance_changes.forEach((b) => {
      if (b.change_type === 'payment_source') {
        const data: balanceChangeDataType = {
          date: moment(b.executed_time).utc().startOf('day'),
          balance: parseFloat(b.final_balance),
          change: parseFloat(b.amount_change),
        }
        if (
          processData[processData.length - 1] &&
          processData[processData.length - 1].date.isSame(
            moment(b.executed_time).utc().startOf('day')
          )
        ) {
          processData[processData.length - 1].change += parseFloat(
            b.amount_change
          )
        } else {
          if (nextFinalBalanceData && nextFinalBalanceData.date) {
            if (nextFinalBalanceData.date.isSame(data.date)) {
              // payment_source comes after payment_destination at the same day
              data.balance = nextFinalBalanceData.final_balance!
              data.change += nextFinalBalanceData.change!
            } else {
              // payment_source comes after payment_destination at the different day
              const befDataOnlyPaymentDestAtDay = {
                date: nextFinalBalanceData.date,
                balance: nextFinalBalanceData.final_balance!,
                change: nextFinalBalanceData.change!,
              }
              processData.push(befDataOnlyPaymentDestAtDay)
            }
          }
          processData.push(data)
          nextFinalBalanceData = {}
        }
      } else if (b.change_type === 'payment_destination') {
        if (
          processData[processData.length - 1] &&
          processData[processData.length - 1].date.isSame(
            moment(b.executed_time).utc().startOf('day')
          )
        ) {
          processData[processData.length - 1].change += parseFloat(
            b.amount_change
          )
        } else if (nextFinalBalanceData && nextFinalBalanceData.date) {
          // when payment_destination comes after payment_destionation
          if (
            nextFinalBalanceData.date.isSame(
              moment(b.executed_time).utc().startOf('day')
            )
          ) {
            // at the same day
            nextFinalBalanceData = {
              ...nextFinalBalanceData,
              change:
                nextFinalBalanceData.change! + parseFloat(b.amount_change),
            }
          } else {
            // at the diff day
            const befDataOnlyPaymentDestAtDay = {
              date: nextFinalBalanceData.date!,
              balance: nextFinalBalanceData.final_balance!,
              change: nextFinalBalanceData.change!,
            }
            processData.push(befDataOnlyPaymentDestAtDay)
            nextFinalBalanceData = {
              final_balance: parseFloat(b.final_balance),
              change: parseFloat(b.amount_change),
              date: moment(b.executed_time).utc().startOf('day'),
            }
          }
        } else {
          nextFinalBalanceData = {
            final_balance: parseFloat(b.final_balance),
            change: parseFloat(b.amount_change),
            date: moment(b.executed_time).utc().startOf('day'),
          }
        }
      }
    })
    marker = resData.marker
  }
  console.log('fetchData END : ' + address.name)
  return processData
}

@Module({
  name: 'balance',
  stateFactory: true,
  namespaced: true,
})
export default class balance extends VuexModule {
  balanceData: balanceDataType[] = []
  initialBalanceData: number[] = []
  chartDatasets: ChartDataSets[] = []
  dateList: moment.Moment[] = []
  balanceChangeData: number[] = []
  realTimeBalanceData: number | null = null

  @Mutation
  appendExchangeData(data: balanceDataType) {
    this.balanceData = [...this.balanceData, data]
  }

  @Mutation
  appendInitalBalanceData(data: number) {
    this.initialBalanceData = [...this.initialBalanceData, data]
  }

  @Mutation
  setChartDatasets(data: ChartDataSets) {
    this.chartDatasets = [...this.chartDatasets, data]
  }

  @Mutation
  setDateList(dates: moment.Moment[]) {
    this.dateList = [...dates]
  }

  @Mutation
  setBalanceChangeData(data: number[]) {
    this.balanceChangeData = [...data]
  }

  @Mutation
  setRealTimeBalanceData(data: number) {
    this.realTimeBalanceData = data
  }

  @Action({ rawError: true })
  async fetchBalanceData() {
    const dates: Array<moment.Moment> = []
    for (
      const d = startDate.clone();
      d.isSameOrBefore(endDate);
      d.add(1, 'day')
    ) {
      dates.push(moment(new Date(d.toDate())))
    }
    this.setDateList([...dates])

    for (const address of TARGET_ADDRESS) {
      const rtnData = await fetchData(address)
      const appendData: balanceDataType = {
        name: address.name,
        address: address.address,
        data: rtnData,
      }
      this.appendExchangeData({ ...appendData })

      const initBlance = await fetchInitialBalance(address)
      this.appendInitalBalanceData(initBlance)
    }
  }

  @Action({ rawError: true })
  getBalanceDataSet(type: ChartDataType) {
    console.log('getBalanceDataSet start')
    const befBalance: number[] = this.getInitialBalanceData
    const retData = this.getDateList.map((date) => {
      const balanceDataList = this.getBalanceData.map((data, balanceIdx) => {
        const findData = data.data.find((d) => {
          return moment(d.date).isSame(date)
        })

        const setBalance =
          findData === undefined ? befBalance[balanceIdx] : findData.balance
        const setChange = findData === undefined ? 0 : findData.change
        befBalance[balanceIdx] =
          findData === undefined ? befBalance[balanceIdx] : findData.balance

        return type === ChartDataType.BALANCE ? setBalance : setChange
      })
      if (type === ChartDataType.BALANCE) {
        return balanceDataList.reduce((sum, element) => {
          return sum + element
        })
      } else {
        return (
          balanceDataList.reduce((sum, element) => {
            return sum + element
          }) * -1
        )
      }
    })
    this.setBalanceChangeData([...retData])
    this.setChartDatasets({
      type: type === ChartDataType.BALANCE ? 'line' : 'bar',
      label: type === ChartDataType.BALANCE ? 'Balance' : 'Release',
      data: retData,
      yAxisID: type === ChartDataType.BALANCE ? 'y-axis-1' : 'y-axis-2',
      pointRadius: 0,
      borderColor:
        type === ChartDataType.BALANCE
          ? 'rgba(200,200,200,1)'
          : 'rgba(253,174,107,0.8)',
      backgroundColor:
        type === ChartDataType.BALANCE
          ? 'rgba(254,230,206,0.8)'
          : 'rgba(253,174,107,0.8)',
    })
    console.log('getBalanceDataSet end')
  }

  @Action({ rawError: true })
  async getRealtimeBalance() {
    const balances = await Promise.all(
      TARGET_ADDRESS.map((data) => {
        return (
          client
            .send({
              command: 'account_info',
              account: data.address,
            })
            // eslint-disable-next-line camelcase
            .then(({ account_data }) => {
              console.log(account_data)
              return parseInt(account_data.Balance) / 1000000
            })
        )
      })
    )
    const realtimeBalance = balances.reduce((prev, cur) => {
      return prev + cur
    }, 0)
    this.setRealTimeBalanceData(realtimeBalance)
  }

  get realTimeBalance() {
    return this.realTimeBalanceData
  }

  get getInitialBalanceData() {
    return this.initialBalanceData
  }

  get getDateList() {
    return this.dateList
  }

  get getBalanceChangeData() {
    return this.balanceChangeData
  }

  get getChartDatasets() {
    return this.chartDatasets
  }

  get getBalanceData() {
    return this.balanceData
  }

  get getChangeData() {
    return this.chartDatasets[1].data! as number[]
  }
}
