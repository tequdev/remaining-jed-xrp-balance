<template>
  <div class="container">
    <div class="chart-container my-3 mb-10">
      <ChartLine
        :chart-data="chartData"
        :options="chartOption"
        :styles="chartStyles"
      />
    </div>
    <v-row justify="center" class="mb-10">
      <v-col cols="12"> <h3>Remaining</h3> </v-col>
      <v-col cols="12" lg="4">
        <v-card class="py-5">
          <v-card-title class="pb-0 text-h5 text-center">
            Remaining &nbsp; <span>(at UTC 0:00)</span>
          </v-card-title>
          <v-card-text>&nbsp;</v-card-text>
          <v-card-title class="py-3 text-center">
            {{ parseInt(currentBalance).toLocaleString() }} XRP
          </v-card-title>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card class="py-5">
          <v-card-title class="pb-0 text-h5 text-center">
            Remaining &nbsp; <span>(RealTime)</span>
          </v-card-title>
          <v-card-text>tacostand Wallet, etc.</v-card-text>
          <v-card-title class="py-3 text-center">
            {{
              realTimeBalance
                ? `${parseInt(realTimeBalance).toLocaleString()} XRP`
                : `loading...`
            }}
          </v-card-title>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card class="py-5">
          <v-card-title class="pb-0 text-h5 text-center">
            Remaining &nbsp; <span>(RealTime)</span>
          </v-card-title>
          <v-card-text>Wallet for Dex trade (XRP -> USD)</v-card-text>
          <v-card-title class="py-3 text-center">
            {{
              realTimeDexTradeBalance
                ? `${parseInt(realTimeDexTradeBalance).toLocaleString()} XRP`
                : `loading...`
            }}
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12"><h3>Average</h3></v-col>
      <v-col v-for="avg in getAveraveTypeArray" :key="avg" cols="12" md="4">
        <v-card>
          <v-card-title class="pb-0 text-h5">
            {{
              avg === getAveraveType.Week
                ? '1 Week Average'
                : avg === getAveraveType.Month
                ? '1 Month Average'
                : '3 Months Average'
            }}
          </v-card-title>
          <v-card-title class="py-3 text-center">
            {{ getAvergeChange(avg).toLocaleString() }} XRP
          </v-card-title>
          <v-card-subtitle class="py-4 pt-6">
            Estimated End Date :<br />
            <span class="font-weight-medium text-h6">
              {{ estimatedDate(getAvergeChange(avg)) }}
            </span>
            <span class="font-weight-medium text-h6 text-right">
              ({{ estimatedDaysleft(estimatedDate(getAvergeChange(avg))) }} Days
              left )
            </span>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="mt-12">
      <v-spacer />
      <v-col cols="10" md="5">
        <v-list>
          <v-list-item-title class="title text-center">
            Last 30 days Release
          </v-list-item-title>
          <v-subheader class="title px-auto" />
          <v-list-item
            v-for="data in last30DaysChange"
            :key="data.date.toString()"
          >
            <v-list-item-content class="px-auto">
              <v-list-item-title class="text-center">
                {{ data.date.format('YYYY-MM-DD') }}
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-content class="px-auto">
              <v-list-item-title class="text-center">
                {{ parseInt(data.change.toString()).toLocaleString() }} XRP
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
      <v-spacer />
    </v-row>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { ChartData, ChartOptions } from 'chart.js'
import moment from 'moment'
import { balances } from '../store/index'
import { ChartDataType } from '../store/balance'

enum averageType {
  // ThreeDay,
  Week,
  Month,
  Month3,
}

@Component({
  async asyncData() {
    await balances.fetchBalanceData().then(() => {
      balances.getBalanceDataSet(ChartDataType.BALANCE)
      balances.getBalanceDataSet(ChartDataType.CHANGE)
    })
  },
  async mounted() {
    await balances.getRealtimeBalance()
    await balances.getRealtimeDexAccountBalance()
  },
})
export default class extends Vue {
  get getAveraveTypeArray() {
    const retArr: number[] = []
    for (let i: averageType = averageType.Week; i <= averageType.Month3; i++) {
      retArr.push(i)
    }
    return retArr
  }

  get getAveraveType() {
    return averageType
  }

  get balancesData() {
    return balances.getBalanceData
  }

  get dateList() {
    return balances.getDateList
  }

  get getChangeData() {
    return balances.getChangeData
  }

  get last30DaysChange() {
    const dayCount = 30
    return balances.getBalanceChangeData
      .slice(dayCount * -1)
      .reverse()
      .map((change, index) => {
        return {
          date: moment()
            .utc()
            .subtract(index + 1, 'days')
            .startOf('days'),
          change,
        }
      })
  }

  get estimatedDate() {
    return (average: number) => {
      return moment()
        .add(Math.ceil(this.currentBalance / average), 'days')
        .format('YYYY-MM-DD')
    }
  }

  get estimatedDaysleft() {
    return (date: string) => {
      return moment(date).diff(moment(), 'days')
    }
  }

  get getAvergeChange() {
    return (type: averageType) => {
      let dateLen: number
      switch (type) {
        // case averageType.ThreeDay:
        //   dateLen = 3
        //   break
        case averageType.Week:
          dateLen = 7
          break
        case averageType.Month:
          dateLen = 30
          break
        case averageType.Month3:
          dateLen = 90
          break
        default:
          dateLen = 30
          break
      }
      return parseInt(
        (
          this.getChangeData.slice(dateLen * -1).reduce((sum, element) => {
            return sum + element
          }, 0) / dateLen
        ).toString()
      )
    }
  }

  get currentBalance() {
    return balances.getChartDatasets[0].data![
      balances.getChartDatasets[0].data!.length - 1
    ] as number
  }

  get realTimeBalance() {
    return balances.realTimeBalance
  }

  get realTimeDexTradeBalance() {
    return balances.realTimeDexAccountBalance
  }

  get chartData() {
    const chartData: ChartData = {
      // 横軸のラベル
      labels: this.dateList.map((d) => {
        return moment(d).format('YYYY-MM-DD')
      }),
      // データのリスト
      datasets: balances.getChartDatasets,
    }
    return chartData
  }

  get chartOption() {
    const chartOption: ChartOptions = {
      maintainAspectRatio: false,
      tooltips: {
        callbacks: {
          label(item) {
            return item.yLabel!.toLocaleString()
          },
        },
      },
      scales: {
        yAxes: [
          {
            id: 'y-axis-1',
            position: 'left',
            ticks: {
              suggestedMin: 0,
              callback(value, _index, _values) {
                return ((value as number) / 1000000).toLocaleString() + ' m'
              },
            },
          },
          {
            id: 'y-axis-2',
            position: 'right',
            ticks: {
              callback(value, _index, _values) {
                return ((value as number) / 1000000).toLocaleString() + ' m'
              },
            },
          },
        ],
      },
    }
    return chartOption
  }

  get chartStyles() {
    // チャートのスタイル: <canvas>のstyle属性として設定
    const chartStyles = {
      height: '100%',
      width: '100%',
    }
    return chartStyles
  }

  // monetized = false
  // mounted() {
  //   if ((document as any).monetization) {
  //     ;(document as any).monetization.addEventListener(
  //       'monetizationprogress',
  //       this.monetizeEvent
  //     )
  //     this.monetized = true
  //   }
  // }

  // destroyed() {
  //   if ((document as any).monetization) {
  //     ;(document as any).monetization.removeEventListener(
  //       'monetizationprogress',
  //       this.monetizeEvent
  //     )
  //     this.monetized = false
  //   }
  // }

  monetizeEvent(_ev: any) {}
}
</script>
