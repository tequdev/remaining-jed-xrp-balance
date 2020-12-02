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
    if (balances.getBalanceData.length === 0) {
      await balances.fetchBalanceData()
      console.log('fetch END')
    }
  },
})
export default class extends Vue {
  get balancesData() {
    return balances.balanceData
  }

  get chartData() {
    const chartData: ChartData = {
      // 横軸のラベル
      labels: balances.getDateList.map((d) => {
        return moment(d).format('YYYY-MM-DD')
      }),
      // データのリスト
      datasets: [
        balances.getBalanceDataSet(ChartDataType.BALANCE),
        balances.getBalanceDataSet(ChartDataType.CHANGE),
      ],
    }
    console.log('fetched chartData')
    console.log(chartData.datasets)
    return chartData
  }

  get chartOption() {
    // チャートのオプション
    const chartOption: ChartOptions = {
      // アスペクト比を固定しないように変更
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            id: 'y-axis-1', // Y軸のID
            position: 'left', // どちら側に表示される軸か？

            ticks: {
              // suggestedMin:0,
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
