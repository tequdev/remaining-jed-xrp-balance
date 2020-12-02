<template>
  <div class="container">
    <div class="chart-container my-3 mb-10">
      <ChartLine
        :chart-data="chartData"
        :options="chartOption"
        :styles="chartStyles"
      />
    </div>
    <v-row>
      <v-col v-for="avg in getAveraveTypeArray" :key="avg" cols="12" md="4">
        <v-card>
          <v-card-title class="pb-0">
            {{
              avg === getAveraveType.ThreeDay
                ? '3 Days Average'
                : avg === getAveraveType.Week
                ? '1 Week Average'
                : '1 Month average'
            }}
          </v-card-title>
          <v-card-title class="py-3">
            {{ getAvergeChange(avg).toLocaleString() }}
          </v-card-title>
          <v-card-subtitle class="py-4 pt-6">
            Estimated End Date :
            <span class="font-weight-medium">
              {{ estimatedDate(getAvergeChange(avg)) }}
            </span>
          </v-card-subtitle>
        </v-card>
      </v-col>
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
  ThreeDay,
  Week,
  Month,
}

@Component({
  async asyncData() {
    await balances.fetchBalanceData().then(() => {
      balances.getBalanceDataSet(ChartDataType.BALANCE)
      balances.getBalanceDataSet(ChartDataType.CHANGE)
    })
  },
})
export default class extends Vue {
  get getAveraveTypeArray() {
    const retArr: number[] = []
    for (
      let i: averageType = averageType.ThreeDay;
      i <= averageType.Month;
      i++
    ) {
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

  get estimatedDate() {
    return (average: number) => {
      console.log(
        'this.currentBalance - this.currentBalance / average:' +
          (this.currentBalance / average).toString()
      )
      return moment()
        .add(parseInt((this.currentBalance / average).toString()), 'days')
        .format('YYYY-MM-DD')
    }
  }

  get getAvergeChange() {
    return (type: averageType) => {
      let dateLen: number
      switch (type) {
        case averageType.ThreeDay:
          dateLen = 3
          break
        case averageType.Week:
          dateLen = 7
          break
        case averageType.Month:
          dateLen = 30
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
                return value.toLocaleString()
              },
            },
          },
          {
            id: 'y-axis-2',
            position: 'right',
            ticks: {
              callback(value, _index, _values) {
                return value.toLocaleString()
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
}
</script>
