<template>
  <div class="chart-container">
    <ChartLine
      :chart-data="chartData"
      :options="chartOption"
      :styles="chartStyles"
    />
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { ChartData, ChartOptions } from 'chart.js'
import moment from 'moment'
import { balances } from '../store/index'
import { ChartDataType } from '../store/balance'

@Component({
  async asyncData() {
    await balances.fetchBalanceData().then(() => {
      balances.getBalanceDataSet(ChartDataType.BALANCE)
      balances.getBalanceDataSet(ChartDataType.CHANGE)
    })
  },
})
export default class extends Vue {
  get balancesData() {
    return balances.getBalanceData
  }

  get dateList() {
    return balances.getDateList
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
