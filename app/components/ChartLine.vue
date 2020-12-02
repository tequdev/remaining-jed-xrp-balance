<script lang="ts">
/* eslint-disable import/no-named-as-default-member */
import { Component, Prop, mixins } from 'nuxt-property-decorator'
import Chart from 'chart.js'
import VueChart from 'vue-chartjs'
const Line = VueChart.Line
const reactiveProp = VueChart.mixins.reactiveProp

@Component({})
export default class ChartLine extends mixins(Line, reactiveProp) {
  @Prop({ default: {} })
  chartData!: Chart.ChartData

  @Prop({ default: {} })
  options!: Chart.ChartOptions

  mounted() {
    this.renderChart(this.chartData, this.options)
  }
}
</script>
