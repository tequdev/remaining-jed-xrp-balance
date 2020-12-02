import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import moment from 'moment'
import { $axios } from '../utils/api'

const apiBaseUrl = 'https://data.ripple.com/'

export enum ChartDataType {
  BALANCE,
  CHANGE,
}

export type balanceChangeDataType = {
  date: Date
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
const startDate = moment(new Date())
  .add(-1, 'days')
  .add(-36, 'month')
  .utc()
  .startOf('day')
const endDate = moment(new Date()).add(-1, 'days').utc().startOf('day')

const fetchInitialBalance = async (address: {
  name: string
  address: string
}) => {
  console.log('startDate: ' + startDate.toISOString())
  console.log('endData  : ' + endDate.toISOString())
  const responseBalances: Promise<responseBalancesType> = $axios.$get(
    apiBaseUrl + 'v2/accounts/' + address.address + /balances/,
    { params: { date: startDate.toISOString(), currency: 'XRP' } }
  )
  const initialBalance = await responseBalances
    .then((resData) => {
      return resData.balances[0].value
    })
    .catch(() => {
      return '0'
    })
  return parseFloat(initialBalance)
}

const fetchData = async (address: { name: string; address: string }) => {
  const processData: Array<balanceChangeDataType> = []
  let marker: string | undefined = ''
  while (marker !== undefined) {
    const responseBalanceChangeData: Promise<responseBalanceChangeType> = $axios.$get(
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

    await responseBalanceChangeData.then((resData) => {
      resData.balance_changes.forEach((b) => {
        if (
          b.change_type === 'payment_source' ||
          b.change_type === 'payment_destination'
        ) {
          const data: balanceChangeDataType = {
            date: moment(b.executed_time).utc().startOf('day').toDate(),
            balance: parseFloat(b.final_balance),
            // parseFloat(b.amount_change),
            change:
              b.change_type === 'payment_source'
                ? parseFloat(b.amount_change)
                : 0,
          }
          processData.push(data)
        }
      })
      // console.log(address.name + ':::' + marker)
      marker = resData.marker
    })
  }
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

  @Mutation
  appendExchangeData(data: balanceDataType) {
    this.balanceData.push(data)
  }

  @Mutation
  appendInitalBalanceData(data: number) {
    this.initialBalanceData.push(data)
  }

  @Action({ rawError: true })
  async fetchBalanceData() {
    for (const address of TARGET_ADDRESS) {
      await fetchInitialBalance(address).then((initialBalance) => {
        this.appendInitalBalanceData(initialBalance)
      })
      await fetchData(address).then((rtnData) => {
        const appendData: balanceDataType = {
          name: address.name,
          address: address.address,
          data: rtnData,
        }
        console.log(address.name + ' : ' + appendData.data.length)
        this.appendExchangeData(appendData)
      })
    }
    // console.log('balanceData::count : ' + this.balanceData.length)
  }

  get getDateList() {
    const dateList: Array<moment.Moment> = []
    for (const d = startDate; d.isSameOrBefore(endDate); d.add(1, 'day')) {
      dateList.push(moment(new Date(d.toDate())))
    }
    return dateList
  }

  get getBalanceDataSet() {
    return (type: ChartDataType) => {
      const befBalance: number[] = this.initialBalanceData
      console.log(befBalance)
      const retData = this.getDateList.map((date) => {
        const balanceDataList = this.balanceData.map((data, balanceIdx) => {
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
            balanceDataList[
              this.balanceData.findIndex((b) => {
                return b.name === 'Jed(tacostand)'
              })
            ] * -1
          )
        }
      })

      return {
        type: type === ChartDataType.BALANCE ? 'line' : 'bar',
        label: type === ChartDataType.BALANCE ? 'Balance' : 'Change',
        data: retData,
        yAxisID: type === ChartDataType.BALANCE ? 'y-axis-1' : 'y-axis-2',
      }
    }
  }

  get getBalanceData() {
    return this.balanceData
  }
}
